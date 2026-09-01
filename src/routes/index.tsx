import { createFileRoute } from '@tanstack/react-router';

import {
  DEFAULT_SOCIAL_IMAGE_URL,
  SITE_URL,
  siteSeo,
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
      url: SITE_URL,
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
      { title: siteSeo.home.title },
      { name: 'description', content: siteSeo.home.description },
      { name: 'robots', content: 'index,follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: siteSeo.home.title },
      {
        property: 'og:description',
        content: siteSeo.home.description,
      },
      { property: 'og:url', content: SITE_URL },
      {
        property: 'og:image',
        content: DEFAULT_SOCIAL_IMAGE_URL,
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: siteSeo.home.title },
      {
        name: 'twitter:description',
        content: siteSeo.home.description,
      },
      {
        name: 'twitter:image',
        content: DEFAULT_SOCIAL_IMAGE_URL,
      },
    ],
    links: [{ rel: 'canonical', href: SITE_URL }],
  }),
  component: HomePage,
});
