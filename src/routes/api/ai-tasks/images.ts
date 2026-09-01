import { createFileRoute } from '@tanstack/react-router';

import { extractEvolinkImageUrls } from '@/core/ai';
import { getAuth } from '@/core/auth';
import type { AiTask } from '@/config/db/schema';
import { getTasks } from '@/modules/ai-tasks/service';
import { EVOLINK_GROK_IMAGINE_IMAGE_MODEL } from '@/modules/evolink-grok-image/service';
import { respData, respErr } from '@/lib/resp';

function parseResult(value: string | null): unknown {
  if (!value) return undefined;

  try {
    return JSON.parse(value) as unknown;
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
  return extractEvolinkImageUrls(parseResult(taskResult)).filter(
    isPublicHttpsUrl
  );
}

/** Same route the studio polls, so history images download with a forced
 * Content-Disposition instead of the cross-origin `download` hint. */
const downloadPath = '/api/evolink/grok-imagine-image';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const tasks = await getTasks({
      limit: 32,
      mediaType: 'image',
      provider: 'evolink',
      status: 'success',
      userId: session.user.id,
    });

    const images = tasks
      .filter((task: AiTask) => task.model === EVOLINK_GROK_IMAGINE_IMAGE_MODEL)
      .flatMap((task: AiTask) =>
        imageUrls(task.taskResult).map((url, index) => ({
          createdAt: task.createdAt.toISOString(),
          downloadUrl: `${downloadPath}?taskId=${encodeURIComponent(
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
