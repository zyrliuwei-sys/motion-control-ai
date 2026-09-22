import { and, desc, eq, isNull } from 'drizzle-orm';

import {
  AIMediaType,
  AITaskStatus,
  EvolinkProvider,
  extractEvolinkVideoUrls,
} from '@/core/ai';
import { db } from '@/core/db';
import type { StorageManager } from '@/core/storage';
import { aiTask, type AiTask } from '@/config/db/schema';
import {
  EVOLINK_VIDEO_DURATION_LIMITS,
  EVOLINK_VIDEO_QUALITY_OPTIONS,
  evolinkVideoCreditsForSeconds,
  getEvolinkVideoModelFamily,
  type EvolinkVideoMode,
  type EvolinkVideoModelFamily,
  type EvolinkVideoQuality,
} from '@/lib/evolink-video-pricing';
import { motionControlCreditsForSeconds } from '@/lib/retail-pricing';
import { ImageModerationError } from '@/lib/seeapi-moderation';
import {
  moderateVideo,
  VideoModerationRejectedError,
  type VideoModerationSummary,
} from '@/lib/video-moderation';

const MODEL = 'kling-v3-motion-control';
const TERMINAL_STATUSES = new Set<string>([
  AITaskStatus.SUCCESS,
  AITaskStatus.FAILED,
  AITaskStatus.CANCELED,
]);

export interface MotionControlInput {
  prompt?: string;
  imageUrls: string[];
  videoUrls: string[];
  quality: '720p' | '1080p';
  characterOrientation: 'image' | 'video';
  keepSound?: boolean;
  elementList?: Array<{ elementId: string }>;
  watermarkEnabled?: boolean;
  callbackUrl?: string;
}

export interface VideoGenerationInput {
  model: string;
  mode: EvolinkVideoMode;
  prompt: string;
  imageUrls: string[];
  duration: number;
  quality: EvolinkVideoQuality;
  aspectRatio: string;
  generateAudio?: boolean;
}

export interface MotionControlTask {
  id: string;
  providerTaskId: string | null;
  model: string;
  status: string;
  progress: number;
  resultUrls: string[];
  isArchived: boolean;
  billedCredits?: number;
  errorMessage?: string;
  createdAt: string;
}

type StoredTaskInfo = {
  canCancel?: boolean;
  errorCode?: string;
  errorMessage?: string;
  estimatedTime?: number;
  outputSeconds?: number;
  progress?: number;
  providerStatus?: string;
  moderation?: {
    checkedAt: string;
    mediaType: 'video';
    provider: 'seeapi';
    status: 'failed' | 'passed' | 'pending' | 'rejected';
    videos?: VideoModerationSummary[];
  };
};

function parseJson<T>(value: string | null | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function persistedVideoResult(value: string | null | undefined) {
  const parsed = parseJson<unknown>(value);
  if (isRecord(parsed)) {
    const archivedUrls = Array.isArray(parsed.archivedVideoUrls)
      ? parsed.archivedVideoUrls.filter(
          (url): url is string =>
            typeof url === 'string' && isPublicHttpsUrl(url)
        )
      : [];
    if (archivedUrls.length) return { isArchived: true, urls: archivedUrls };
    if ('providerResult' in parsed) {
      return {
        isArchived: false,
        urls: extractEvolinkVideoUrls(parsed.providerResult),
      };
    }
  }

  return { isArchived: false, urls: extractEvolinkVideoUrls(parsed) };
}

function isPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    const hostname = url.hostname.toLowerCase();
    return !(
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    );
  } catch {
    return false;
  }
}

