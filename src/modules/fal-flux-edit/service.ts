import { and, eq, isNull } from 'drizzle-orm';

import {
  AIMediaType,
  AITaskStatus,
  FalProvider,
  type SaveFilesFunction,
} from '@/core/ai';
import { db } from '@/core/db';
import { aiTask, type AiTask } from '@/config/db/schema';
import { getUuid } from '@/lib/hash';

/** Current Fal identifier for the FLUX.2 [dev] image-editing endpoint. */
export const FAL_FLUX_2_EDIT_MODEL = 'fal-ai/flux-2/edit';

const imageSizes = new Set([
  'square_hd',
  'square',
  'portrait_4_3',
  'portrait_16_9',
  'landscape_4_3',
  'landscape_16_9',
]);
const accelerationLevels = new Set(['none', 'regular', 'high']);
const outputFormats = new Set(['jpeg', 'png', 'webp']);
const maximumImageReferenceCount = 10;
const terminalStatuses = new Set<string>([
  AITaskStatus.SUCCESS,
  AITaskStatus.FAILED,
  AITaskStatus.CANCELED,
]);

export type FalFlux2EditInput = {
  acceleration?: 'none' | 'regular' | 'high';
  guidanceScale?: number;
  imageSize?:
    | 'square_hd'
    | 'square'
    | 'portrait_4_3'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_16_9';
  imageUrls: string[];
  numImages?: number;
  numInferenceSteps?: number;
  outputFormat?: 'jpeg' | 'png' | 'webp';
  prompt: string;
  seed?: number;
};

export type FalFlux2EditTask = {
  createdAt: string;
  errorMessage?: string;
  id: string;
  model: string;
  progress: number;
  providerTaskId: string | null;
  resultUrls: string[];
  status: string;
};

type StoredTaskInfo = {
  errorMessage?: string;
  progress?: number;
  providerStatus?: string;
};

type FalImageResult = {
  images?: Array<{ url?: unknown }>;
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
  const result = parseJson<FalImageResult>(value);
  if (!Array.isArray(result?.images)) return [];

  return result.images.flatMap((image) =>
    typeof image.url === 'string' && isPublicHttpsUrl(image.url)
      ? [image.url]
      : []
  );
}

function toClientTask(task: AiTask): FalFlux2EditTask {
  const info = parseJson<StoredTaskInfo>(task.taskInfo) ?? {};

  return {
    id: task.id,
    providerTaskId: task.taskId ?? null,
    model: task.model,
    status: task.status,
    progress: Math.max(0, Math.min(100, Number(info.progress) || 0)),
    resultUrls: resultUrls(task.taskResult),
    createdAt: task.createdAt.toISOString(),
    ...(info.errorMessage ? { errorMessage: info.errorMessage } : {}),
  };
}

/**
 * Validates the public image URLs accepted by Fal. Keeping these URLs public
 * and HTTPS-only avoids turning this endpoint into a server-side request proxy.
 */
export function validateFlux2EditInput(input: FalFlux2EditInput) {
  if (!input.prompt.trim()) throw new Error('Prompt is required');
  if (input.prompt.length > 2_500) {
    throw new Error('Prompt must be 2500 characters or fewer');
  }
  if (
    !input.imageUrls.length ||
    input.imageUrls.length > maximumImageReferenceCount
  ) {
    throw new Error(
      `Provide between 1 and ${maximumImageReferenceCount} reference images`
    );
  }
  if (!input.imageUrls.every(isPublicHttpsUrl)) {
    throw new Error('Reference images must use public HTTPS URLs');
  }
  if (input.imageSize && !imageSizes.has(input.imageSize)) {
    throw new Error('Unsupported image size');
  }
  if (input.acceleration && !accelerationLevels.has(input.acceleration)) {
    throw new Error('Unsupported acceleration level');
  }
  if (input.outputFormat && !outputFormats.has(input.outputFormat)) {
    throw new Error('Unsupported output format');
  }
  if (
    input.numImages !== undefined &&
    (!Number.isInteger(input.numImages) ||
      input.numImages < 1 ||
      input.numImages > 4)
  ) {
    throw new Error('numImages must be between 1 and 4');
  }
  if (
    input.numInferenceSteps !== undefined &&
    (!Number.isInteger(input.numInferenceSteps) ||
      input.numInferenceSteps < 1 ||
      input.numInferenceSteps > 50)
  ) {
    throw new Error('numInferenceSteps must be between 1 and 50');
  }
  if (
    input.guidanceScale !== undefined &&
    (!Number.isFinite(input.guidanceScale) ||
      input.guidanceScale < 0 ||
      input.guidanceScale > 20)
  ) {
    throw new Error('guidanceScale must be between 0 and 20');
  }
  if (
    input.seed !== undefined &&
    (!Number.isInteger(input.seed) || input.seed < 0)
  ) {
    throw new Error('seed must be a non-negative integer');
  }
}

