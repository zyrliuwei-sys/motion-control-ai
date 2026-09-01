import { createFileRoute } from '@tanstack/react-router';

import { staticPageRouteOptions } from './-static-page';

export const Route = createFileRoute('/(pages)/ai-image-prompt-guide')(
  staticPageRouteOptions('ai-image-prompt-guide')
);
