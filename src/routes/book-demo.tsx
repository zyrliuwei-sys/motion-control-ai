import { createFileRoute } from '@tanstack/react-router';

import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { BookDemo } from '@/blocks/book-demo';

export const Route = createFileRoute('/book-demo')({
  loader: () => {
    const locale = getLocale();
    return {
      title: m['proactiv.demo.meta_title']({}, { locale }),
      description: m['proactiv.demo.meta_description']({}, { locale }),
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
  component: BookDemo,
});
