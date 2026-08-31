import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { PhotoEditor } from '@/blocks/photo-editor';

function PhotoEditorRoute() {
  const { mode, prompt } = Route.useSearch();
  return <PhotoEditor initialMode={mode} initialPrompt={prompt} />;
}

export const Route = createFileRoute('/photo-editor')({
  validateSearch: z.object({
    mode: z.enum(['edit', 'text']).optional(),
    prompt: z.string().max(2500).optional(),
  }),
  loader: () => {
    const locale = getLocale();
    return {
      title: m['proactiv.photo_editor.meta_title']({}, { locale }),
      description: m['proactiv.photo_editor.meta_description']({}, { locale }),
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
  component: PhotoEditorRoute,
});
