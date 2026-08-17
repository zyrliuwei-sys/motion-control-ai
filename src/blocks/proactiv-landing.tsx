import type { ProactivPriceTier } from '@/types/proactiv';

import { m } from '@/paraglide/messages.js';
import { ProactivFaq } from '@/components/proactiv/proactiv-faq';
import {
  ProactivFooter,
  type ProactivFooterColumn,
} from '@/components/proactiv/proactiv-footer';
import { ProactivMarketingHero } from '@/components/proactiv/proactiv-marketing-hero';
import {
  ProactivNav,
  type ProactivNavLink,
} from '@/components/proactiv/proactiv-nav';
import { ProactivPricing } from '@/components/proactiv/proactiv-pricing';
import {
  ProactivVideoShowcase,
  type ProactivVideoShowcaseCase,
  type ProactivVideoShowcaseFilter,
} from '@/components/proactiv/proactiv-video-showcase';

const splitRows = (value: string) => value.split('\n').filter(Boolean);

function navigation(): ProactivNavLink[] {
  return m['proactiv.nav']()
    .split('~~')
    .map((item) => {
      const [label, href] = item.split('|');
      return { label: label ?? '', href: href ?? '/' };
    });
}

function tiers(): ProactivPriceTier[] {
  return splitRows(m['proactiv.pricing.tiers']()).map((row) => {
    const [
      title,
      description,
      monthlyPrice,
      yearlyPrice,
      cta,
      featured,
      items,
    ] = row.split('||');
    return {
      title: title ?? '',
      description: description ?? '',
      monthlyPrice: monthlyPrice ? Number(monthlyPrice) : null,
      yearlyPrice: yearlyPrice ? Number(yearlyPrice) : null,
      cta: cta ?? '',
      featured: featured === 'true',
      features: items?.split('~~').filter(Boolean) ?? [],
    };
  });
}

function faqs() {
  return splitRows(m['proactiv.faq.records']()).map((row) => {
    const [question, answer] = row.split('||');
    return { question: question ?? '', answer: answer ?? '' };
  });
}

function footerColumns(): ProactivFooterColumn[] {
  return splitRows(m['proactiv.footer.columns']()).map((row) => {
    const [title, linksValue] = row.split('||');
    return {
      title: title ?? '',
      links: (linksValue ?? '').split('~~').map((item) => {
        const [label, href] = item.split('|');
        return {
          label: label ?? '',
          href: href ?? '#',
          external: /^https?:\/\//.test(href ?? ''),
        };
      }),
    };
  });
}

function showcaseCases(): ProactivVideoShowcaseCase[] {
  return splitRows(m['proactiv.showcase.records']()).map((row) => {
    const [title, description, src, posterSrc, category] = row.split('||');
    return {
      category: category ?? '',
      title: title ?? '',
      description: description ?? '',
      src: src ?? '',
      posterSrc: posterSrc ?? '',
    };
  });
}

function showcaseFilters(): ProactivVideoShowcaseFilter[] {
  return m['proactiv.showcase.filters']()
    .split('~~')
    .map((item) => {
      const [id, label] = item.split('|');
      return { id: id ?? '', label: label ?? '' };
    });
}

export function ProactivLanding() {
  const demoLabel = m['proactiv.book_demo']();

  return (
    <div className="proactiv-site min-h-screen overflow-hidden">
      <ProactivNav
        brand="Motion Control AI"
        links={navigation()}
        loginLabel={m['proactiv.login']()}
        loginHref="/sign-in"
        demoLabel={demoLabel}
        demoHref="/book-demo"
      />
      <main>
        <ProactivMarketingHero
          title={m['proactiv.hero.title']()}
          description={m['proactiv.hero.subtitle']()}
          composerLabels={{
            addReference: m['proactiv.hero.composer.add_reference'](),
            aspectRatio: m['proactiv.hero.composer.aspect_ratio'](),
            avatar: m['proactiv.hero.composer.avatar'](),
            batch: m['proactiv.hero.composer.batch'](),
            generate: m['proactiv.hero.composer.generate'](),
            generated: m['proactiv.hero.composer.generated'](),
            image: m['proactiv.hero.composer.image'](),
            model: m['proactiv.hero.composer.model'](),
            placeholder: m['proactiv.hero.composer.placeholder'](),
            product: m['proactiv.hero.composer.product'](),
            removeAttachment: m['proactiv.hero.composer.remove_attachment'](),
            style: m['proactiv.hero.composer.style'](),
            video: m['proactiv.hero.composer.video'](),
          }}
        />
        <ProactivVideoShowcase
          title={m['proactiv.showcase.title']()}
          description={m['proactiv.showcase.description']()}
          playLabel={m['proactiv.showcase.play']()}
          pauseLabel={m['proactiv.showcase.pause']()}
          muteLabel={m['proactiv.showcase.mute']()}
          unmuteLabel={m['proactiv.showcase.unmute']()}
          cases={showcaseCases()}
          filters={showcaseFilters()}
        />
        <ProactivPricing
          title={m['proactiv.pricing.title']()}
          description={m['proactiv.pricing.description']()}
          monthlyLabel={m['proactiv.pricing.monthly']()}
          yearlyLabel={m['proactiv.pricing.yearly']()}
          logosHeading={m['proactiv.pricing.trusted']()}
          tiers={tiers()}
          getCtaHref={(tier) =>
            tier.cta === demoLabel ? '/book-demo' : '/sign-up'
          }
        />
        <ProactivFaq title={m['proactiv.faq.title']()} faqs={faqs()} />
      </main>
      <ProactivFooter
        brand="Motion Control AI"
        copyright={m['proactiv.footer.copyright']()}
        rights={m['proactiv.footer.rights']()}
        columns={footerColumns()}
      />
    </div>
  );
}
