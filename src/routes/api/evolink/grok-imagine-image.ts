import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import {
  AITaskStatus,
  createTask,
  updateTask,
} from '@/modules/ai-tasks/service';
import { getAllConfigs } from '@/modules/config/service';
import {
  EVOLINK_GROK_IMAGINE_IMAGE_MODEL,
  getGrokImagineImageResultUrl,
  getGrokImagineImageTask,
  submitGrokImagineImageTask,
  validateGrokImagineImageInput,
  type GrokImagineImageInput,
  type GrokImagineImageTask,
} from '@/modules/evolink-grok-image/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';
import { grokImagineImageReservationCredits } from '@/lib/retail-pricing';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalString<T extends string>(value: unknown): T | undefined {
  return typeof value === 'string' && value.trim()
    ? (value.trim() as T)
    : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function parseInput(body: unknown): GrokImagineImageInput {
  const value = isRecord(body) ? body : {};
  const resolution = optionalString<GrokImagineImageInput['resolution']>(
    value.resolution
  );
  const quality = optionalString<GrokImagineImageInput['quality']>(
    value.quality
  );
  const size = optionalString(value.size);
  const n = optionalNumber(value.n);

  return {
    prompt: typeof value.prompt === 'string' ? value.prompt.trim() : '',
    imageUrls: stringArray(value.imageUrls),
    ...(resolution === undefined ? {} : { resolution }),
    ...(quality === undefined ? {} : { quality }),
    ...(size === undefined ? {} : { size }),
    ...(n === undefined ? {} : { n }),
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

/**
 * A task can be rejected synchronously by EvoLink, before the client begins
 * polling. Settle that terminal state on both POST and GET so the reserved
 * credits are returned even when the UI never makes a follow-up request.
 */
async function settleGrokImagineImageBilling(task: GrokImagineImageTask) {
  if (task.status === 'failed' || task.status === 'canceled') {
    await updateTask({
      taskId: task.id,
      status:
        task.status === 'canceled'
          ? AITaskStatus.CANCELED
          : AITaskStatus.FAILED,
    });
  }
  return task;
}

function downloadFileExtension(contentType: string | null): string {
  switch (contentType?.split(';')[0].trim().toLowerCase()) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/png':
    default:
      return 'png';
  }
}

async function downloadResult(params: {
  apiKey: string;
  index: number;
  taskId: string;
  userId: string;
}) {
  const resultUrl = await getGrokImagineImageResultUrl(params);
  const upstream = await fetch(resultUrl);
  if (!upstream.ok || !upstream.body) {
    throw new Error('Unable to download generated image');
  }

  const contentType = upstream.headers.get('content-type');
  const extension = downloadFileExtension(contentType);
  return new Response(upstream.body, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="uncensored-ai-image-${params.taskId}-${params.index + 1}.${extension}"`,
      'Content-Type': contentType || 'image/png',
    },
  });
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
      keyPrefix: 'evolink-grok-imagine-image',
      extraKey: session.user.id,
    });
    if (limited) return limited;

    const input = parseInput(await request.json().catch(() => ({})));
    validateGrokImagineImageInput(input);
    const apiKey = await configuredApiKey();
    const quality = input.quality || 'medium';
    const resolution = input.resolution || '1K';
    const imageCount = input.n || 1;
    const billingTask = await createTask({
      userId: session.user.id,
      mediaType: 'image',
      provider: 'evolink',
      model: EVOLINK_GROK_IMAGINE_IMAGE_MODEL,
      prompt: input.prompt,
      options: input,
      costCredits: grokImagineImageReservationCredits({
        imageCount,
        inputImageCount: input.imageUrls?.length || 0,
        quality,
        resolution,
      }),
      // The UI submits one image at a time. Keep this server-enforced too, so
      // a direct API caller cannot turn the one-image welcome offer into a
      // free batch.
      requestFreeImageTrial: imageCount === 1,
    });
    billingTaskId = billingTask.id;
    const task = await submitGrokImagineImageTask({
      taskId: billingTask.id,
      userId: session.user.id,
      apiKey,
      input,
    });
    submittedUpstream = true;
    return respData(await settleGrokImagineImageBilling(task));
  } catch (error) {
    if (billingTaskId && !submittedUpstream) {
      await updateTask({
        taskId: billingTaskId,
        status: AITaskStatus.FAILED,
      }).catch(() => undefined);
    }
    return respErr(
      error instanceof Error ? error.message : 'Unable to create image task'
    );
  }
}

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const url = new URL(request.url);
    const taskId = url.searchParams.get('taskId')?.trim();
    if (!taskId) return respErr('taskId is required');
    const apiKey = await configuredApiKey();

    if (url.searchParams.get('download') === '1') {
      const index = Number(url.searchParams.get('index') ?? '0');
      if (!Number.isInteger(index) || index < 0) {
        return respErr('index must be a non-negative integer');
      }
      return downloadResult({
        apiKey,
        index,
        taskId,
        userId: session.user.id,
      });
    }

    const task = await getGrokImagineImageTask({
      apiKey,
      taskId,
      userId: session.user.id,
    });
    return respData(await settleGrokImagineImageBilling(task));
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Unable to load image task'
    );
  }
}

export const Route = createFileRoute('/api/evolink/grok-imagine-image')({
  server: { handlers: { GET, POST } },
});
