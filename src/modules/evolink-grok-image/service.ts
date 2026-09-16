import { and, eq, isNull } from 'drizzle-orm';

import {
  AIMediaType,
  AITaskStatus,
  EvolinkProvider,
  extractEvolinkImageUrls,
} from '@/core/ai';
import { db } from '@/core/db';
import { aiTask, type AiTask } from '@/config/db/schema';
import {
  assertImagesAllowed,
  ImageModerationError,
  ImageModerationRejectedError,
  type ImageModerationSummary,
} from '@/lib/seeapi-moderation';

export const EVOLINK_GROK_IMAGINE_IMAGE_MODEL = 'grok-imagine-image-2.0';

const imageSizes = new Set([
  'auto',
  '1:1',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '16:9',
  '9:16',
  '2:1',
  '1:2',
  '19.5:9',
  '9:19.5',
  '20:9',
  '9:20',
]);
const terminalStatuses = new Set<string>([
  AITaskStatus.SUCCESS,
  AITaskStatus.FAILED,
  AITaskStatus.CANCELED,
]);

export type GrokImagineImageInput = {
  imageUrls?: string[];
  n?: number;
  prompt: string;
  quality?: 'low' | 'medium';
  resolution?: '1K' | '2K';
  size?: string;
};

export type GrokImagineImageTask = {
  createdAt: string;
  errorMessage?: string;
  id: string;
  mode: 'edit' | 'text';
  model: string;
  progress: number;
  providerTaskId: string | null;
  resultUrls: string[];
  status: string;
};

