import { createFileRoute } from '@tanstack/react-router';

import {
  MOTION_CONTROL_SITE_URL,
  motionControlSeo,
} from '@/lib/motion-control-seo';

const canonicalUrl = `${MOTION_CONTROL_SITE_URL}/ai-motion-control`;

function AiMotionControlPage() {
  return null;
}

export const Route = createFileRoute('/ai-motion-control')({
  head: () => ({
    meta: [
      { title: motionControlSeo.aiMotionControl.title },
      {
        name: 'description',
        content: motionControlSeo.aiMotionControl.description,
      },
      { name: 'robots', content: 'index,follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: motionControlSeo.aiMotionControl.title },
      {
        property: 'og:description',
        content: motionControlSeo.aiMotionControl.description,
      },
      { property: 'og:url', content: canonicalUrl },
      {
        property: 'og:image',
        content: `${MOTION_CONTROL_SITE_URL}/proactiv/showcase-videos/neon-dancer.jpg`,
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: motionControlSeo.aiMotionControl.title,
      },
      {
        name: 'twitter:description',
        content: motionControlSeo.aiMotionControl.description,
      },
      {
        name: 'twitter:image',
        content: `${MOTION_CONTROL_SITE_URL}/proactiv/showcase-videos/neon-dancer.jpg`,
      },
    ],
    links: [
      { rel: 'canonical', href: canonicalUrl },
      { rel: 'alternate', hrefLang: 'en', href: canonicalUrl },
    ],
  }),
  component: AiMotionControlPage,
});
