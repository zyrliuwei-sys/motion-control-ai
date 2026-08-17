import {
  AIMediaType,
  AITaskStatus,
  type AIConfigs,
  type AIGenerateParams,
  type AIProvider,
  type AITaskInfo,
  type AITaskResult,
  type AIVideo,
} from './types';

const EVOLINK_API_BASE_URL = 'https://api.evolink.ai/v1';

export interface EvolinkConfigs extends AIConfigs {
  apiKey: string;
}

export interface EvolinkMotionControlOptions {
  imageUrls: string[];
  videoUrls: string[];
  quality: '720p' | '1080p';
  characterOrientation: 'image' | 'video';
  keepSound?: boolean;
  elementList?: Array<{ elementId: string }>;
  watermarkEnabled?: boolean;
}

type EvolinkTaskResponse = {
  data?: unknown;
  id?: string;
  status?: string;
  task_status?: string;
  state?: string;
  progress?: number;
  results?: unknown;
  result?: unknown;
  output?: unknown;
  outputs?: unknown;
  video_url?: string;
  videoUrl?: string;
  task_info?: {
    can_cancel?: boolean;
    estimated_time?: number;
  };
  error?: {
    code?: string;
    message?: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * EvoLink documents `results` as a URL array, but some gateway routes return
 * result objects or wrap the payload in `data`. Normalize those forms before
 * they reach the UI so a completed generation always has playable URLs.
 */
export function extractEvolinkVideoUrls(payload: unknown): string[] {
  const urls = new Set<string>();
  const visit = (value: unknown, depth = 0) => {
    if (depth > 4 || value === null || value === undefined) return;
    if (isHttpUrl(value)) {
      urls.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }
    if (!isRecord(value)) return;

    for (const key of [
      'url',
      'video_url',
      'videoUrl',
      'download_url',
      'downloadUrl',
      'file_url',
      'fileUrl',
      'play_url',
      'playUrl',
    ]) {
      visit(value[key], depth + 1);
    }
    for (const key of [
      'results',
      'result',
      'video',
      'videos',
      'output',
      'outputs',
    ]) {
      visit(value[key], depth + 1);
    }
  };

  if (isRecord(payload)) {
    visit(payload.results);
    visit(payload.result);
    visit(payload.video_url);
    visit(payload.videoUrl);
    visit(payload.output);
    visit(payload.outputs);
    if (isRecord(payload.data)) visit(payload.data);
  } else {
    visit(payload);
  }
  return [...urls];
}

/** EvoLink's async video API, currently used for Kling motion control. */
export class EvolinkProvider implements AIProvider {
  readonly name = 'evolink';
  configs: EvolinkConfigs;

  constructor(configs: EvolinkConfigs) {
    this.configs = configs;
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.configs.apiKey}`,
    };
  }

  private async readResponse(response: Response): Promise<EvolinkTaskResponse> {
    const body = (await response
      .json()
      .catch(() => ({}))) as EvolinkTaskResponse;
    const data =
      !body.id && isRecord(body.data)
        ? ({ ...body.data } as EvolinkTaskResponse)
        : body;
    if (response.ok) return data;

    const message =
      data.error?.message || `Request failed (${response.status})`;
    throw new Error(`EvoLink: ${message}`);
  }

  private mapStatus(status?: string): AITaskStatus {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'succeeded':
        return AITaskStatus.SUCCESS;
      case 'failed':
      case 'error':
        return AITaskStatus.FAILED;
      case 'cancelled':
      case 'canceled':
        return AITaskStatus.CANCELED;
      case 'processing':
      case 'running':
        return AITaskStatus.PROCESSING;
      default:
        return AITaskStatus.PENDING;
    }
  }

  private taskInfo(data: EvolinkTaskResponse): AITaskInfo {
    const videos = extractEvolinkVideoUrls(data).map(
      (videoUrl): AIVideo => ({ videoUrl })
    );

    return {
      status: data.status || data.task_status || data.state,
      videos: videos.length ? videos : undefined,
      errorCode: data.error?.code,
      errorMessage: data.error?.message,
    };
  }

  async generate({
    params,
  }: {
    params: AIGenerateParams;
  }): Promise<AITaskResult> {
    if (params.mediaType !== AIMediaType.VIDEO) {
      throw new Error('EvoLink motion control only supports video generation');
    }

    const options = params.options as EvolinkMotionControlOptions | undefined;
    if (!options?.imageUrls?.length || !options.videoUrls?.length) {
      throw new Error('Both reference image and reference video are required');
    }

    const response = await fetch(`${EVOLINK_API_BASE_URL}/videos/generations`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: params.model || 'kling-v3-motion-control',
        ...(params.prompt ? { prompt: params.prompt } : {}),
        image_urls: options.imageUrls,
        video_urls: options.videoUrls,
        quality: options.quality,
        model_params: {
          character_orientation: options.characterOrientation,
          ...(options.keepSound === undefined
            ? {}
            : { keep_sound: options.keepSound }),
          ...(options.elementList?.length
            ? {
                element_list: options.elementList.map(({ elementId }) => ({
                  element_id: elementId,
                })),
              }
            : {}),
          ...(options.watermarkEnabled === undefined
            ? {}
            : { watermark_info: { enabled: options.watermarkEnabled } }),
        },
        ...(params.callbackUrl ? { callback_url: params.callbackUrl } : {}),
      }),
    });
    const data = await this.readResponse(response);

    if (!data.id) {
      throw new Error('EvoLink: task creation returned no task ID');
    }

    return {
      taskId: data.id,
      taskStatus: this.mapStatus(data.status || data.task_status || data.state),
      taskInfo: this.taskInfo(data),
      taskResult: data,
    };
  }

  async query({
    taskId,
  }: {
    taskId: string;
    mediaType?: string;
    model?: string;
  }): Promise<AITaskResult> {
    const response = await fetch(
      `${EVOLINK_API_BASE_URL}/tasks/${encodeURIComponent(taskId)}`,
      { headers: this.headers() }
    );
    const data = await this.readResponse(response);

    return {
      taskId: data.id || taskId,
      taskStatus: this.mapStatus(data.status || data.task_status || data.state),
      taskInfo: this.taskInfo(data),
      taskResult: data,
    };
  }
}
