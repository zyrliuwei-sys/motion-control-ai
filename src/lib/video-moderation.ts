import {
  ImageModerationError,
  moderateVideoWithSeeApi,
  type VideoModerationFrameResult,
} from '@/lib/seeapi-moderation';

export type VideoModerationSummary = {
  checkedAt: string;
  flagged: boolean;
  provider: 'seeapi';
  mediaType: 'video';
  frameCount: number;
  results: VideoModerationFrameResult[];
  status: 'passed' | 'rejected';
  taskId: string;
};

export class VideoModerationError extends ImageModerationError {
  constructor(message: string, status = 503) {
    super(message, status);
    this.name = 'VideoModerationError';
  }
}

export class VideoModerationRejectedError extends ImageModerationError {
  constructor(readonly summary: VideoModerationSummary) {
    super(
      'The video did not pass the content review. Please choose another video.',
      400
    );
    this.name = 'VideoModerationRejectedError';
  }
}

/**
 * Use SeeAPI's official video-moderation inference. SeeAPI samples eight
 * frames server-side and returns the overall verdict plus per-frame labels;
 * no generated or uploaded video is released before this check passes.
 */
export async function moderateVideo(params: {
  apiKey: string;
  idempotencyPrefix?: string;
  videoUrl: string;
}): Promise<VideoModerationSummary> {
  const result = await moderateVideoWithSeeApi({
    apiKey: params.apiKey,
    idempotencyKey: params.idempotencyPrefix,
    videoUrl: params.videoUrl,
  });
  const summary: VideoModerationSummary = {
    checkedAt: new Date().toISOString(),
    flagged: result.flagged,
    provider: 'seeapi',
    mediaType: 'video',
    frameCount: result.checkedFrames,
    results: result.frames,
    status: result.flagged ? 'rejected' : 'passed',
    taskId: result.taskId,
  };

  if (summary.status === 'rejected') {
    console.info('[video-safety] video rejected by SeeAPI', {
      frameCount: summary.frameCount,
      taskId: summary.taskId,
    });
    throw new VideoModerationRejectedError(summary);
  }

  return summary;
}
