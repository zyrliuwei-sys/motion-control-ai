import { createFileRoute } from '@tanstack/react-router';

import { Pricing } from '@/blocks/pricing';

export const Route = createFileRoute('/pricing')({
  component: Pricing,
});