function validateInput(input: MotionControlInput) {
  if (!input.imageUrls.length || !input.videoUrls.length) {
    throw new Error('Upload one reference image and one reference video');
  }
  if (
    ![...input.imageUrls, ...input.videoUrls].every((url) =>
      isPublicHttpsUrl(url)
    )
  ) {
    throw new Error('Reference files must use public HTTPS URLs');
  }
  if (input.prompt && input.prompt.length > 2500) {
    throw new Error('Prompt must be 2500 characters or fewer');
  }
  if (input.quality !== '720p' && input.quality !== '1080p') {
    throw new Error('Quality must be 720p or 1080p');
  }
  if (
    input.characterOrientation !== 'image' &&
    input.characterOrientation !== 'video'
  ) {
    throw new Error('Character orientation must be image or video');
  }
  if (input.elementList && input.elementList.length > 1) {
    throw new Error('At most one character element may be supplied');
  }
  if (input.elementList?.length && input.characterOrientation !== 'video') {
    throw new Error('Character element references require video orientation');
  }
  if (input.callbackUrl && !isPublicHttpsUrl(input.callbackUrl)) {
    throw new Error('Callback URL must be a public HTTPS URL');
  }
}

function validateVideoGenerationInput(input: VideoGenerationInput) {
  const model = getEvolinkVideoModelFamily(input.model);
  if (!model) throw new Error('Unsupported EvoLink video model');
  if (!input.prompt.trim()) throw new Error('Prompt is required');
  if (input.prompt.length > 7000) {
    throw new Error('Prompt must be 7000 characters or fewer');
  }

  const limits = EVOLINK_VIDEO_DURATION_LIMITS[model];
  if (
    !Number.isInteger(input.duration) ||
    input.duration < limits.min ||
    input.duration > limits.max
  ) {
    throw new Error(
      `${model} supports videos from ${limits.min} to ${limits.max} seconds`
    );
  }
  if (!EVOLINK_VIDEO_QUALITY_OPTIONS[model].includes(input.quality)) {
    throw new Error(`Quality ${input.quality} is not available for ${model}`);
  }
  if (
    input.mode !== 'text-to-video' &&
    (!input.imageUrls.length ||
      !input.imageUrls.every((url) => isPublicHttpsUrl(url)))
  ) {
    throw new Error('Upload at least one reference image before generating');
  }
  if (input.mode === 'text-to-video' && input.imageUrls.length) {
    throw new Error('Text-to-video does not accept reference images');
  }
  if (input.imageUrls.length > (input.mode === 'image-to-video' ? 2 : 30)) {
    throw new Error('Too many reference images');
  }
}

function toClientTask(task: AiTask): MotionControlTask {
  const info = parseJson<StoredTaskInfo>(task.taskInfo) ?? {};
  const result = persistedVideoResult(task.taskResult);
  const resultIsModerated = info.moderation?.status === 'passed';
  const input = parseJson<Record<string, unknown>>(task.options);
  const motionQuality =
    input?.quality === '720p' || input?.quality === '1080p'
      ? input.quality
      : undefined;
  const videoModel = getEvolinkVideoModelFamily(task.model);
  const videoQuality =
    input?.quality === '480p' ||
    input?.quality === '720p' ||
    input?.quality === '768p' ||
    input?.quality === '1080p'
      ? input.quality
      : undefined;
  const duration = Number(input?.duration);
  const billedCredits =
    videoModel && videoQuality && Number.isFinite(duration)
      ? evolinkVideoCreditsForSeconds({
          model: videoModel,
          quality: videoQuality,
          durationSeconds: duration,
        })
      : motionQuality && info.outputSeconds
        ? motionControlCreditsForSeconds({
            quality: motionQuality,
            outputSeconds: info.outputSeconds,
          })
        : undefined;

  return {
    id: task.id,
    providerTaskId: task.taskId ?? null,
    model: task.model,
    status: task.status,
    progress: Math.max(0, Math.min(100, Number(info.progress) || 0)),
    // A provider result is private until every output video has passed the
    // server-side SeeAPI keyframe review. Missing moderation is never a pass.
    resultUrls:
      task.status === AITaskStatus.SUCCESS && resultIsModerated
        ? result.urls
        : [],
    isArchived: result.isArchived,
    ...(billedCredits === undefined ? {} : { billedCredits }),
    ...(info.errorMessage ? { errorMessage: info.errorMessage } : {}),
    createdAt: task.createdAt.toISOString(),
  };
}

