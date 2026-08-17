import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getAllConfigs } from '@/modules/config/service';
import { getStorage } from '@/modules/storage/service';
import { md5 } from '@/lib/hash';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';

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
        'Configure a public HTTPS R2 domain in Admin → Settings → Storage before using EvoLink motion control.'
      );
    }

    const storage = await getStorage();
    if (!storage) {
      return respErr(
        'Configure R2 storage before using EvoLink motion control.'
      );
    }

    const images: string[] = [];
    const videos: string[] = [];
    for (const file of files) {
      const isImage = IMAGE_TYPES.has(file.type);
      const isVideo = VIDEO_TYPES.has(file.type);
      if (!isImage && !isVideo) {
        return respErr(`${file.name} must be a JPG, PNG, MP4, or MOV file`);
      }
      const limit = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
      if (file.size > limit) {
        return respErr(
          `${file.name} exceeds the ${isImage ? '10MB image' : '100MB video'} limit`
        );
      }

      const body = new Uint8Array(await file.arrayBuffer());
      const key = `evolink/${md5(body)}.${extFromMime(file.type)}`;
      const result = await storage.uploadFile({
        body,
        key,
        contentType: file.type,
        disposition: 'inline',
      });
      if (!result.success || !result.url) {
        return respErr(result.error || `Unable to upload ${file.name}`);
      }
      if (!isPublicHttpsUrl(result.url)) {
        return respErr('Storage did not return a public HTTPS URL');
      }

      (isImage ? images : videos).push(result.url);
    }

    return respData({ images, videos });
  } catch (error: any) {
    return respErr(error?.message || 'Unable to upload media');
  }
}

export const Route = createFileRoute('/api/storage/upload-media')({
  server: {
    handlers: { POST },
  },
});
