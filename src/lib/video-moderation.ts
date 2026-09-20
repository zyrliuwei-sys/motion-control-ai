import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { StorageManager } from '@/core/storage';
import { getUuid } from '@/lib/hash';
import {
  assertImagesAllowed,
  ImageModerationError,
  ImageModerationRejectedError,
  type ImageModerationResult,
} from '@/lib/seeapi-moderation';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_FRAME_BYTES = 5 * 1024 * 1024;
const MAX_FRAMES = 3;
const FETCH_TIMEOUT_MS = 30_000;
const FFMPEG_TIMEOUT_MS = 30_000;

export type VideoModerationSummary = {
  checkedAt: string;
  provider: 'seeapi';
  mediaType: 'video';
  frameCount: number;
  results: ImageModerationResult[];
  status: 'passed' | 'rejected';
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

function isPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    const hostname = url.hostname
      .toLowerCase()
      .replace(/^\[/, '')
      .replace(/\]$/, '');
    return !(
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      /^f[cd][0-9a-f]{2}:/.test(hostname) ||
      hostname.startsWith('fe80:') ||
      hostname.startsWith('::ffff:127.') ||
      hostname.startsWith('::ffff:10.') ||
      hostname.startsWith('::ffff:192.168.') ||
      /^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    );
  } catch {
    return false;
  }
}

async function downloadVideo(url: string, directory: string): Promise<string> {
  if (!isPublicHttpsUrl(url)) {
    throw new VideoModerationError(
      'Reference videos must use public HTTPS URLs.',
      400
    );
  }

  let response: Response;
  try {
    response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new VideoModerationError(
      'Video moderation could not download the video. Please try again later.'
    );
  }

  if (!response.ok || response.status >= 300) {
    throw new VideoModerationError(
      'Video moderation could not read the video. Please try again later.',
      response.status >= 400 && response.status < 500 ? 400 : 503
    );
  }

  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_VIDEO_BYTES) {
    throw new VideoModerationError(
      'Video exceeds the 100MB moderation limit.',
      400
    );
  }

  const body = Buffer.from(await response.arrayBuffer());
  if (!body.length || body.length > MAX_VIDEO_BYTES) {
    throw new VideoModerationError(
      'Video exceeds the 100MB moderation limit.',
      400
    );
  }

  const inputPath = join(directory, 'input-video');
  await writeFile(inputPath, body, { mode: 0o600 });
  return inputPath;
}

async function runCommand(
  command: string,
  args: string[],
  options: { binaryOutput?: boolean } = {}
): Promise<string | Buffer> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const stdout: Buffer[] = [];
    let outputBytes = 0;
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      settled = true;
      clearTimeout(timeout);
      reject(new VideoModerationError('Video frame extraction timed out.'));
    }, FFMPEG_TIMEOUT_MS);

    child.stdout.on('data', (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (options.binaryOutput && outputBytes > MAX_FRAME_BYTES) {
        child.kill('SIGKILL');
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(
            new VideoModerationError('Extracted video frame is too large.')
          );
        }
        return;
      }
      stdout.push(Buffer.from(chunk));
    });
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(
        new VideoModerationError(
          error instanceof Error && error.message.includes('ENOENT')
            ? 'Video moderation requires ffmpeg and ffprobe on the server.'
            : 'Video frame extraction failed. Please try again later.'
        )
      );
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code !== 0) {
        reject(
          new VideoModerationError(
            'Video frame extraction failed. Please try again later.'
          )
        );
        return;
      }
      resolve(
        options.binaryOutput
          ? Buffer.concat(stdout)
          : Buffer.concat(stdout).toString('utf8')
      );
    });
  });
}

async function extractFrameTimes(videoPath: string): Promise<number[]> {
  const output = await runCommand('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    videoPath,
  ]);
  const duration = Number(String(output).trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new VideoModerationError(
      'Video duration could not be determined. Please try another video.',
      400
    );
  }

  const rawTimes = [0, duration / 2, Math.max(0, duration - 0.25)];
  return rawTimes.filter(
    (time, index, values) =>
      values.findIndex((candidate) => Math.abs(candidate - time) < 0.2) ===
      index
  );
}

async function extractFrame(
  videoPath: string,
  seconds: number
): Promise<Buffer> {
  const frame = await runCommand(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-ss',
      seconds.toFixed(3),
      '-i',
      videoPath,
      '-frames:v',
      '1',
      '-vf',
      'scale=1280:-2',
      '-q:v',
      '4',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      'pipe:1',
    ],
    { binaryOutput: true }
  );
  if (!Buffer.isBuffer(frame) || !frame.length) {
    throw new VideoModerationError('Video frame extraction returned no image.');
  }
  return frame;
}

/**
 * SeeAPI currently moderates images, so videos are checked by sampling three
 * keyframes. No video URL is returned to a caller until every sampled frame
 * has passed SeeAPI's image moderation.
 */
export async function moderateVideo(params: {
  apiKey: string;
  storage: StorageManager;
  videoUrl: string;
  idempotencyPrefix?: string;
}): Promise<VideoModerationSummary> {
  const directory = await mkdtemp(join(tmpdir(), 'seeapi-video-'));
  const temporaryKeys: string[] = [];
  let frameCount = 0;

  try {
    const videoPath = await downloadVideo(params.videoUrl, directory);
    const frameTimes = await extractFrameTimes(videoPath);
    const frameUrls: string[] = [];

    for (const [index, time] of frameTimes.slice(0, MAX_FRAMES).entries()) {
      const frame = await extractFrame(videoPath, time);
      const key = `moderation/video/${getUuid()}/${index + 1}.jpg`;
      const uploaded = await params.storage.uploadFile({
        body: frame,
        key,
        contentType: 'image/jpeg',
        disposition: 'inline',
      });
      if (
        !uploaded.success ||
        !uploaded.url ||
        !isPublicHttpsUrl(uploaded.url)
      ) {
        throw new VideoModerationError(
          'Video moderation could not publish a temporary frame. Please try again later.'
        );
      }
      temporaryKeys.push(uploaded.key || key);
      frameUrls.push(uploaded.url);
    }

    frameCount = frameUrls.length;
    const summary = await assertImagesAllowed({
      apiKey: params.apiKey,
      idempotencyPrefix: params.idempotencyPrefix || `video-${getUuid()}`,
      imageUrls: frameUrls,
    });
    const videoSummary: VideoModerationSummary = {
      checkedAt: summary.checkedAt,
      provider: 'seeapi',
      mediaType: 'video',
      frameCount: frameUrls.length,
      results: summary.results,
      status: summary.status,
    };

    if (videoSummary.status === 'rejected') {
      throw new VideoModerationRejectedError(videoSummary);
    }
    return videoSummary;
  } catch (error) {
    if (error instanceof ImageModerationRejectedError) {
      throw new VideoModerationRejectedError({
        checkedAt: new Date().toISOString(),
        provider: 'seeapi',
        mediaType: 'video',
        frameCount,
        results: error.results,
        status: 'rejected',
      });
    }
    throw error;
  } finally {
    await Promise.all(
      temporaryKeys.map((key) =>
        params.storage.deleteFile({ key }).catch(() => false)
      )
    );
    await rm(directory, { recursive: true, force: true });
  }
}
