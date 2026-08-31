import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import type { AiTask } from '@/config/db/schema';
import { getTasks } from '@/modules/ai-tasks/service';
import { respData, respErr } from '@/lib/resp';

type FalImageResult = {
  images?: Array<{ url?: unknown }>;
};

function parseResult(value: string | null): FalImageResult | undefined {
  if (!value) return undefined;

  try {
    return JSON.parse(value) as FalImageResult;
  } catch {
    return undefined;
  }
}

function isPublicHttpsUrl(value: string) {
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

function imageUrls(taskResult: string | null) {
  const result = parseResult(taskResult);
  if (!Array.isArray(result?.images)) return [];

  return result.images.flatMap((image) =>
    typeof image.url === 'string' && isPublicHttpsUrl(image.url)
      ? [image.url]
      : []
  );
}

/** Same route the studio polls, so history images download with a forced
 * Content-Disposition instead of the cross-origin `download` hint. */
function downloadPath(model: string) {
  return model === 'fal-ai/flux-2' ? '/api/fal/flux-2' : '/api/fal/flux-2-edit';
}

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const tasks = await getTasks({
      limit: 32,
      mediaType: 'image',
      provider: 'fal',
      status: 'success',
      userId: session.user.id,
    });

    const images = tasks
      .flatMap((task: AiTask) =>
        imageUrls(task.taskResult).map((url, index) => ({
          createdAt: task.createdAt.toISOString(),
          downloadUrl: `${downloadPath(task.model)}?taskId=${encodeURIComponent(
            task.id
          )}&download=1&index=${index}`,
          id: `${task.id}-${index}`,
          model: task.model,
          prompt: task.prompt,
          url,
        }))
      )
      .slice(0, 48);

    return respData(images);
  } catch (error) {
    return respErr(
      error instanceof Error ? error.message : 'Unable to load image history'
    );
  }
}

export const Route = createFileRoute('/api/ai-tasks/images')({
  server: { handlers: { GET } },
});
