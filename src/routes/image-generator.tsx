import { createFileRoute } from '@tanstack/react-router';

import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';

function ImageGeneratorRoute() {
  return null;
}

export const Route = createFileRoute('/image-generator')({
  loader: () => {
    const locale = getLocale();
    return {
      description: m['image_generator.meta_description']({}, { locale }),
      title: m['image_generator.meta_title']({}, { locale }),
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.title },
          { name: 'description', content: loaderData.description },
        ]
      : [],
  }),
  component: ImageGeneratorRoute,
});
