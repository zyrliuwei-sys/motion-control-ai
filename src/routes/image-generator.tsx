import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { ImageGenerator } from '@/blocks/image-generator';

function ImageGeneratorRoute() {
  const { prompt } = Route.useSearch();
  return <ImageGenerator initialPrompt={prompt} />;
}

export const Route = createFileRoute('/image-generator')({
  validateSearch: z.object({
    prompt: z.string().max(2500).optional(),
  }),
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