/** Server-owned Fal payload. The safety setting cannot be overridden by users. */
export function toFalFlux2EditOptions(input: FalFlux2EditInput) {
  return {
    image_urls: input.imageUrls,
    ...(input.guidanceScale === undefined
      ? {}
      : { guidance_scale: input.guidanceScale }),
    ...(input.numInferenceSteps === undefined
      ? {}
      : { num_inference_steps: input.numInferenceSteps }),
    ...(input.imageSize === undefined ? {} : { image_size: input.imageSize }),
    ...(input.numImages === undefined ? {} : { num_images: input.numImages }),
    ...(input.acceleration === undefined
      ? {}
      : { acceleration: input.acceleration }),
    ...(input.outputFormat === undefined
      ? {}
      : { output_format: input.outputFormat }),
    ...(input.seed === undefined ? {} : { seed: input.seed }),
    enable_safety_checker: false,
  };
}

/** Submit a FLUX.2 edit request and persist its queue ID for later polling. */
export async function createFlux2EditTask(params: {
  apiKey: string;
  input: FalFlux2EditInput;
  userId: string;
}): Promise<FalFlux2EditTask> {
  const { apiKey, input, userId } = params;
  validateFlux2EditInput(input);

  const [createdTask] = await db()
    .insert(aiTask)
    .values({
      id: getUuid(),
      userId,
      mediaType: AIMediaType.IMAGE,
      provider: 'fal',
      model: FAL_FLUX_2_EDIT_MODEL,
      prompt: input.prompt.trim(),
      options: JSON.stringify(toFalFlux2EditOptions(input)),
      status: AITaskStatus.PENDING,
      costCredits: 0,
    })
    .returning();

  if (!createdTask) throw new Error('Unable to create image-edit task');

  try {
    const provider = new FalProvider({ apiKey });
    const remote = await provider.generate({
      params: {
        mediaType: AIMediaType.IMAGE,
        model: FAL_FLUX_2_EDIT_MODEL,
        prompt: input.prompt.trim(),
        options: toFalFlux2EditOptions(input),
        async: true,
      },
    });
    const taskInfo = {
      providerStatus: remote.taskStatus,
      progress: 0,
    } satisfies StoredTaskInfo;

    await db()
      .update(aiTask)
      .set({
        taskId: remote.taskId,
        status: remote.taskStatus,
        taskInfo: JSON.stringify(taskInfo),
        taskResult: JSON.stringify(remote.taskResult),
      })
      .where(eq(aiTask.id, createdTask.id));

    return toClientTask({
      ...createdTask,
      taskId: remote.taskId,
      status: remote.taskStatus,
      taskInfo: JSON.stringify(taskInfo),
      taskResult: JSON.stringify(remote.taskResult),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Fal request failed';
    await db()
      .update(aiTask)
      .set({
        status: AITaskStatus.FAILED,
        taskInfo: JSON.stringify({ errorMessage: message, progress: 0 }),
      })
      .where(eq(aiTask.id, createdTask.id));
    throw error;
  }
}

/** Load a user-owned task and refresh it from Fal until it reaches a terminal state. */
export async function getFlux2EditTask(params: {
  apiKey: string;
  saveFiles?: SaveFilesFunction;
  taskId: string;
  userId: string;
}): Promise<FalFlux2EditTask> {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.id, params.taskId),
        eq(aiTask.userId, params.userId),
        eq(aiTask.provider, 'fal'),
        eq(aiTask.model, FAL_FLUX_2_EDIT_MODEL),
        isNull(aiTask.deletedAt)
      )
    )
    .limit(1);

  if (!task) throw new Error('Image-edit task not found');
  if (terminalStatuses.has(task.status)) return toClientTask(task);
  if (!task.taskId) throw new Error('Image-edit task has no Fal request ID');

  try {
    const provider = new FalProvider({
      apiKey: params.apiKey,
      ...(params.saveFiles
        ? { customStorage: true, saveFiles: params.saveFiles }
        : {}),
    });
    const remote = await provider.query({
      taskId: task.taskId,
      mediaType: AIMediaType.IMAGE,
      model: FAL_FLUX_2_EDIT_MODEL,
    });
    const remoteStatus = remote.taskInfo?.status;
    const taskInfo = {
      providerStatus: remoteStatus,
      progress: remote.taskStatus === AITaskStatus.SUCCESS ? 100 : 0,
      ...(remote.taskInfo?.errorMessage
        ? { errorMessage: remote.taskInfo.errorMessage }
        : {}),
    } satisfies StoredTaskInfo;
    const updatedTask = {
      ...task,
      status: remote.taskStatus,
      taskInfo: JSON.stringify(taskInfo),
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
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Fal task lookup failed';
    await db()
      .update(aiTask)
      .set({
        status: AITaskStatus.FAILED,
        taskInfo: JSON.stringify({ errorMessage: message, progress: 0 }),
      })
      .where(eq(aiTask.id, task.id));
    throw error;
  }
}

/**
 * Resolves one generated image for a task owned by the signed-in user. Keeping
 * this lookup here means the download route never trusts a URL supplied by the
 * browser.
 */
export async function getFlux2EditResultUrl(params: {
  apiKey: string;
  index: number;
  taskId: string;
  userId: string;
}): Promise<string> {
  if (!Number.isInteger(params.index) || params.index < 0) {
    throw new Error('Invalid image index');
  }

  const task = await getFlux2EditTask(params);
  if (task.status !== AITaskStatus.SUCCESS) {
    throw new Error('Image is not ready to download');
  }

  const resultUrl = task.resultUrls[params.index];
  if (!resultUrl) throw new Error('Generated image not found');

  return resultUrl;
}
