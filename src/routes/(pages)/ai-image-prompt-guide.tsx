import { createFileRoute } from '@tanstack/react-router';

import { TEXT_TO_IMAGE_SOCIAL_IMAGE_URL } from '@/lib/motion-control-seo';

import { staticPageRouteOptions } from './-static-page';

export const Route = createFileRoute('/(pages)/ai-image-prompt-guide')(
  staticPageRouteOptions('ai-image-prompt-guide', {
    socialImage: TEXT_TO_IMAGE_SOCIAL_IMAGE_URL,
  })
);
