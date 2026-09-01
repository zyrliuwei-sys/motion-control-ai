import { and, eq, isNull } from 'drizzle-orm';

import {
  AIMediaType,
  AITaskStatus,
  EvolinkProvider,
  extractEvolinkImageUrls,
} from '@/core/ai';
import { db } from '@/core/db';
import { aiTask, type AiTask } from '@/config/db/schema';

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

  return {
    id: task.id,
    providerTaskId: task.taskId ?? null,
    model: task.model,
    mode: taskMode(task),
    status: task.status,
    progress: Math.max(0, Math.min(100, Number(info.progress) || 0)),
    resultUrls: resultUrls(task.taskResult),
    createdAt: task.createdAt.toISOString(),
    ...(info.errorMessage ? { errorMessage: info.errorMessage } : {}),
  };
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
  const taskInfo = taskInfoFromRemote(remote);
  const updatedTask = {
    ...task,
    taskId: remote.taskId,
    status: remote.taskStatus,
    taskInfo: JSON.stringify(taskInfo),
    taskResult: JSON.stringify(remote.taskResult),
  };

  await db()
    .update(aiTask)
    .set({
      taskId: updatedTask.taskId,
      status: updatedTask.status,
      taskInfo: updatedTask.taskInfo,
      taskResult: updatedTask.taskResult,
    })
    .where(eq(aiTask.id, task.id));

  return toClientTask(updatedTask);
}

/** Refresh a user-owned Grok Imagine Image task until it is terminal. */
export async function getGrokImagineImageTask(params: {
  apiKey: string;
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
  const taskInfo = taskInfoFromRemote(remote);
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
}

/** Resolve an output URL while enforcing task ownership. */
export async function getGrokImagineImageResultUrl(params: {
  apiKey: string;
  index: number;
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