function taskInfoFromResult(result: {
  taskInfo?: {
    status?: string;
    errorCode?: string;
    errorMessage?: string;
  };
  taskResult?: {
    progress?: unknown;
    task_info?: {
      can_cancel?: unknown;
      estimated_time?: unknown;
      video_duration?: unknown;
    };
  };
}): StoredTaskInfo {
  const remote = result.taskResult;
  const outputSeconds = Number(remote?.task_info?.video_duration);
  return {
    providerStatus: result.taskInfo?.status,
    errorCode: result.taskInfo?.errorCode,
    errorMessage: result.taskInfo?.errorMessage,
    progress: Number(remote?.progress) || 0,
    canCancel: Boolean(remote?.task_info?.can_cancel),
    estimatedTime: Number(remote?.task_info?.estimated_time) || undefined,
    outputSeconds:
      Number.isFinite(outputSeconds) && outputSeconds > 0
        ? outputSeconds
        : undefined,
  };
}

function pendingVideoModeration(): NonNullable<StoredTaskInfo['moderation']> {
  return {
    checkedAt: new Date().toISOString(),
    provider: 'seeapi',
    mediaType: 'video',
    status: 'pending',
  };
}

function failedVideoModeration(): NonNullable<StoredTaskInfo['moderation']> {
  return {
    checkedAt: new Date().toISOString(),
    provider: 'seeapi',
    mediaType: 'video',
    status: 'failed',
  };
}

async function moderateTaskVideoResult(params: {
  apiKey: string;
  task: AiTask;
  taskInfo: StoredTaskInfo;
  resultUrls: string[];
}): Promise<{ status: AITaskStatus; taskInfo: StoredTaskInfo }> {
  const { apiKey, task, taskInfo, resultUrls } = params;
  if (!resultUrls.length) {
    return {
      status: AITaskStatus.FAILED,
      taskInfo: {
        ...taskInfo,
        errorMessage: 'Generated video was not returned by the provider.',
        moderation: failedVideoModeration(),
      },
    };
  }

  try {
    const summaries: VideoModerationSummary[] = [];
    for (const [index, videoUrl] of resultUrls.entries()) {
      summaries.push(
        await moderateVideo({
          apiKey,
          videoUrl,
          idempotencyPrefix: `generated-video-${task.id}-${index}`,
        })
      );
    }

    return {
      status: AITaskStatus.SUCCESS,
      taskInfo: {
        ...taskInfo,
        moderation: {
          checkedAt: new Date().toISOString(),
          provider: 'seeapi',
          mediaType: 'video',
          status: 'passed',
          videos: summaries,
        },
      },
    };
  } catch (error) {
    if (error instanceof VideoModerationRejectedError) {
      return {
        status: AITaskStatus.FAILED,
        taskInfo: {
          ...taskInfo,
          errorMessage: 'Generated video did not pass the content review.',
          moderation: error.summary
            ? {
                checkedAt: error.summary.checkedAt,
                provider: 'seeapi',
                mediaType: 'video',
                status: 'rejected',
                videos: [error.summary],
              }
            : failedVideoModeration(),
        },
      };
    }
    if (error instanceof ImageModerationError) {
      const terminalFailure = error.status < 500;
      return {
        status: terminalFailure ? AITaskStatus.FAILED : AITaskStatus.PROCESSING,
        taskInfo: {
          ...taskInfo,
          errorMessage: error.message,
          moderation: terminalFailure
            ? {
                ...failedVideoModeration(),
                status: 'rejected',
              }
            : failedVideoModeration(),
        },
      };
    }
    throw error;
  }
}

async function saveVideoTaskState(params: {
  task: AiTask;
  status: AITaskStatus;
  taskInfo: StoredTaskInfo;
  taskResult: unknown;
}) {
  const taskInfo = JSON.stringify(params.taskInfo);
  const taskResult = JSON.stringify(params.taskResult);
  const [updated] = await db()
    .update(aiTask)
    .set({ status: params.status, taskInfo, taskResult })
    .where(eq(aiTask.id, params.task.id))
    .returning();
  return (
    updated ?? {
      ...params.task,
      status: params.status,
      taskInfo,
      taskResult,
    }
  );
}

