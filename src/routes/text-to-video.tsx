import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { TextToVideo } from '@/blocks/text-to-video';

const textToVideoSearchSchema = z.object({
  prompt: z.string().max(4000).optional(),
});

function TextToVideoRoute() {
  const { prompt } = Route.useSearch();
  return <TextToVideo initialPrompt={prompt} />;
}

export const Route = createFileRoute('/text-to-video')({
  validateSearch: textToVideoSearchSchema,
  loader: () => {
    const locale = getLocale();
    return {
      description: m['proactiv.video.meta_description']({}, { locale }),
      title: m['proactiv.video.meta_title']({}, { locale }),
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
  component: TextToVideoRoute,
});
