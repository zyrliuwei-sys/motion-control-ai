import { createFileRoute } from '@tanstack/react-router';

import { respErr } from '@/lib/resp';

function disabled() {
  return respErr(
    'This legacy image route is disabled. Use the image generator instead.'
  );
}

export const Route = createFileRoute('/api/fal/flux-2')({
  server: { handlers: { GET: disabled, POST: disabled } },
});
