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
import { motionControlCreditsForSeconds } from '@/lib/retail-pricing';

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

function toClientTask(task: AiTask): MotionControlTask {
  const info = parseJson<StoredTaskInfo>(task.taskInfo) ?? {};
  const result = persistedVideoResult(task.taskResult);
  const input = parseJson<Pick<MotionControlInput, 'quality'>>(task.options);
  const billedCredits =
    input?.quality && info.outputSeconds
      ? motionControlCreditsForSeconds({
          quality: input.quality,
          outputSeconds: info.outputSeconds,
        })
      : undefined;

  return {
    id: task.id,
    providerTaskId: task.taskId ?? null,
    model: task.model,
    status: task.status,
    progress: Math.max(0, Math.min(100, Number(info.progress) || 0)),
    resultUrls: result.urls,
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

    await db()
      .update(aiTask)
      .set({
        taskId: remote.taskId,
        status: remote.taskStatus,
        taskInfo: JSON.stringify(info),
        taskResult: JSON.stringify(remote.taskResult),
      })
      .where(eq(aiTask.id, localTask.id));

    return toClientTask({
      ...localTask,
      taskId: remote.taskId,
      status: remote.taskStatus,
      taskInfo: JSON.stringify(info),
      taskResult: JSON.stringify(remote.taskResult),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'EvoLink task failed';
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
  if (!task.taskId || TERMINAL_STATUSES.has(task.status)) {
    return toClientTask(task);
  }

  const provider = new EvolinkProvider({ apiKey: params.apiKey });
  const remote = await provider.query({ taskId: task.taskId });
  const info = taskInfoFromResult(remote);
  const [updated] = await db()
    .update(aiTask)
    .set({
      status: remote.taskStatus,
      taskInfo: JSON.stringify(info),
      taskResult: JSON.stringify(remote.taskResult),
    })
    .where(eq(aiTask.id, task.id))
    .returning();

  return toClientTask(updated ?? task);
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

  const resultUrls = persistedVideoResult(task.taskResult).urls;
  const resultUrl = resultUrls[params.index];
  if (!resultUrl || !isPublicHttpsUrl(resultUrl)) {
    throw new Error('Generated video is unavailable');
  }
  return resultUrl;
}