type StoredTaskInfo = {
  errorMessage?: string;
  moderation?:
    | ImageModerationSummary
    | {
        checkedAt: string;
        provider: 'seeapi';
        status: 'failed';
      };
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

function resultUrls(value: string | null | undefined): string[] {
  return extractEvolinkImageUrls(parseJson(value)).filter(isPublicHttpsUrl);
}

function taskMode(task: AiTask): 'edit' | 'text' {
  const input = parseJson<Pick<GrokImagineImageInput, 'imageUrls'>>(
    task.options
  );
  return input?.imageUrls?.length ? 'edit' : 'text';
}

function toClientTask(task: AiTask): GrokImagineImageTask {
  const info = parseJson<StoredTaskInfo>(task.taskInfo) ?? {};
  const resultIsModerated =
    !info.moderation || info.moderation.status === 'passed';

  return {
    id: task.id,
    providerTaskId: task.taskId ?? null,
    model: task.model,
    mode: taskMode(task),
    status: task.status,
    progress: Math.max(0, Math.min(100, Number(info.progress) || 0)),
    // Do not expose a result unless the provider task succeeded and the
    // generated image passed SeeAPI moderation. Legacy tasks without a
    // moderation record remain readable.
    resultUrls:
      task.status === AITaskStatus.SUCCESS && resultIsModerated
        ? resultUrls(task.taskResult)
        : [],
    createdAt: task.createdAt.toISOString(),
    ...(info.errorMessage ? { errorMessage: info.errorMessage } : {}),
  };
}

async function moderateGeneratedResult(params: {
  apiKey: string;
  imageUrls: string[];
  taskId: string;
}): Promise<ImageModerationSummary> {
  return assertImagesAllowed({
    apiKey: params.apiKey,
    idempotencyPrefix: `grok-image-${params.taskId}`,
    imageUrls: params.imageUrls,
  });
}

async function resolveRemoteTask(params: {
  localTask: AiTask;
  moderationApiKey: string;
  remote: {
    taskInfo?: { errorMessage?: string; status?: string };
    taskResult?: unknown;
    taskStatus: string;
  };
}) {
  const taskInfo = taskInfoFromRemote(params.remote);
  let status = params.remote.taskStatus;

  if (params.remote.taskStatus === AITaskStatus.SUCCESS) {
    const remoteResultUrls = resultUrls(
      JSON.stringify(params.remote.taskResult)
    );

    if (!remoteResultUrls.length) {
      status = AITaskStatus.FAILED;
      taskInfo.errorMessage =
        'Generated image was not returned by the provider.';
      taskInfo.moderation = {
        checkedAt: new Date().toISOString(),
        provider: 'seeapi',
        status: 'failed',
      };
    } else {
      try {
        taskInfo.moderation = await moderateGeneratedResult({
          apiKey: params.moderationApiKey,
          imageUrls: remoteResultUrls,
          taskId: params.localTask.id,
        });
        if (taskInfo.moderation.status === 'rejected') {
          status = AITaskStatus.FAILED;
          taskInfo.errorMessage =
            'Generated image did not pass the content review.';
        }
      } catch (error) {
        if (!(error instanceof ImageModerationRejectedError)) throw error;

        status = AITaskStatus.FAILED;
        taskInfo.errorMessage =
          'Generated image did not pass the content review.';
        taskInfo.moderation = {
          checkedAt: new Date().toISOString(),
          provider: 'seeapi',
          results: error.results,
          status: 'rejected',
        };
      }
    }
  }

  return { status, taskInfo };
}

function taskInfoFromRemote(remote: {
  taskInfo?: { errorMessage?: string; status?: string };
  taskResult?: unknown;
  taskStatus: string;
}): StoredTaskInfo {
  const result = remote.taskResult as { progress?: unknown } | undefined;
  const progress = Number(result?.progress);

  return {
    providerStatus: remote.taskInfo?.status,
    progress:
      remote.taskStatus === AITaskStatus.SUCCESS
        ? 100
        : Number.isFinite(progress)
          ? Math.max(0, Math.min(100, progress))
          : 0,
    ...(remote.taskInfo?.errorMessage
      ? { errorMessage: remote.taskInfo.errorMessage }
      : {}),
  };
}

export function validateGrokImagineImageInput(input: GrokImagineImageInput) {
  if (!input.prompt.trim()) throw new Error('Prompt is required');
  if (input.prompt.length > 2_500) {
    throw new Error('Prompt must be 2500 characters or fewer');
  }
  if (input.imageUrls && input.imageUrls.length > 3) {
    throw new Error('AI image generation supports at most 3 reference images');
  }
  if (input.imageUrls?.some((url) => !isPublicHttpsUrl(url))) {
    throw new Error('Reference images must use public HTTPS URLs');
  }
  if (input.size && !imageSizes.has(input.size)) {
    throw new Error('Unsupported image size');
  }
  if (
    input.resolution &&
    input.resolution !== '1K' &&
    input.resolution !== '2K'
  ) {
    throw new Error('Unsupported image resolution');
  }
  if (input.quality && input.quality !== 'low' && input.quality !== 'medium') {
    throw new Error('Unsupported image quality');
  }
  if (
    input.n !== undefined &&
    (!Number.isInteger(input.n) || input.n < 1 || input.n > 10)
  ) {
    throw new Error('n must be between 1 and 10');
  }
}

function providerOptions(input: GrokImagineImageInput) {
  return {
    ...(input.imageUrls?.length ? { imageUrls: input.imageUrls } : {}),
    size: input.size || 'auto',
    resolution: input.resolution || '1K',
    quality: input.quality || 'medium',
    n: input.n || 1,
  } as const;
}

/** Submit a pre-authorized Grok Imagine Image task to EvoLink. */
export async function submitGrokImagineImageTask(params: {
  apiKey: string;
  input: GrokImagineImageInput;
  taskId: string;
  userId: string;
}): Promise<GrokImagineImageTask> {
  validateGrokImagineImageInput(params.input);

  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, params.taskId),
        eq(aiTask.userId, params.userId),
        eq(aiTask.provider, 'evolink'),
        eq(aiTask.model, EVOLINK_GROK_IMAGINE_IMAGE_MODEL),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);

  if (!task) throw new Error('Image-generation task not found');
  if (task.status !== AITaskStatus.PENDING) {
    throw new Error('Image-generation task has already been submitted');
  }

  const provider = new EvolinkProvider({ apiKey: params.apiKey });
  const remote = await provider.generateImage({
    model: EVOLINK_GROK_IMAGINE_IMAGE_MODEL,
    prompt: params.input.prompt.trim(),
    options: providerOptions(params.input),
  });
  const initialTaskInfo = taskInfoFromRemote(remote);
  // Do not make the create request wait for output moderation. The provider
  // may already return a completed task, while SeeAPI can still take several
  // seconds to inspect the generated image. Keep it hidden from the client
  // until the normal polling path records a passed moderation result.
  const initialStatus =
    remote.taskStatus === AITaskStatus.SUCCESS
      ? AITaskStatus.PROCESSING
      : remote.taskStatus;
  const initialTask = {
    ...task,
    taskId: remote.taskId,
    status: initialStatus,
    taskInfo: JSON.stringify(initialTaskInfo),
    taskResult: JSON.stringify(remote.taskResult),
  };

  await db()
    .update(aiTask)
    .set({
      taskId: initialTask.taskId,
      status: initialTask.status,
      taskInfo: initialTask.taskInfo,
      taskResult: initialTask.taskResult,
    })
    .where(eq(aiTask.id, task.id));

  return toClientTask(initialTask);
}

