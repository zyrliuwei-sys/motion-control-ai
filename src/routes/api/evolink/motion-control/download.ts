import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getMotionControlDownloadUrl } from '@/modules/evolink/service';
import { respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return respErr('Unauthorized');

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId')?.trim();
    const index = Number(searchParams.get('index') ?? '0');
    if (!taskId) return respErr('taskId is required');
    if (!Number.isInteger(index) || index < 0 || index > 19) {
      return respErr('Invalid video index');
    }

    const sourceUrl = await getMotionControlDownloadUrl({
      userId: session.user.id,
      taskId,
      index,
    });
    const upstream = await fetch(sourceUrl);
    if (!upstream.ok || !upstream.body) {
      return respErr(`Video download failed (${upstream.status})`);
    }

    const fileId = taskId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
    return new Response(upstream.body, {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="motion-control-${fileId || 'video'}-${index + 1}.mp4"`,
        'Content-Type': upstream.headers.get('content-type') || 'video/mp4',
      },
    });
  } catch (error: any) {
    return respErr(error?.message || 'Unable to download generated video');
  }
}

export const Route = createFileRoute('/api/evolink/motion-control/download')({
  server: {
    handlers: { GET },
  },
});
