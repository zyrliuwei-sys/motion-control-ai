import { createFileRoute } from '@tanstack/react-router';

import { getConfig } from '@/modules/config/service';
import { isValidIndexNowKey } from '@/modules/indexnow/service';

async function GET() {
  const key = await getConfig('indexnow_key');
  if (!isValidIndexNowKey(key)) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(key, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Robots-Tag': 'noindex',
    },
  });
}

export const Route = createFileRoute('/indexnow-key.txt')({
  server: { handlers: { GET } },
});
