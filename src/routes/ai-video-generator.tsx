import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { SITE_URL } from '@/lib/motion-control-seo';
import { m } from '@/paraglide/messages.js';
import { getLocale, localizeUrl } from '@/paraglide/runtime.js';
import { AiVideoGenerator } from '@/blocks/ai-video-generator';
import { studioNavGroups } from '@/blocks/text-to-video';
import { SenziaAppShell } from '@/components/senzia-app-shell';

const pagePath = '/ai-video-generator';
const socialImageUrl = `${SITE_URL}/proactiv/showcase-videos/neon-dancer.jpg`;

function localizedUrl(locale: string) {
  return localizeUrl(`${SITE_URL}${pagePath}`, {
    locale: locale as 'en' | 'zh',
  }).href;
}

function breadcrumbStructuredData(locale: string, canonicalUrl: string) {
  const isChinese = locale === 'zh';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isChinese ? '首页' : 'Home',
        item: localizeUrl(`${SITE_URL}/`, {
          locale: locale as 'en' | 'zh',
        }).href,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: m['ai_video.page.title']({}, { locale: locale as 'en' | 'zh' }),
        item: canonicalUrl,
      },
    ],
  };
}

function faqStructuredData(locale: string) {
  const records = m['ai_video.faq.records'](
    {},
    { locale: locale as 'en' | 'zh' }
  )
    .split('\n')
    .filter(Boolean)
    .map((record) => {
      const [question, answer] = record.split('||');
      return {
        '@type': 'Question',
        name: question ?? '',
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer ?? '',
        },
      };
    });

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: records,
  };
}

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
  head: () => {
    const locale = getLocale();
    const canonicalUrl = localizedUrl(locale);
    const pageTitle = m['ai_video.meta.title']({}, { locale });
    const pageDescription = m['ai_video.meta.description']({}, { locale });

    return {
      meta: [
        { title: pageTitle },
        { name: 'description', content: pageDescription },
        { name: 'robots', content: 'index,follow' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: pageTitle },
        { property: 'og:description', content: pageDescription },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:image', content: socialImageUrl },
        { property: 'og:image:alt', content: pageTitle },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: pageTitle },
        { name: 'twitter:description', content: pageDescription },
        { name: 'twitter:image', content: socialImageUrl },
        {
          'script:ld+json': breadcrumbStructuredData(locale, canonicalUrl),
        },
        { 'script:ld+json': faqStructuredData(locale) },
      ],
      links: [
        { rel: 'canonical', href: canonicalUrl },
        { rel: 'alternate', hrefLang: 'en', href: localizedUrl('en') },
        { rel: 'alternate', hrefLang: 'zh', href: localizedUrl('zh') },
      ],
    };
  },
  component: AiVideoGeneratorRoute,
});
