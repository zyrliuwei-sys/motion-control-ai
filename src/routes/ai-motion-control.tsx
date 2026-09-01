import { createFileRoute } from '@tanstack/react-router';

import {
  DEFAULT_SOCIAL_IMAGE_URL,
  SITE_URL,
  siteSeo,
} from '@/lib/motion-control-seo';

const canonicalUrl = `${SITE_URL}/ai-motion-control`;

function AiMotionControlPage() {
  return null;
}

export const Route = createFileRoute('/ai-motion-control')({
  head: () => ({
    meta: [
      { title: siteSeo.aiMotionControl.title },
      {
        name: 'description',
        content: siteSeo.aiMotionControl.description,
      },
      { name: 'robots', content: 'index,follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: siteSeo.aiMotionControl.title },
      {
        property: 'og:description',
        content: siteSeo.aiMotionControl.description,
      },
      { property: 'og:url', content: canonicalUrl },
      {
        property: 'og:image',
        content: DEFAULT_SOCIAL_IMAGE_URL,
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: siteSeo.aiMotionControl.title,
      },
      {
        name: 'twitter:description',
        content: siteSeo.aiMotionControl.description,
      },
      {
        name: 'twitter:image',
        content: DEFAULT_SOCIAL_IMAGE_URL,
      },
    ],
    links: [
      { rel: 'canonical', href: canonicalUrl },
      { rel: 'alternate', hrefLang: 'en', href: canonicalUrl },
    ],
  }),
  component: AiMotionControlPage,
});
