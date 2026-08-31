import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  AITaskStatus as BillingTaskStatus,
  createTask,
  settleTaskCreditCost,
  updateTask,
} from '@/modules/ai-tasks/service';
import { getAllConfigs } from '@/modules/config/service';
import {
  archiveMotionControlResult,
  getMotionControlTask,
  listMotionControlTasks,
  submitMotionControlTask,
  type MotionControlInput,
  type MotionControlTask,
} from '@/modules/evolink/service';
import { enqueueGeneration } from '@/modules/generation-queue/service';
import { getStorage } from '@/modules/storage/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';
import { motionControlReservationCredits } from '@/lib/retail-pricing';

function stringArray(value: unknown): string[] {
  if (typeof value === 'string') return [value.trim()].filter(Boolean);
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function parseInput(body: unknown): MotionControlInput {
  const input = isRecord(body) ? body : {};
  const elementList = Array.isArray(input.elementList)
    ? input.elementList
        .filter((item: unknown): item is { elementId: string } =>
          Boolean(
            item &&
            typeof item === 'object' &&
            typeof (item as { elementId?: unknown }).elementId === 'string'
          )
        )
        .map((item) => ({ elementId: item.elementId.trim() }))
        .filter((item) => item.elementId)
    : undefined;

  return {
    prompt: typeof input.prompt === 'string' ? input.prompt.trim() : undefined,
    imageUrls: stringArray(input.imageUrls),
    videoUrls: stringArray(input.videoUrls),
    quality: input.quality === '1080p' ? '1080p' : '720p',
    characterOrientation:
      input.characterOrientation === 'video' ? 'video' : 'image',
    ...(typeof input.keepSound === 'boolean'
      ? { keepSound: input.keepSound }
      : {}),
    ...(elementList?.length ? { elementList } : {}),
    ...(typeof input.watermarkEnabled === 'boolean'
      ? { watermarkEnabled: input.watermarkEnabled }
      : {}),
    ...(typeof input.callbackUrl === 'string'
      ? { callbackUrl: input.callbackUrl.trim() }
      : {}),
  };
}

async function configuredApiKey() {
  const apiKey = (await getAllConfigs()).evolink_api_key?.trim();
  if (!apiKey) {
    throw new Error(
      'The AI image service API key is not configured. Add it in Admin → Settings → AI → AI image service.'
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

async function settleMotionControlBilling(task: MotionControlTask) {
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

    const limited = enforceMinIntervalRateLimit(request, {
      intervalMs: 1_000,
      keyPrefix: 'evolink-motion-control',
      extraKey: session.user.id,
    });
    if (limited) return limited;

    const body = await request.json().catch(() => ({}));
    const apiKey = await configuredApiKey();
    const input = parseInput(body);
    const reservationCredits = motionControlReservationCredits({
      quality: input.quality,
      characterOrientation: input.characterOrientation,
    });
    const billingTask = await createTask({
      userId: session.user.id,
      mediaType: 'video',
      provider: 'evolink',
      model: 'kling-v3-motion-control',
      prompt: input.prompt || '',
      options: input,
      costCredits: reservationCredits,
    });
    billingTaskId = billingTask.id;
    const task = await enqueueGeneration(() =>
      submitMotionControlTask({
        taskId: billingTask.id,
        userId: session.user.id,
        apiKey,
        input,
      })
    );
    submittedUpstream = true;
    return respData(await settleMotionControlBilling(task));
  } catch (error: any) {
    if (billingTaskId && !submittedUpstream) {
      await updateTask({
        taskId: billingTaskId,
        status: BillingTaskStatus.FAILED,
      }).catch(() => undefined);
    }
    return respErr(error?.message || 'Unable to create motion-control task');
  }
}

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const taskId = new URL(request.url).searchParams.get('taskId')?.trim();
    if (!taskId) {
      const tasks = await listMotionControlTasks({ userId: session.user.id });
      const archivedTasks: MotionControlTask[] = [];
      for (const task of tasks) {
        const settledTask = await settleMotionControlBilling(task);
        archivedTasks.push(
          await withArchivedVideo(settledTask, session.user.id)
        );
      }
      return respData(archivedTasks);
    }

    const task = await getMotionControlTask({
      userId: session.user.id,
      apiKey: await configuredApiKey(),
      taskId,
    });
    const settledTask = await settleMotionControlBilling(task);
    return respData(await withArchivedVideo(settledTask, session.user.id));
  } catch (error: any) {
    return respErr(error?.message || 'Unable to load motion-control task');
  }
}

export const Route = createFileRoute('/api/evolink/motion-control')({
  server: {
    handlers: { GET, POST },
  },
});