/** Submit a pre-authorized EvoLink Kling 3.0 motion-control task. */
export async function submitMotionControlTask(params: {
  taskId: string;
  userId: string;
  apiKey: string;
  input: MotionControlInput;
}): Promise<MotionControlTask> {
  const { taskId, userId, apiKey, input } = params;
  validateInput(input);

  const [localTask] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, taskId),
        eq(aiTask.userId, userId),
        eq(aiTask.provider, 'evolink'),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);

  if (!localTask) throw new Error('Video task not found');
  if (localTask.status !== AITaskStatus.PENDING) {
    throw new Error('Video task has already been submitted');
  }

  try {
    const provider = new EvolinkProvider({ apiKey });
    const remote = await provider.generate({
      params: {
        mediaType: AIMediaType.VIDEO,
        model: MODEL,
        prompt: input.prompt || '',
        callbackUrl: input.callbackUrl,
        options: input,
        async: true,
      },
    });
    const info = taskInfoFromResult(remote);
    const initialStatus =
      remote.taskStatus === AITaskStatus.SUCCESS
        ? AITaskStatus.PROCESSING
        : remote.taskStatus;
    if (remote.taskStatus === AITaskStatus.SUCCESS) {
      info.moderation = pendingVideoModeration();
    }

    await db()
      .update(aiTask)
      .set({
        taskId: remote.taskId,
        status: initialStatus,
        taskInfo: JSON.stringify(info),
        taskResult: JSON.stringify(remote.taskResult),
      })
      .where(eq(aiTask.id, localTask.id));

    return toClientTask({
      ...localTask,
      taskId: remote.taskId,
      status: initialStatus,
      taskInfo: JSON.stringify(info),
      taskResult: JSON.stringify(remote.taskResult),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'AI generation task failed';
    await db()
      .update(aiTask)
      .set({
        status: AITaskStatus.FAILED,
        taskInfo: JSON.stringify({ errorMessage: message, progress: 0 }),
      })
      .where(eq(aiTask.id, localTask.id));
    throw error;
  }
}

/** Submit a pre-authorized Seedance 2.5 or MiniMax H3 Max task. */
export async function submitVideoGenerationTask(params: {
  taskId: string;
  userId: string;
  apiKey: string;
  input: VideoGenerationInput;
}): Promise<MotionControlTask> {
  const { taskId, userId, apiKey, input } = params;
  validateVideoGenerationInput(input);

  const [localTask] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, taskId),
        eq(aiTask.userId, userId),
        eq(aiTask.provider, 'evolink'),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);

  if (!localTask) throw new Error('Video task not found');
  if (localTask.status !== AITaskStatus.PENDING) {
    throw new Error('Video task has already been submitted');
  }

  try {
    const provider = new EvolinkProvider({ apiKey });
    const remote = await provider.generateVideo({
      model: input.model,
      prompt: input.prompt,
      options: {
        mode: input.mode,
        imageUrls: input.imageUrls,
        duration: input.duration,
        quality: input.quality,
        aspectRatio: input.aspectRatio,
        generateAudio: input.generateAudio,
      },
    });
    const info = taskInfoFromResult(remote);
    const initialStatus =
      remote.taskStatus === AITaskStatus.SUCCESS
        ? AITaskStatus.PROCESSING
        : remote.taskStatus;
    if (remote.taskStatus === AITaskStatus.SUCCESS) {
      info.moderation = pendingVideoModeration();
    }

    await db()
      .update(aiTask)
      .set({
        taskId: remote.taskId,
        status: initialStatus,
        taskInfo: JSON.stringify(info),
        taskResult: JSON.stringify(remote.taskResult),
      })
      .where(eq(aiTask.id, localTask.id));

    return toClientTask({
      ...localTask,
      taskId: remote.taskId,
      status: initialStatus,
      taskInfo: JSON.stringify(info),
      taskResult: JSON.stringify(remote.taskResult),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'AI generation task failed';
    await db()
      .update(aiTask)
      .set({
        status: AITaskStatus.FAILED,
        taskInfo: JSON.stringify({ errorMessage: message, progress: 0 }),
      })
      .where(eq(aiTask.id, localTask.id));
    throw error;
  }
}

/** Read an owned task, refreshing its state from EvoLink while it is nonterminal. */
export async function getMotionControlTask(params: {
  userId: string;
  apiKey: string;
  moderationApiKey: string;
  taskId: string;
}): Promise<MotionControlTask> {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, params.taskId),
        eq(aiTask.userId, params.userId),
        eq(aiTask.provider, 'evolink'),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);

  if (!task) throw new Error('Video task not found');
  const storedInfo = parseJson<StoredTaskInfo>(task.taskInfo) ?? {};
  if (task.status === AITaskStatus.SUCCESS) {
    if (storedInfo.moderation?.status === 'passed') {
      return toClientTask(task);
    }
    const resolved = await moderateTaskVideoResult({
      apiKey: params.moderationApiKey,
      task,
      taskInfo: storedInfo,
      resultUrls: persistedVideoResult(task.taskResult).urls,
    });
    return toClientTask(
      await saveVideoTaskState({
        task,
        status: resolved.status,
        taskInfo: resolved.taskInfo,
        taskResult: task.taskResult,
      })
    );
  }
  if (!task.taskId || TERMINAL_STATUSES.has(task.status)) {
    return toClientTask(task);
  }

  const provider = new EvolinkProvider({ apiKey: params.apiKey });
  const remote = await provider.query({ taskId: task.taskId });
  let info = taskInfoFromResult(remote);
  let status = remote.taskStatus;
  if (remote.taskStatus === AITaskStatus.SUCCESS) {
    const resolved = await moderateTaskVideoResult({
      apiKey: params.moderationApiKey,
      task,
      taskInfo: info,
      resultUrls: persistedVideoResult(JSON.stringify(remote.taskResult)).urls,
    });
    status = resolved.status;
    info = resolved.taskInfo;
  }

  return toClientTask(
    await saveVideoTaskState({
      task,
      status,
      taskInfo: info,
      taskResult: remote.taskResult,
    })
  );
}

