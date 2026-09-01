import { createFileRoute } from '@tanstack/react-router';

import {
  MOTION_CONTROL_SITE_URL,
  motionControlSeo,
} from '@/lib/motion-control-seo';
import { m } from '@/paraglide/messages.js';
import { ProactivLanding } from '@/blocks/proactiv-landing';

function HomePage() {
  const faqs = m['proactiv.faq.records']()
    .split('\n')
    .filter(Boolean)
    .map((record) => {
      const [question, answer] = record.split('||');
      return { question: question ?? '', answer: answer ?? '' };
    });
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'uncensored ai',
      url: MOTION_CONTROL_SITE_URL,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '10',
        priceCurrency: 'USD',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <>
      <ProactivLanding />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: motionControlSeo.home.title },
      { name: 'description', content: motionControlSeo.home.description },
      { name: 'robots', content: 'index,follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: motionControlSeo.home.title },
      {
        property: 'og:description',
        content: motionControlSeo.home.description,
      },
      { property: 'og:url', content: MOTION_CONTROL_SITE_URL },
      {
        property: 'og:image',
        content: `${MOTION_CONTROL_SITE_URL}/proactiv/showcase-videos/neon-dancer.jpg`,
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: motionControlSeo.home.title },
      {
        name: 'twitter:description',
        content: motionControlSeo.home.description,
      },
      {
        name: 'twitter:image',
        content: `${MOTION_CONTROL_SITE_URL}/proactiv/showcase-videos/neon-dancer.jpg`,
      },
    ],
    links: [
      { rel: 'canonical', href: MOTION_CONTROL_SITE_URL },
      { rel: 'alternate', hrefLang: 'en', href: MOTION_CONTROL_SITE_URL },
    ],
  }),
  component: HomePage,
});
