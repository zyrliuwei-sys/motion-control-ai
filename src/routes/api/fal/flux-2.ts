import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getAllConfigs } from '@/modules/config/service';
import {
  createFlux2TextToImageTask,
  getFlux2TextToImageResultUrl,
  getFlux2TextToImageTask,
  type FalFlux2TextToImageInput,
} from '@/modules/fal-flux-text-to-image/service';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

import { getPersistentOutputSaver } from './-persistent-output';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function optionalString<T extends string>(value: unknown): T | undefined {
  return typeof value === 'string' && value.trim()
    ? (value.trim() as T)
    : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function parseInput(body: unknown): FalFlux2TextToImageInput {
  const value = isRecord(body) ? body : {};
  const guidanceScale = optionalNumber(value.guidanceScale);
  const numInferenceSteps = optionalNumber(value.numInferenceSteps);
  const numImages = optionalNumber(value.numImages);
  const seed = optionalNumber(value.seed);
  const imageSize = optionalString<FalFlux2TextToImageInput['imageSize']>(
    value.imageSize
  );
  const acceleration = optionalString<FalFlux2TextToImageInput['acceleration']>(
    value.acceleration
  );
  const outputFormat = optionalString<FalFlux2TextToImageInput['outputFormat']>(
    value.outputFormat
  );

  return {
    prompt: typeof value.prompt === 'string' ? value.prompt.trim() : '',
    ...(guidanceScale === undefined ? {} : { guidanceScale }),
    ...(numInferenceSteps === undefined ? {} : { numInferenceSteps }),
    ...(numImages === undefined ? {} : { numImages }),
    ...(seed === undefined ? {} : { seed }),
    ...(imageSize === undefined ? {} : { imageSize }),
    ...(acceleration === undefined ? {} : { acceleration }),
    ...(outputFormat === undefined ? {} : { outputFormat }),
  };
}

async function configuredApiKey() {
  const apiKey = (await getAllConfigs()).fal_api_key?.trim();
  if (!apiKey) {
    throw new Error(
      'Fal API Key is not configured. Add it in Admin → Settings → AI → Fal.'
    );
  }
  return apiKey;
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
  const resultUrl = await getFlux2TextToImageResultUrl(params);
  const upstream = await fetch(resultUrl);
  if (!upstream.ok || !upstream.body) {
    throw new Error('Unable to download generated image');
  }

  const contentType = upstream.headers.get('content-type');
  const extension = downloadFileExtension(contentType);

  return new Response(upstream.body, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="flux-2-${params.taskId}-${params.index + 1}.${extension}"`,
      'Content-Type': contentType || 'image/png',
    },
  });
}

async function POST({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const limited = enforceMinIntervalRateLimit(request, {
      intervalMs: 1_000,
      keyPrefix: 'fal-flux-2-text-to-image',
      extraKey: session.user.id,
    });
    if (limited) return limited;

    const task = await createFlux2TextToImageTask({
      apiKey: await configuredApiKey(),
      input: parseInput(await request.json().catch(() => ({}))),
      userId: session.user.id,
    });
    return respData(task);
  } catch (error) {
    return respErr(
      error instanceof Error
        ? error.message
        : 'Unable to create image-generation task'
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

    if (url.searchParams.get('download') === '1') {
      const index = Number(url.searchParams.get('index') ?? '0');
      if (!Number.isInteger(index) || index < 0) {
        return respErr('index must be a non-negative integer');
      }
      return downloadResult({
        apiKey: await configuredApiKey(),
        index,
        taskId,
        userId: session.user.id,
      });
    }

    const task = await getFlux2TextToImageTask({
      apiKey: await configuredApiKey(),
      saveFiles: await getPersistentOutputSaver(),
      taskId,
      userId: session.user.id,
    });
    return respData(task);
  } catch (error) {
    return respErr(
      error instanceof Error
        ? error.message
        : 'Unable to load image-generation task'
    );
  }
}

export const Route = createFileRoute('/api/fal/flux-2')({
  server: { handlers: { GET, POST } },
});
