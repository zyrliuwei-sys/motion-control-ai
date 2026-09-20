import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getAllConfigs } from '@/modules/config/service';
import { getStorage } from '@/modules/storage/service';
import { md5 } from '@/lib/hash';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';
import {
  assertImagesAllowed,
  getSeeApiKey,
  ImageModerationError,
  ImageModerationRejectedError,
} from '@/lib/seeapi-moderation';
import {
  moderateVideo,
  VideoModerationRejectedError,
} from '@/lib/video-moderation';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime']);

function extFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'video/mp4':
      return 'mp4';
    case 'video/quicktime':
      return 'mov';
    default:
      return 'bin';
  }
}

function isPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname !== 'localhost' &&
      !url.hostname.endsWith('.localhost')
    );
  } catch {
    return false;
  }
}

async function POST({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const limited = enforceMinIntervalRateLimit(request, {
      intervalMs: 1_000,
      keyPrefix: 'upload-evolink-media',
      extraKey: session.user.id,
    });
    if (limited) return limited;

    const formData = await request.formData();
    const files = formData
      .getAll('files')
      .filter((value): value is File => value instanceof File);
    if (!files.length) return respErr('No files provided');

    const configs = await getAllConfigs();
    if (!configs.r2_domain || !isPublicHttpsUrl(configs.r2_domain)) {
      return respErr(
        'Configure a public HTTPS R2 domain in Admin → Settings → Storage before generating images or video.'
      );
    }

    const storage = await getStorage();
    if (!storage) {
      return respErr('Configure R2 storage before generating images or video.');
    }

    const images: string[] = [];
    const videos: string[] = [];
    const uploadedKeys: string[] = [];
    try {
      for (const file of files) {
        const isImage = IMAGE_TYPES.has(file.type);
        const isVideo = VIDEO_TYPES.has(file.type);
        if (!isImage && !isVideo) {
          throw new Error(`${file.name} must be a JPG, PNG, MP4, or MOV file`);
        }
        const limit = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
        if (file.size > limit) {
          throw new Error(
            `${file.name} exceeds the ${isImage ? '10MB image' : '100MB video'} limit`
          );
        }

        const body = new Uint8Array(await file.arrayBuffer());
        const key = `evolink/${md5(body)}.${extFromMime(file.type)}`;
        const existed = await storage.exists({ key });
        const result = await storage.uploadFile({
          body,
          key,
          contentType: file.type,
          disposition: 'inline',
        });
        if (!result.success || !result.url) {
          throw new Error(result.error || `Unable to upload ${file.name}`);
        }
        if (!isPublicHttpsUrl(result.url)) {
          throw new Error('Storage did not return a public HTTPS URL');
        }

        if (!existed) uploadedKeys.push(result.key || key);
        (isImage ? images : videos).push(result.url);
      }

      // The uploaded object is only a temporary public source for SeeAPI. Do
      // not return any image URL until it has passed content moderation.
      await assertImagesAllowed({
        apiKey: getSeeApiKey(),
        imageUrls: images,
      });
      for (const videoUrl of videos) {
        await moderateVideo({
          apiKey: getSeeApiKey(),
          storage,
          videoUrl,
        });
      }
    } catch (error) {
      await Promise.all(uploadedKeys.map((key) => storage.deleteFile({ key })));
      throw error;
    }

    return respData({ images, videos });
  } catch (error: any) {
    const message =
      error instanceof ImageModerationRejectedError
        ? 'This reference image cannot be uploaded. Please choose another image.'
        : error instanceof VideoModerationRejectedError
          ? 'This reference video cannot be uploaded. Please choose another video.'
          : error?.message || 'Unable to upload media';
    return respErr(
      message,
      error instanceof ImageModerationError
        ? { status: error.status }
        : undefined
    );
  }
}

export const Route = createFileRoute('/api/storage/upload-media')({
  server: {
    handlers: { POST },
  },
});
