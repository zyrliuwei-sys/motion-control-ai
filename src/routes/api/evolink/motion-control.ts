import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getAllConfigs } from '@/modules/config/service';
import {
  archiveMotionControlResult,
  createMotionControlTask,
  getMotionControlTask,
  listMotionControlTasks,
  type MotionControlInput,
  type MotionControlTask,
} from '@/modules/evolink/service';
import { enqueueGeneration } from '@/modules/generation-queue/service';
import { getStorage } from '@/modules/storage/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

function stringArray(value: unknown): string[] {
  if (typeof value === 'string') return [value.trim()].filter(Boolean);
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInput(body: any): MotionControlInput {
  const elementList = Array.isArray(body?.elementList)
    ? body.elementList
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
    prompt: typeof body?.prompt === 'string' ? body.prompt.trim() : undefined,
    imageUrls: stringArray(body?.imageUrls),
    videoUrls: stringArray(body?.videoUrls),
    quality: body?.quality === '1080p' ? '1080p' : '720p',
    characterOrientation:
      body?.characterOrientation === 'video' ? 'video' : 'image',
    ...(typeof body?.keepSound === 'boolean'
      ? { keepSound: body.keepSound }
      : {}),
    ...(elementList?.length ? { elementList } : {}),
    ...(typeof body?.watermarkEnabled === 'boolean'
      ? { watermarkEnabled: body.watermarkEnabled }
      : {}),
    ...(typeof body?.callbackUrl === 'string'
      ? { callbackUrl: body.callbackUrl.trim() }
      : {}),
  };
}

async function configuredApiKey() {
  const apiKey = (await getAllConfigs()).evolink_api_key?.trim();
  if (!apiKey) {
    throw new Error(
      'EvoLink API Key is not configured. Add it in Admin → Settings → AI → EvoLink.'
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

async function POST({ request }: { request: Request }) {
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
    const task = await enqueueGeneration(() =>
      createMotionControlTask({
        userId: session.user.id,
        apiKey,
        input,
      })
    );
    return respData(task);
  } catch (error: any) {
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
        archivedTasks.push(await withArchivedVideo(task, session.user.id));
      }
      return respData(archivedTasks);
    }

    const task = await getMotionControlTask({
      userId: session.user.id,
      apiKey: await configuredApiKey(),
      taskId,
    });
    return respData(await withArchivedVideo(task, session.user.id));
  } catch (error: any) {
    return respErr(error?.message || 'Unable to load motion-control task');
  }
}

export const Route = createFileRoute('/api/evolink/motion-control')({
  server: {
    handlers: { GET, POST },
  },
});
