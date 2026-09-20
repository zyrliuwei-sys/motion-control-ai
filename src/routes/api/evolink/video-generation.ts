import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  AITaskStatus as BillingTaskStatus,
  createTask,
  settleTaskCreditCost,
  updateTask,
} from '@/modules/ai-tasks/service';
import { getAllConfigs } from '@/modules/config/service';
import { hasPaidCredits } from '@/modules/credits/service';
import {
  archiveMotionControlResult,
  getVideoGenerationTask,
  listVideoGenerationTasks,
  submitVideoGenerationTask,
  type MotionControlTask,
  type VideoGenerationInput,
} from '@/modules/evolink/service';
import { enqueueGeneration } from '@/modules/generation-queue/service';
import { getStorage } from '@/modules/storage/service';
import {
  EVOLINK_VIDEO_MODEL_IDS,
  evolinkVideoCreditsForSeconds,
  getEvolinkVideoModelFamily,
  type EvolinkVideoMode,
  type EvolinkVideoModelFamily,
  type EvolinkVideoQuality,
} from '@/lib/evolink-video-pricing';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';
import {
  assertImagesAllowed,
  getSeeApiKey,
  ImageModerationError,
} from '@/lib/seeapi-moderation';
import {
  PromptScreeningError,
  screenGenerationPrompt,
} from '@/lib/waffo-content-safety';

const ASPECT_RATIOS = new Set([
  'adaptive',
  '16:9',
  '9:16',
  '1:1',
  '4:3',
  '3:4',
  '21:9',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stringArray(value: unknown): string[] {
  if (typeof value === 'string') return [value.trim()].filter(Boolean);
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInput(body: unknown): VideoGenerationInput {
  const input = isRecord(body) ? body : {};
  const family = input.model;
  if (family !== 'seedance-2.5' && family !== 'minimax-h3-max') {
    throw new Error('Choose a supported video model');
  }

  const mode: EvolinkVideoMode =
    input.mode === 'image-to-video' || input.mode === 'reference-to-video'
      ? input.mode
      : 'text-to-video';
  const quality: EvolinkVideoQuality =
    input.quality === '720p' ||
    input.quality === '768p' ||
    input.quality === '1080p'
      ? input.quality
      : '480p';
  const duration =
    typeof input.duration === 'number'
      ? Math.floor(input.duration)
      : Number(input.duration);
  const aspectRatio =
    typeof input.aspectRatio === 'string' &&
    ASPECT_RATIOS.has(input.aspectRatio)
      ? input.aspectRatio
      : '16:9';
  const modelFamily = family as EvolinkVideoModelFamily;

  return {
    model: EVOLINK_VIDEO_MODEL_IDS[modelFamily][mode],
    mode,
    prompt: typeof input.prompt === 'string' ? input.prompt.trim() : '',
    imageUrls: stringArray(input.imageUrls),
    duration,
    quality,
    aspectRatio,
    ...(typeof input.generateAudio === 'boolean'
      ? { generateAudio: input.generateAudio }
      : {}),
  };
}

async function configuredApiKey() {
  const apiKey = (await getAllConfigs()).evolink_api_key?.trim();
  if (!apiKey) {
    throw new Error(
      'The EvoLink API key is not configured. Add it in Admin → Settings → AI → AI image service.'
    );
  }
  return apiKey;
}

async function withArchivedVideo(
  task: MotionControlTask,
  userId: string
): Promise<MotionControlTask> {
  if (task.status !== 'success' || task.isArchived || !task.resultUrls.length) {
    return task;
  }

  try {
    const storage = await getStorage();
    if (!storage) return task;
    return await archiveMotionControlResult({
      userId,
      taskId: task.id,
      storage,
    });
  } catch {
    return task;
  }
}

async function settleVideoBilling(task: MotionControlTask) {
  if (task.status === 'success' && task.billedCredits !== undefined) {
    await settleTaskCreditCost({
      taskId: task.id,
      costCredits: task.billedCredits,
    });
  } else if (task.status === 'failed' || task.status === 'canceled') {
    await updateTask({
      taskId: task.id,
      status:
        task.status === 'canceled'
          ? BillingTaskStatus.CANCELED
          : BillingTaskStatus.FAILED,
    });
  }
  return task;
}

async function POST({ request }: { request: Request }) {
  let billingTaskId: string | undefined;
  let submittedUpstream = false;

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    if (!(await hasPaidCredits(session.user.id))) {
      return respErr('Payment required before video generation');
    }

    const limited = enforceMinIntervalRateLimit(request, {
      intervalMs: 1_000,
      keyPrefix: 'evolink-video-generation',
      extraKey: session.user.id,
    });
    if (limited) return limited;

    const input = parseInput(await request.json().catch(() => ({})));
    const family = getEvolinkVideoModelFamily(input.model);
    if (!family) throw new Error('Unsupported EvoLink video model');

    await screenGenerationPrompt(
      input.prompt,
      request.headers.get('accept-language')
    );
    const apiKey = await configuredApiKey();
    if (input.imageUrls.length) {
      await assertImagesAllowed({
        apiKey: getSeeApiKey(),
        imageUrls: input.imageUrls,
      });
    }

    const reservationCredits = evolinkVideoCreditsForSeconds({
      model: family,
      quality: input.quality,
      durationSeconds: input.duration,
    });
    const billingTask = await createTask({
      userId: session.user.id,
      mediaType: 'video',
      provider: 'evolink',
      model: input.model,
      prompt: input.prompt,
      options: input,
      costCredits: reservationCredits,
    });
    billingTaskId = billingTask.id;

    const task = await enqueueGeneration(() =>
      submitVideoGenerationTask({
        taskId: billingTask.id,
        userId: session.user.id,
        apiKey,
        input,
      })
    );
    submittedUpstream = true;
    return respData(await settleVideoBilling(task));
  } catch (error: any) {
    if (billingTaskId && !submittedUpstream) {
      await updateTask({
        taskId: billingTaskId,
        status: BillingTaskStatus.FAILED,
      }).catch(() => undefined);
    }
    return respErr(
      error?.message || 'Unable to create video task',
      error instanceof PromptScreeningError ||
        error instanceof ImageModerationError
        ? { status: error.status }
        : undefined
    );
  }
}

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const taskId = new URL(request.url).searchParams.get('taskId')?.trim();
    if (!taskId) {
      const tasks = await listVideoGenerationTasks({ userId: session.user.id });
      const result: MotionControlTask[] = [];
      for (const task of tasks) {
        const settled = await settleVideoBilling(task);
        result.push(await withArchivedVideo(settled, session.user.id));
      }
      return respData(result);
    }

    const task = await getVideoGenerationTask({
      userId: session.user.id,
      apiKey: await configuredApiKey(),
      taskId,
    });
    const settled = await settleVideoBilling(task);
    return respData(await withArchivedVideo(settled, session.user.id));
  } catch (error: any) {
    return respErr(error?.message || 'Unable to load video task');
  }
}

export const Route = createFileRoute('/api/evolink/video-generation')({
  server: {
    handlers: { GET, POST },
  },
});
