import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { AiVideoGenerator } from '@/blocks/ai-video-generator';
import { studioNavGroups } from '@/blocks/text-to-video';
import { SenziaAppShell } from '@/components/senzia-app-shell';

const pageTitle = 'AI Video Generator With No Filter - Uncensored, Free to Try';
const pageDescription =
  'Generate AI videos with no filter — no prompt rewriting, no content blocks. Text to video and image to video in one browser studio. Free credits, no card required.';
const canonicalUrl = 'https://www.uncensoredaieditor.com/ai-video-generator';
const socialImageUrl =
  'https://www.uncensoredaieditor.com/{{视频页封面图路径}}';

const breadcrumbStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.uncensoredaieditor.com/',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'AI Video Generator With No Filter',
      item: 'https://www.uncensoredaieditor.com/ai-video-generator',
    },
  ],
};

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is this AI video generator really unfiltered?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We do not filter, rewrite or refuse motion prompts, and we do not block adult, dark or unconventional themes. What you write is what the model receives. You must be 18 or older to generate adult content, and you are responsible for complying with the laws of your country and the rules of any platform you publish to.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need an account to generate a video?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You need to be signed in, because credits and your generation history are tied to your account. Signing in takes a few seconds.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many free credits do I get, and how far do they go?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '{{与正文保持一致：新账号赠送额度、单条视频消耗、约等于几条}}',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a watermark on the video?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '{{与正文保持一致：水印政策}}',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I choose aspect ratio and clip length?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Choose 9:16, 1:1 or 16:9 before generating, and pick the length from the options on the panel. Choosing the ratio up front gives a better clip than cropping afterwards.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does one video take to generate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A short clip normally finishes in {{生成耗时}} at 1K. Busy periods queue and paid plans are prioritised.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use the videos commercially?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '{{与正文保持一致：商用政策}}',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you keep my prompts and uploads?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '{{与正文保持一致：数据处理政策}}',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it work on mobile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, the studio runs in the browser on phones and tablets, and the 9:16 preset is built for vertical output. Batch work is still faster on desktop.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is this different from other AI video generators?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Three things: the prompt is not editorialised, the starting frame can be an image you already approved instead of a fresh guess, and the credit cost is visible before the task runs. If you came here looking for an AI video generator with no restrictions, an unfiltered video tool, or an image to video tool with no filter, it is the same feature.',
      },
    },
  ],
};

function AiVideoGeneratorRoute() {
  return (
    <SenziaAppShell
      brand={envConfigs.app_name}
      brandHref="/"
      languageLabel={m['proactiv.video.language']()}
      pricingLabel={m['landing.pricing.title']()}
      pricingHref="/pricing"
      collapseSidebarLabel={m['proactiv.sidebar.collapse']()}
      expandSidebarLabel={m['proactiv.sidebar.expand']()}
      navGroups={studioNavGroups('ai-video-generator')}
    >
      <AiVideoGenerator />
    </SenziaAppShell>
  );
}

export const Route = createFileRoute('/ai-video-generator')({
  head: () => ({
    meta: [
      { title: pageTitle },
      { name: 'description', content: pageDescription },
      { name: 'robots', content: 'index,follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: pageTitle },
      {
        property: 'og:description',
        content:
          'No prompt rewriting, no content blocks. Turn a prompt or a photo into a video and download it. Free credits to start.',
      },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: socialImageUrl },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: pageTitle },
      {
        name: 'twitter:description',
        content:
          'No prompt rewriting, no content blocks. Turn a prompt or a photo into a video and download it.',
      },
      { 'script:ld+json': breadcrumbStructuredData },
      { 'script:ld+json': faqStructuredData },
    ],
    links: [{ rel: 'canonical', href: canonicalUrl }],
  }),
  component: AiVideoGeneratorRoute,
});