/** Read an owned Seedance/MiniMax task and refresh it while still running. */
export async function getVideoGenerationTask(params: {
  userId: string;
  apiKey: string;
  moderationApiKey: string;
  taskId: string;
}): Promise<MotionControlTask> {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, params.taskId),
        eq(aiTask.userId, params.userId),
        eq(aiTask.provider, 'evolink'),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);

  if (!task || !getEvolinkVideoModelFamily(task.model)) {
    throw new Error('Video task not found');
  }
  const storedInfo = parseJson<StoredTaskInfo>(task.taskInfo) ?? {};
  if (task.status === AITaskStatus.SUCCESS) {
    if (storedInfo.moderation?.status === 'passed') {
      return toClientTask(task);
    }
    const resolved = await moderateTaskVideoResult({
      apiKey: params.moderationApiKey,
      task,
      taskInfo: storedInfo,
      resultUrls: persistedVideoResult(task.taskResult).urls,
    });
    return toClientTask(
      await saveVideoTaskState({
        task,
        status: resolved.status,
        taskInfo: resolved.taskInfo,
        taskResult: task.taskResult,
      })
    );
  }
  if (!task.taskId || TERMINAL_STATUSES.has(task.status)) {
    return toClientTask(task);
  }

  const provider = new EvolinkProvider({ apiKey: params.apiKey });
  const remote = await provider.query({
    taskId: task.taskId,
    mediaType: AIMediaType.VIDEO,
    model: task.model,
  });
  let info = taskInfoFromResult(remote);
  let status = remote.taskStatus;
  if (remote.taskStatus === AITaskStatus.SUCCESS) {
    const resolved = await moderateTaskVideoResult({
      apiKey: params.moderationApiKey,
      task,
      taskInfo: info,
      resultUrls: persistedVideoResult(JSON.stringify(remote.taskResult)).urls,
    });
    status = resolved.status;
    info = resolved.taskInfo;
  }

  return toClientTask(
    await saveVideoTaskState({
      task,
      status,
      taskInfo: info,
      taskResult: remote.taskResult,
    })
  );
}

