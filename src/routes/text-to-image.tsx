import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { TextToVideo } from '@/blocks/text-to-video';

const textToImageSearchSchema = z.object({
  prompt: z.string().max(4000).optional(),
});

function TextToImageRoute() {
  const { prompt } = Route.useSearch();
  return <TextToVideo initialPrompt={prompt} showTemplateFeed={false} />;
}

export const Route = createFileRoute('/text-to-image')({
  validateSearch: textToImageSearchSchema,
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
  component: TextToImageRoute,
});
