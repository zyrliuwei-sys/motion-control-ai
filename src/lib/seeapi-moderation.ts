import { envConfigs } from '@/config';
import { getUuid } from '@/lib/hash';

const SEEAPI_BASE_URL = 'https://api.seeapi.com';
const INFERENCE_PATH = '/v1/inferences';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_POLL_ATTEMPTS = 10;
const INITIAL_POLL_DELAY_MS = 500;
const MAX_POLL_DELAY_MS = 3_000;

const TEXT_MODERATION_CATEGORIES = [
  'sexual_explicit',
  'sexual_suggestive',
  'sexual_minors',
] as const;

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

export type TextModerationCategoryResult = {
  score: number;
  flagged: boolean;
};

export type TextModerationResult = {
  categories: Record<string, TextModerationCategoryResult>;
  flagged: boolean;
  status: 'succeeded';
  taskId: string;
  threshold: number;
};

export type VideoModerationFrameResult = {
  frameNumber: number;
  imageUrl?: string;
  nsfw: string[];
  nsfwDetected: boolean;
  specialCare: string[];
  timestampSeconds: number;
};

export type SeeApiVideoModerationResult = {
  checkedFrames: number;
  flagged: boolean;
  frames: VideoModerationFrameResult[];
  status: 'succeeded';
  taskId: string;
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

export class TextModerationError extends ImageModerationError {
  constructor(message: string, status = 503) {
    super(message, status);
    this.name = 'TextModerationError';
  }
}

export class TextModerationRejectedError extends TextModerationError {
  constructor(readonly result: TextModerationResult) {
    super(
      'The prompt did not pass the content review. Please revise it and try again.',
      400
    );
    this.name = 'TextModerationRejectedError';
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
  init: RequestInit,
  label: string
): Promise<JsonObject> {
  let response: Response;
  try {
    response = await fetch(`${SEEAPI_BASE_URL}${path}`, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ImageModerationError(
      `${label} moderation is temporarily unavailable. Please try again later.`,
      503
    );
  }

  const body = await readJson(response);
  if (!response.ok) {
    console.error('[content-safety] SeeAPI request failed', {
      path,
      status: response.status,
    });
    throw new ImageModerationError(
      `${label} moderation is temporarily unavailable. Please try again later.`,
      response.status >= 500 ? 503 : 502
    );
  }

  return body;
}

function taskStatus(body: JsonObject): string {
  return typeof body.status === 'string' ? body.status.toLowerCase() : '';
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

async function createInferenceTask(params: {
  apiKey: string;
  endpoint: string;
  idempotencyKey: string;
  input: JsonObject;
  label: string;
  model: string;
}): Promise<string> {
  const body = await request(
    params.apiKey,
    INFERENCE_PATH,
    {
      method: 'POST',
      headers: authHeaders(params.apiKey, {
        'Idempotency-Key': params.idempotencyKey,
      }),
      body: JSON.stringify({
        model: params.model,
        endpoint: params.endpoint,
        provider: 'seeapi',
        input: params.input,
      }),
    },
    params.label
  );

  if (typeof body.id !== 'string' || !body.id) {
    throw new ImageModerationError(
      `${params.label} moderation did not return a task ID. Please try again later.`,
      502
    );
  }
  return body.id;
}

async function queryInferenceTask(params: {
  apiKey: string;
  label: string;
  taskId: string;
}): Promise<JsonObject> {
  return request(
    params.apiKey,
    `${INFERENCE_PATH}/${encodeURIComponent(params.taskId)}`,
    {
      method: 'GET',
      headers: authHeaders(params.apiKey),
    },
    params.label
  );
}

async function pollInferenceTask<T>(params: {
  apiKey: string;
  label: string;
  parse: (body: JsonObject, taskId: string) => T;
  taskId: string;
}): Promise<T> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const body = await queryInferenceTask({
      apiKey: params.apiKey,
      label: params.label,
      taskId: params.taskId,
    });
    const status = taskStatus(body);

    if (status === 'succeeded' || status === 'success') {
      return params.parse(body, params.taskId);
    }
    if (
      status === 'failed' ||
      status === 'error' ||
      status === 'canceled' ||
      status === 'cancelled' ||
      status === 'refunded' ||
      status === 'expired'
    ) {
      throw new ImageModerationError(
        `${params.label} moderation failed. Please try again later.`,
        503
      );
    }

    if (attempt < MAX_POLL_ATTEMPTS - 1) {
      await wait(pollDelay(attempt));
    }
  }

  throw new ImageModerationError(
    `${params.label} moderation timed out. Please try again later.`,
    503
  );
}

function parseImageResult(
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

function parseTextResult(
  body: JsonObject,
  taskId: string
): TextModerationResult {
  const result = isRecord(body.result) ? body.result : undefined;
  const data = result && isRecord(result.data) ? result.data : undefined;
  if (
    !data ||
    typeof data.flagged !== 'boolean' ||
    typeof data.threshold !== 'number'
  ) {
    throw new TextModerationError(
      'Text moderation returned an invalid result. Please try again later.',
      502
    );
  }

  const categories: Record<string, TextModerationCategoryResult> = {};
  if (isRecord(data.categories)) {
    for (const [category, value] of Object.entries(data.categories)) {
      if (
        isRecord(value) &&
        typeof value.score === 'number' &&
        typeof value.flagged === 'boolean'
      ) {
        categories[category] = {
          score: value.score,
          flagged: value.flagged,
        };
      }
    }
  }

  return {
    taskId,
    status: 'succeeded',
    flagged: data.flagged,
    threshold: data.threshold,
    categories,
  };
}

function parseVideoResult(
  body: JsonObject,
  taskId: string
): SeeApiVideoModerationResult {
  const result = isRecord(body.result) ? body.result : undefined;
  const data = result && isRecord(result.data) ? result.data : undefined;
  if (!data || typeof data.flagged !== 'boolean') {
    throw new ImageModerationError(
      'Video moderation returned an invalid result. Please try again later.',
      502
    );
  }

  const output = isRecord(data.output) ? data.output : undefined;
  const frames: VideoModerationFrameResult[] = [];
  if (Array.isArray(output?.frames)) {
    for (const [index, value] of output.frames.entries()) {
      if (!isRecord(value) || typeof value.nsfw_detected !== 'boolean') {
        continue;
      }
      frames.push({
        frameNumber:
          typeof value.frame_number === 'number'
            ? value.frame_number
            : index + 1,
        timestampSeconds:
          typeof value.timestamp_seconds === 'number'
            ? value.timestamp_seconds
            : 0,
        nsfwDetected: value.nsfw_detected,
        nsfw: stringArray(value.nsfw),
        specialCare: stringArray(value.special),
        ...(typeof value.image_url === 'string'
          ? { imageUrl: value.image_url }
          : {}),
      });
    }
  }

  return {
    taskId,
    status: 'succeeded',
    flagged: data.flagged,
    checkedFrames:
      typeof output?.checked_frames === 'number'
        ? output.checked_frames
        : frames.length,
    frames,
  };
}

export function getSeeApiKey(): string {
  const apiKey = envConfigs.seeapi_api_key?.trim();
  if (!apiKey) {
    throw new ImageModerationError(
      'Content moderation is not configured. Set SEEAPI_API_KEY on the server.',
      503
    );
  }
  return apiKey;
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
    endpoint: 'image-moderation',
    idempotencyKey: params.idempotencyKey || getUuid(),
    input: {
      image_url: params.imageUrl,
      threshold_offset: 0.02,
      strict_special_care: true,
    },
    label: 'Image',
    model: 'nsfw-filter',
  });

  return pollInferenceTask({
    apiKey: params.apiKey,
    label: 'Image',
    parse: parseImageResult,
    taskId,
  });
}

/** Run SeeAPI's sexual-content text moderation before any media is inspected. */
export async function moderateText(params: {
  apiKey: string;
  idempotencyKey?: string;
  text: string;
}): Promise<TextModerationResult> {
  if (!params.text.trim() || params.text.length > 20_000) {
    throw new TextModerationError(
      'Text moderation accepts between 1 and 20,000 characters.',
      400
    );
  }

  const taskId = await createInferenceTask({
    apiKey: params.apiKey,
    endpoint: 'text-moderation',
    idempotencyKey: params.idempotencyKey || getUuid(),
    input: {
      text: params.text,
      threshold: 0.3,
      categories: [...TEXT_MODERATION_CATEGORIES],
    },
    label: 'Text',
    model: 'text-nsfw-filter',
  });

  return pollInferenceTask({
    apiKey: params.apiKey,
    label: 'Text',
    parse: parseTextResult,
    taskId,
  });
}

/** Reject a prompt when SeeAPI flags sexual content in the text. */
export async function assertTextAllowed(params: {
  apiKey: string;
  idempotencyKey?: string;
  text: string;
}): Promise<TextModerationResult> {
  const result = await moderateText(params);
  if (result.flagged) {
    console.info('[text-safety] prompt rejected by SeeAPI', {
      flaggedCategories: Object.entries(result.categories)
        .filter(([, category]) => category.flagged)
        .map(([category]) => category),
      taskId: result.taskId,
    });
    throw new TextModerationRejectedError(result);
  }
  return result;
}

/** Run SeeAPI's official video moderation task and wait for its result. */
export async function moderateVideoWithSeeApi(params: {
  apiKey: string;
  idempotencyKey?: string;
  videoUrl: string;
}): Promise<SeeApiVideoModerationResult> {
  if (!isPublicHttpsUrl(params.videoUrl)) {
    throw new ImageModerationError(
      'Reference videos must use public HTTPS URLs.',
      400
    );
  }

  const taskId = await createInferenceTask({
    apiKey: params.apiKey,
    endpoint: 'video-moderation',
    idempotencyKey: params.idempotencyKey || getUuid(),
    input: {
      video_url: params.videoUrl,
      num_frames: 8,
      threshold_offset: 0.02,
      strict_special_care: true,
      return_frames: 'none',
    },
    label: 'Video',
    model: 'video-nsfw-filter',
  });

  return pollInferenceTask({
    apiKey: params.apiKey,
    label: 'Video',
    parse: parseVideoResult,
    taskId,
  });
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