/** Refresh a user-owned Grok Imagine Image task until it is terminal. */
export async function getGrokImagineImageTask(params: {
  apiKey: string;
  moderationApiKey: string;
  taskId: string;
  userId: string;
}): Promise<GrokImagineImageTask> {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, params.taskId),
        eq(aiTask.userId, params.userId),
        eq(aiTask.provider, 'evolink'),
        eq(aiTask.model, EVOLINK_GROK_IMAGINE_IMAGE_MODEL),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);

  if (!task) throw new Error('Image-generation task not found');
  if (terminalStatuses.has(task.status)) return toClientTask(task);
  if (!task.taskId) throw new Error('Image-generation task has no service ID');

  const provider = new EvolinkProvider({ apiKey: params.apiKey });
  const remote = await provider.query({
    taskId: task.taskId,
    mediaType: AIMediaType.IMAGE,
    model: EVOLINK_GROK_IMAGINE_IMAGE_MODEL,
  });
  let resolved: Awaited<ReturnType<typeof resolveRemoteTask>>;
  try {
    resolved = await resolveRemoteTask({
      localTask: task,
      moderationApiKey: params.moderationApiKey,
      remote,
    });
  } catch (error) {
    if (error instanceof ImageModerationRejectedError) {
      const failedTaskInfo: StoredTaskInfo = {
        ...taskInfoFromRemote(remote),
        errorMessage: 'Generated image did not pass the content review.',
        moderation: {
          checkedAt: new Date().toISOString(),
          provider: 'seeapi',
          results: error.results,
          status: 'rejected',
        },
      };
      const failedTask = {
        ...task,
        status: AITaskStatus.FAILED,
        taskInfo: JSON.stringify(failedTaskInfo),
        taskResult: JSON.stringify(remote.taskResult),
      };
      await db()
        .update(aiTask)
        .set({
          status: failedTask.status,
          taskInfo: failedTask.taskInfo,
          taskResult: failedTask.taskResult,
        })
        .where(eq(aiTask.id, task.id));
      return toClientTask(failedTask);
    }

    if (!(error instanceof ImageModerationError)) throw error;

    // A temporary moderation outage is not an upstream generation failure.
    // Keep the completed provider result private and retry moderation on the
    // next client poll instead of permanently failing/refunding the task.
    const pendingTaskInfo: StoredTaskInfo = {
      ...taskInfoFromRemote(remote),
      errorMessage: error.message,
      moderation: {
        checkedAt: new Date().toISOString(),
        provider: 'seeapi',
        status: 'failed',
      },
    };
    const pendingTask = {
      ...task,
      status:
        remote.taskStatus === AITaskStatus.SUCCESS
          ? AITaskStatus.PROCESSING
          : remote.taskStatus,
      taskInfo: JSON.stringify(pendingTaskInfo),
      taskResult: JSON.stringify(remote.taskResult),
    };
    await db()
      .update(aiTask)
      .set({
        status: pendingTask.status,
        taskInfo: pendingTask.taskInfo,
        taskResult: pendingTask.taskResult,
      })
      .where(eq(aiTask.id, task.id));
    return toClientTask(pendingTask);
  }
  const updatedTask = {
    ...task,
    status: resolved.status,
    taskInfo: JSON.stringify(resolved.taskInfo),
    taskResult: JSON.stringify(remote.taskResult),
  };

  await db()
    .update(aiTask)
    .set({
      status: updatedTask.status,
      taskInfo: updatedTask.taskInfo,
      taskResult: updatedTask.taskResult,
    })
    .where(eq(aiTask.id, task.id));

  return toClientTask(updatedTask);
}

/** Resolve an output URL while enforcing task ownership. */
export async function getGrokImagineImageResultUrl(params: {
  apiKey: string;
  index: number;
  moderationApiKey: string;
  taskId: string;
  userId: string;
}): Promise<string> {
  if (!Number.isInteger(params.index) || params.index < 0) {
    throw new Error('Invalid image index');
  }

  const task = await getGrokImagineImageTask(params);
  if (task.status !== AITaskStatus.SUCCESS) {
    throw new Error('Image is not ready to download');
  }

  const resultUrl = task.resultUrls[params.index];
  if (!resultUrl) throw new Error('Generated image not found');
  return resultUrl;
}
