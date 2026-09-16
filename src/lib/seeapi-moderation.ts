import { envConfigs } from '@/config';
import { getUuid } from '@/lib/hash';

const SEEAPI_BASE_URL = 'https://api.seeapi.com';
const INFERENCE_PATH = '/v1/inferences';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_POLL_ATTEMPTS = 6;
const INITIAL_POLL_DELAY_MS = 500;
const MAX_POLL_DELAY_MS = 2_000;

type JsonObject = Record<string, unknown>;

export type ImageModerationCategoryResult = {
  nsfw: string[];
  specialCare: string[];
};

export type ImageModerationResult = {
  categories: ImageModerationCategoryResult;
  flagged: boolean;
  status: 'succeeded';
  taskId: string;
};

export type ImageModerationSummary = {
  checkedAt: string;
  provider: 'seeapi';
  results: ImageModerationResult[];
  status: 'passed' | 'rejected';
};

export class ImageModerationError extends Error {
  constructor(
    message: string,
    readonly status: number = 503
  ) {
    super(message);
    this.name = 'ImageModerationError';
  }
}

export class ImageModerationRejectedError extends ImageModerationError {
  constructor(readonly results: ImageModerationResult[]) {
    super(
      'The image did not pass the content review. Please use a different image.',
      400
    );
    this.name = 'ImageModerationRejectedError';
  }
}

function isRecord(value: unknown): value is JsonObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
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

function authHeaders(apiKey: string, extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function readJson(response: Response): Promise<JsonObject> {
  const value = await response.json().catch(() => ({}));
  return isRecord(value) ? value : {};
}

async function request(
  apiKey: string,
  path: string,
  init: RequestInit
): Promise<JsonObject> {
  let response: Response;
  try {
    response = await fetch(`${SEEAPI_BASE_URL}${path}`, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ImageModerationError(
      'Image moderation is temporarily unavailable. Please try again later.',
      503
    );
  }

  const body = await readJson(response);
  if (!response.ok) {
    console.error('[image-safety] SeeAPI request failed', {
      path,
      status: response.status,
    });
    throw new ImageModerationError(
      'Image moderation is temporarily unavailable. Please try again later.',
      response.status >= 500 ? 503 : 502
    );
  }

  return body;
}

function taskStatus(body: JsonObject): string {
  return typeof body.status === 'string' ? body.status.toLowerCase() : '';
}

function parseCompletedResult(
  body: JsonObject,
  taskId: string
): ImageModerationResult {
  const result = isRecord(body.result) ? body.result : undefined;
  const data = result && isRecord(result.data) ? result.data : undefined;
  if (!data || typeof data.flagged !== 'boolean') {
    throw new ImageModerationError(
      'Image moderation returned an invalid result. Please try again later.',
      502
    );
  }

  const categories = isRecord(data.categories) ? data.categories : {};
  return {
    taskId,
    status: 'succeeded',
    flagged: data.flagged,
    categories: {
      nsfw: stringArray(categories.nsfw),
      specialCare: stringArray(categories.special_care),
    },
  };
}

function pollDelay(attempt: number) {
  return Math.min(
    MAX_POLL_DELAY_MS,
    INITIAL_POLL_DELAY_MS * 2 ** Math.min(attempt, 4)
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getSeeApiKey(): string {
  const apiKey = envConfigs.seeapi_api_key?.trim();
  if (!apiKey) {
    throw new ImageModerationError(
      'Image moderation is not configured. Set SEEAPI_API_KEY on the server.',
      503
    );
  }
  return apiKey;
}

async function createInferenceTask(params: {
  apiKey: string;
  idempotencyKey: string;
  imageUrl: string;
}): Promise<string> {
  const body = await request(params.apiKey, INFERENCE_PATH, {
    method: 'POST',
    headers: authHeaders(params.apiKey, {
      'Idempotency-Key': params.idempotencyKey,
    }),
    body: JSON.stringify({
      model: 'nsfw-filter',
      endpoint: 'image-moderation',
      provider: 'seeapi',
      input: {
        image_url: params.imageUrl,
        threshold_offset: 0.02,
        strict_special_care: true,
      },
    }),
  });

  if (typeof body.id !== 'string' || !body.id) {
    throw new ImageModerationError(
      'Image moderation did not return a task ID. Please try again later.',
      502
    );
  }
  return body.id;
}

async function queryInferenceTask(params: {
  apiKey: string;
  taskId: string;
}): Promise<JsonObject> {
  return request(
    params.apiKey,
    `${INFERENCE_PATH}/${encodeURIComponent(params.taskId)}`,
    {
      method: 'GET',
      headers: authHeaders(params.apiKey),
    }
  );
}

/** Run one SeeAPI image moderation task and wait for its terminal result. */
export async function moderateImage(params: {
  apiKey: string;
  idempotencyKey?: string;
  imageUrl: string;
}): Promise<ImageModerationResult> {
  if (!isPublicHttpsUrl(params.imageUrl)) {
    throw new ImageModerationError(
      'Reference images must use public HTTPS URLs.',
      400
    );
  }

  const taskId = await createInferenceTask({
    apiKey: params.apiKey,
    idempotencyKey: params.idempotencyKey || getUuid(),
    imageUrl: params.imageUrl,
  });

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const body = await queryInferenceTask({
      apiKey: params.apiKey,
      taskId,
    });
    const status = taskStatus(body);

    if (status === 'succeeded' || status === 'success') {
      return parseCompletedResult(body, taskId);
    }
    if (
      status === 'failed' ||
      status === 'error' ||
      status === 'canceled' ||
      status === 'cancelled'
    ) {
      throw new ImageModerationError(
        'Image moderation failed. Please try again later.',
        503
      );
    }

    if (attempt < MAX_POLL_ATTEMPTS - 1) {
      await wait(pollDelay(attempt));
    }
  }

  throw new ImageModerationError(
    'Image moderation timed out. Please try again later.',
    503
  );
}

/** Moderate several images concurrently while preserving input order. */
export async function moderateImages(params: {
  apiKey: string;
  idempotencyPrefix?: string;
  imageUrls: string[];
}): Promise<ImageModerationResult[]> {
  return Promise.all(
    params.imageUrls.map((imageUrl, index) =>
      moderateImage({
        apiKey: params.apiKey,
        imageUrl,
        idempotencyKey: params.idempotencyPrefix
          ? `${params.idempotencyPrefix}-${index}`
          : undefined,
      })
    )
  );
}

/** Reject the request when any submitted image is flagged by SeeAPI. */
export async function assertImagesAllowed(params: {
  apiKey: string;
  idempotencyPrefix?: string;
  imageUrls: string[];
}): Promise<ImageModerationSummary> {
  if (!params.imageUrls.length) {
    return {
      checkedAt: new Date().toISOString(),
      provider: 'seeapi',
      results: [],
      status: 'passed',
    };
  }

  const results = await moderateImages(params);
  const summary: ImageModerationSummary = {
    checkedAt: new Date().toISOString(),
    provider: 'seeapi',
    results,
    status: results.some((result) => result.flagged) ? 'rejected' : 'passed',
  };

  if (summary.status === 'rejected') {
    console.info('[image-safety] image rejected by SeeAPI', {
      flaggedCount: results.filter((result) => result.flagged).length,
      taskIds: results.map((result) => result.taskId),
    });
    throw new ImageModerationRejectedError(results);
  }

  return summary;
}