/** Return only the recent tasks created by the two public video routes. */
export async function listVideoGenerationTasks(params: {
  userId: string;
  limit?: number;
}): Promise<MotionControlTask[]> {
  const limit =
    params.limit === undefined
      ? undefined
      : Math.min(200, Math.max(1, params.limit));
  const query = db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, params.userId),
        eq(aiTask.provider, 'evolink'),
        isNull(aiTask.deletedAt)
      )
    )
    .orderBy(desc(aiTask.createdAt));
  const tasks =
    limit === undefined ? await query : await query.limit(limit * 2);

  return tasks
    .filter((task: AiTask) => Boolean(getEvolinkVideoModelFamily(task.model)))
    .slice(0, limit)
    .map(toClientTask);
}

/** Return the most recent persisted EvoLink tasks for restoring the result UI. */
export async function listMotionControlTasks(params: {
  userId: string;
  limit?: number;
}): Promise<MotionControlTask[]> {
  const limit = Math.min(20, Math.max(1, params.limit ?? 8));
  const tasks = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, params.userId),
        eq(aiTask.provider, 'evolink'),
        isNull(aiTask.deletedAt)
      )
    )
    .orderBy(desc(aiTask.createdAt))
    .limit(limit);

  return tasks.map(toClientTask);
}

/**
 * Copy a completed EvoLink result to the configured object storage. Provider
 * result URLs are short-lived, while this copy backs the user's video history.
 * Archive failures never hide an otherwise successful generated video.
 */
export async function archiveMotionControlResult(params: {
  userId: string;
  taskId: string;
  storage: StorageManager;
}): Promise<MotionControlTask> {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, params.taskId),
        eq(aiTask.userId, params.userId),
        eq(aiTask.provider, 'evolink'),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);

  if (!task || task.status !== AITaskStatus.SUCCESS) {
    throw new Error('Completed video task not found');
  }
  const moderation = parseJson<StoredTaskInfo>(task.taskInfo)?.moderation;
  if (moderation?.status !== 'passed') {
    throw new Error('Generated video is still pending content review');
  }

  const current = persistedVideoResult(task.taskResult);
  if (current.isArchived || !current.urls.length) return toClientTask(task);

  try {
    const archivedUrls: string[] = [];
    for (const [index, sourceUrl] of current.urls.entries()) {
      const uploaded = await params.storage.downloadAndUpload({
        url: sourceUrl,
        key: `evolink/generated/${task.id}/${index + 1}.mp4`,
        contentType: 'video/mp4',
        disposition: 'inline',
      });
      if (
        !uploaded.success ||
        !uploaded.url ||
        !isPublicHttpsUrl(uploaded.url)
      ) {
        return toClientTask(task);
      }
      archivedUrls.push(uploaded.url);
    }

    const originalResult = parseJson<unknown>(task.taskResult);
    const taskResult = JSON.stringify({
      archivedVideoUrls: archivedUrls,
      providerResult:
        isRecord(originalResult) && 'providerResult' in originalResult
          ? originalResult.providerResult
          : originalResult,
    });
    const [updated] = await db()
      .update(aiTask)
      .set({ taskResult })
      .where(eq(aiTask.id, task.id))
      .returning();

    return toClientTask(updated ?? { ...task, taskResult });
  } catch {
    return toClientTask(task);
  }
}

/**
 * Resolve a completed result only for its owner. The route uses this URL to
 * stream a browser download without exposing another user's task output.
 */
export async function getMotionControlDownloadUrl(params: {
  userId: string;
  taskId: string;
  index: number;
}): Promise<string> {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, params.taskId),
        eq(aiTask.userId, params.userId),
        eq(aiTask.provider, 'evolink'),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);
  if (!task) throw new Error('Video task not found');
  if (
    task.status !== AITaskStatus.SUCCESS ||
    parseJson<StoredTaskInfo>(task.taskInfo)?.moderation?.status !== 'passed'
  ) {
    throw new Error('Generated video is still pending content review');
  }

  const resultUrls = persistedVideoResult(task.taskResult).urls;
  const resultUrl = resultUrls[params.index];
  if (!resultUrl || !isPublicHttpsUrl(resultUrl)) {
    throw new Error('Generated video is unavailable');
  }
  return resultUrl;
}

/** Download guard shared by the public Seedance/MiniMax video history. */
export async function getVideoGenerationDownloadUrl(params: {
  userId: string;
  taskId: string;
  index: number;
}): Promise<string> {
  return getMotionControlDownloadUrl(params);
}
