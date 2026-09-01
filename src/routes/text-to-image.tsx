import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { useRouter } from '@/core/i18n/navigation';
import {
  SITE_URL,
  siteSeo,
  TEXT_TO_IMAGE_SOCIAL_IMAGE_URL,
} from '@/lib/motion-control-seo';
import { TextToVideo } from '@/blocks/text-to-video';
import {
  textToImageFaqs,
  TextToImageSeoContent,
} from '@/components/text-to-image-seo-content';

const textToImageSearchSchema = z.object({
  prompt: z.string().max(4000).optional(),
});
const canonicalUrl = `${SITE_URL}${siteSeo.textToImage.path}`;

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: textToImageFaqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

function TextToImageRoute() {
  const { prompt } = Route.useSearch();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        event.isComposing
      ) {
        return;
      }

      event.preventDefault();
      router.push('/');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <>
      <TextToVideo initialPrompt={prompt} showTemplateFeed={false} />
      <TextToImageSeoContent />
    </>
  );
}

export const Route = createFileRoute('/text-to-image')({
  validateSearch: textToImageSearchSchema,
  head: () => ({
    meta: [
      { title: siteSeo.textToImage.title },
      { name: 'description', content: siteSeo.textToImage.description },
      { name: 'robots', content: 'index,follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: siteSeo.textToImage.title },
      {
        property: 'og:description',
        content: siteSeo.textToImage.description,
      },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: TEXT_TO_IMAGE_SOCIAL_IMAGE_URL },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: siteSeo.textToImage.title },
      {
        name: 'twitter:description',
        content: siteSeo.textToImage.description,
      },
      {
        name: 'twitter:image',
        content: TEXT_TO_IMAGE_SOCIAL_IMAGE_URL,
      },
      { 'script:ld+json': faqStructuredData },
    ],
    links: [
      { rel: 'canonical', href: canonicalUrl },
      { rel: 'alternate', hrefLang: 'en', href: canonicalUrl },
      {
        rel: 'alternate',
        hrefLang: 'zh',
        href: `${SITE_URL}/zh${siteSeo.textToImage.path}`,
      },
    ],
  }),
  component: TextToImageRoute,
});
