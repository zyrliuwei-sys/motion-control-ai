import type { ProactivPriceTier } from '@/types/proactiv';

import { envConfigs } from '@/config';
import { grokPricingPlans } from '@/lib/grok-pricing-plans';
import { m } from '@/paraglide/messages.js';
import {
  ProactivEditorGuide,
  type ProactivEditorGuideItem,
} from '@/components/proactiv/proactiv-editor-guide';
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
import {
  ProactivWorkflow,
  type ProactivWorkflowStep,
} from '@/components/proactiv/proactiv-workflow';

const splitRows = (value: string) => value.split('\n').filter(Boolean);

// Lead with the more cinematic and abstract clips. Product and lifestyle work
// stays in the library, but no longer dominates the first viewport of cases.
const showcasePriority = new Map(
  [
    'product-studio',
    'blue-beauty',
    'skincare-creator',
    'skincare-phone',
    'skincare-influencer',
    'honey-detail',
    'lens-rotate',
    'camera-shutter',
    'coconut-splash',
    'coffee-on-off',
    'neon-fashion',
    'camaro-exit',
    'camaro-pose',
    'studio-model',
    'urban-fashion',
    'neon-dancer',
    'cyber-glasses',
    'fractal-space',
    'red-tunnel',
    'color-dance',
    'nightclub-dj',
    'blue-crystal',
    'black-cubes',
    'circular-tunnel',
    'triangle-tunnel',
    'dark-ink',
    'neon-sparkles',
    'stage-lights',
    'blue-tunnel',
    'mirror-fashion',
    'retro-dance',
  ].map((name, index) => [`/proactiv/showcase-videos/${name}.mp4`, index])
);

const showcaseAiImages = [
  {
    src: '/imgs/generated/showcase-cool-mountain-1787885973361.png',
    width: 886,
    height: 665,
  },
  {
    src: '/imgs/image/meigen-2008986705962123774-1.jpg',
    width: 768,
    height: 1376,
  },
  {
    src: '/imgs/image/meigen-community_298030b1-c8c1-4436-b88f-5ae556af9c6a.png',
    width: 1024,
    height: 1344,
  },
  {
    src: '/imgs/image/meigen-2075575662316749255-1.jpg',
    width: 1199,
    height: 675,
  },
  {
    src: '/imgs/image/meigen-2024104039827578910-1.jpg',
    width: 967,
    height: 1200,
  },
  {
    src: '/imgs/image/meigen-2080212481402896518-1.jpg',
    width: 904,
    height: 1200,
  },
  {
    src: '/imgs/image/meigen-community_5f68dfb7-b6d5-4734-b887-f5fed7c9d1af.jpg',
    width: 1696,
    height: 2528,
  },
  {
    src: '/imgs/image/meigen-2032013831548125557.jpg',
    width: 896,
    height: 1200,
  },
  {
    src: '/imgs/image/meigen-community_6f65fc5d-7d3a-48d6-908c-2bf947fd1c23.png',
    width: 1360,
    height: 2048,
  },
  {
    src: '/imgs/image/meigen-community_b827f6c2-5165-428e-9992-61f1de9e8ae3.png',
    width: 1008,
    height: 1792,
  },
  {
    src: '/imgs/image/meigen-2060729668958097717-1.jpg',
    width: 675,
    height: 1200,
  },
  {
    src: '/imgs/image/meigen-community_c18ad1be-f6fb-4e2b-970d-932dff8832b9.png',
    width: 1632,
    height: 2048,
  },
  {
    src: '/imgs/image/meigen-community_4461cb95-6748-4232-99cc-3d23b67c0b63.png',
    width: 1344,
    height: 1776,
  },
  {
    src: '/imgs/image/meigen-community_9786c744-2f71-4f16-abeb-fc5aa1cf7d6b.png',
    width: 1344,
    height: 1776,
  },
  {
    src: '/imgs/image/meigen-community_fb7a6b33-4d3a-459f-87e5-c67f611dd9a2.png',
    width: 1344,
    height: 1776,
  },
  {
    src: '/imgs/generated/showcase-cool-horse-1787886505859.png',
    width: 886,
    height: 665,
  },
  {
    src: '/imgs/generated/showcase-cool-deer-1787886008380.png',
    width: 886,
    height: 665,
  },
  {
    src: '/imgs/generated/showcase-cool-portrait-1787885969684.png',
    width: 886,
    height: 665,
  },
  {
    src: '/imgs/image/meigen-2069018297228575178-3.jpg',
    width: 675,
    height: 1199,
  },
  {
    src: '/imgs/image/meigen-2069018297228575178-2.jpg',
    width: 675,
    height: 1199,
  },
] as const;

const workflowGalleryImages = [
  {
    src: '/imgs/generated/workflow-gallery-mountain-1788172411584.png',
    width: 1024,
    height: 576,
  },
  {
    src: '/imgs/generated/workflow-gallery-portrait-1788172415506.png',
    width: 768,
    height: 768,
  },
  {
    src: '/imgs/generated/workflow-gallery-stag-1788172460025.png',
    width: 768,
    height: 768,
  },
] as const;

const workflowStepImages = [
  {
    src: '/imgs/generated/workflow-no-card-1788172520001.png',
    width: 1672,
    height: 941,
  },
  {
    src: '/imgs/generated/workflow-no-trial-1788172520002.png',
    width: 1672,
    height: 941,
  },
  {
    src: '/imgs/generated/workflow-no-meter-1788172520003.png',
    width: 1672,
    height: 941,
  },
] as const;

function navigation(): ProactivNavLink[] {
  return m['proactiv.nav']()
    .split('~~')
    .map((item) => {
      const [label, href] = item.split('|');
      return { label: label ?? '', href: href ?? '/' };
    });
}

function tiers(): ProactivPriceTier[] {
  const billingByTier = [
    grokPricingPlans.essentials,
    grokPricingPlans.studio,
    grokPricingPlans.production,
  ] as const;

  return splitRows(m['proactiv.pricing.tiers']()).map((row, index) => {
    const [title, description, cta, featured, items] = row.split('||');
    const billing = billingByTier[index];
    return {
      title: title ?? '',
      description: description ?? '',
      monthlyPrice: billing ? billing.monthly.priceInCents / 100 : null,
      monthlyCredits: billing?.monthly.credits ?? null,
      monthlyProductId: billing?.monthly.productId,
      yearlyPrice: billing ? billing.yearly.priceInCents / 100 : null,
      yearlyCredits: billing?.yearly.credits ?? null,
      yearlyProductId: billing?.yearly.productId,
      oneTimePrice: billing ? billing.oneTime.priceInCents / 100 : null,
      oneTimeCredits: billing?.oneTime.credits ?? null,
      oneTimeProductId: billing?.oneTime.productId,
      cta: cta ?? '',
      featured: featured === 'true',
      features: items?.split('~~').filter(Boolean) ?? [],
    };
  });
}

function faqs() {
  return splitRows(m['proactiv.pricing.faq_records']()).map((row) => {
    const [question, answer] = row.split('||');
    return { question: question ?? '', answer: answer ?? '' };
  });
}

function editorGuideItems(value: string): ProactivEditorGuideItem[] {
  return splitRows(value).map((row) => {
    const [title, description] = row.split('||');
    return { description: description ?? '', title: title ?? '' };
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
  const records = [
    m['proactiv.showcase.records'](),
    m['proactiv.showcase.extra_records'](),
  ].join('\n');

  return splitRows(records)
    .map((row) => {
      const [title, description, src, posterSrc, category] = row.split('||');
      return {
        category: category ?? '',
        title: title ?? '',
        description: description ?? '',
        src: src ?? '',
        posterSrc: posterSrc ?? '',
      };
    })
    .sort(
      (left, right) =>
        (showcasePriority.get(left.src) ?? Number.MAX_SAFE_INTEGER) -
        (showcasePriority.get(right.src) ?? Number.MAX_SAFE_INTEGER)
    )
    .map((videoCase, index) => ({
      ...videoCase,
      showcaseImage: showcaseAiImages[index],
    }));
}

function showcaseFilters(): ProactivVideoShowcaseFilter[] {
  return m['proactiv.showcase.filters']()
    .split('~~')
    .map((item) => {
      const [id, label] = item.split('|');
      return { id: id ?? '', label: label ?? '' };
    });
}

function workflowSteps(): ProactivWorkflowStep[] {
  return m['proactiv.workflow.records']()
    .split('~~')
    .map((item, index) => {
      const [number, title, description] = item.split('|');
      return {
        description: description ?? '',
        image: workflowStepImages[index],
        number: number ?? '',
        title: title ?? '',
      };
    })
    .filter((step) => step.number && step.title && step.description);
}

export function ProactivLanding() {
  const demoLabel = m['proactiv.book_demo']();

  return (
    <div className="proactiv-site min-h-screen overflow-hidden">
      <ProactivNav
        brand={envConfigs.app_name}
        links={navigation()}
        loginLabel={m['common.nav.get_started']()}
        loginHref="/sign-in"
        settingsLabel={m['common.nav.settings']()}
        signOutLabel={m['common.sign.sign_out_title']()}
      />
      <main className="pt-24">
        <ProactivMarketingHero
          eyebrow={m['proactiv.hero.eyebrow']()}
          ctaLabel={m['proactiv.hero.cta']()}
          title={m['proactiv.hero.title']()}
          description={m['proactiv.hero.subtitle']()}
          motionStatement={m['proactiv.hero.motion_statement']().split('||')}
          openEditorLabel={m['proactiv.hero.composer.open_editor']()}
          composerLabels={{
            addReference: m['proactiv.hero.composer.add_reference'](),
            aspectRatio: m['proactiv.hero.composer.aspect_ratio'](),
            avatar: m['proactiv.hero.composer.avatar'](),
            duration: m['proactiv.hero.composer.duration'](),
            durationLoading: m['proactiv.hero.composer.duration_loading'](),
            durationPending: m['proactiv.hero.composer.duration_pending'](),
            durationUnavailable:
              m['proactiv.hero.composer.duration_unavailable'](),
            durationUnsupported:
              m['proactiv.hero.composer.duration_unsupported'](),
            generate: m['proactiv.hero.composer.generate'](),
            generated: m['proactiv.hero.composer.generated'](),
            image: m['proactiv.hero.composer.image'](),
            imageModel: m['proactiv.hero.composer.image_model'](),
            model: m['proactiv.hero.composer.model'](),
            placeholder: m['proactiv.hero.composer.placeholder'](),
            product: m['proactiv.hero.composer.product'](),
            removeAttachment: m['proactiv.hero.composer.remove_attachment'](),
            resolution: m['proactiv.hero.composer.resolution'](),
            textModel: m['proactiv.hero.composer.text_model'](),
            video: m['proactiv.hero.composer.video'](),
            videoModel: m['proactiv.hero.composer.video_model'](),
          }}
        />
        <ProactivVideoShowcase
          title={m['proactiv.showcase.title']()}
          ctaLabel={m['proactiv.showcase.cta']()}
          description={m['proactiv.showcase.description']()}
          cases={showcaseCases()}
          filters={showcaseFilters()}
          maxCases={showcaseAiImages.length}
          showAllCategories
        />
        <ProactivWorkflow
          ctaHref="/text-to-image"
          ctaLabel={m['proactiv.workflow.cta']()}
          description={m['proactiv.workflow.description']()}
          eyebrow={m['proactiv.workflow.eyebrow']()}
          galleryCaption={m['proactiv.workflow.gallery_caption']()}
          galleryPrompt={m['proactiv.workflow.gallery_prompt']()}
          sideDescription={m['proactiv.workflow.side_description']()}
          sideImages={workflowGalleryImages}
          sideTitle={m['proactiv.workflow.side_title']()}
          steps={workflowSteps()}
          tags={m['proactiv.workflow.tags']().split('~~')}
          title={m['proactiv.workflow.title']()}
        />
        <ProactivEditorGuide
          title={m['proactiv.editor_guide.title']()}
          definition={m['proactiv.editor_guide.definition']()}
          definitionLinkLabel={m['proactiv.editor_guide.definition_link']()}
          howItWorksTitle={m['proactiv.editor_guide.how_it_works.title']()}
          steps={editorGuideItems(
            m['proactiv.editor_guide.how_it_works.records']()
          )}
          howItWorksLinkLabel={m['proactiv.editor_guide.how_it_works.link']()}
          featuresTitle={m['proactiv.editor_guide.features.title']()}
          features={editorGuideItems(
            m['proactiv.editor_guide.features.records']()
          )}
          useCasesTitle={m['proactiv.editor_guide.use_cases.title']()}
          useCases={editorGuideItems(
            m['proactiv.editor_guide.use_cases.records']()
          )}
          comparisonTitle={m['proactiv.editor_guide.comparison.title']()}
          comparison={m['proactiv.editor_guide.comparison.description']()}
          faqTitle={m['proactiv.editor_guide.faq.title']()}
          faqs={editorGuideItems(m['proactiv.editor_guide.faq.records']())}
          faqLinkLabel={m['proactiv.editor_guide.faq.link']()}
        />
        <ProactivPricing
          title={m['proactiv.pricing.title']()}
          description={m['proactiv.pricing.description']()}
          monthlyLabel={m['proactiv.pricing.monthly']()}
          yearlyLabel={m['proactiv.pricing.yearly']()}
          oneTimeLabel={m['proactiv.pricing.one_time']()}
          oneTimePriceLabel={m['proactiv.pricing.one_time_price_label']()}
          oneTimeCtaLabel={m['proactiv.pricing.buy_credits']()}
          creditsAfterPaymentLabel={m[
            'proactiv.pricing.credits_after_payment'
          ]()}
          processingCtaLabel={m['common.pricing.processing']()}
          annualBillingLabel={(price) =>
            m['proactiv.pricing.billed_annually']({ price })
          }
          tiers={tiers()}
          getCtaHref={(tier) =>
            tier.cta === demoLabel ? '/book-demo' : '/sign-up'
          }
        />
        <ProactivFaq title={m['proactiv.faq.title']()} faqs={faqs()} />
      </main>
      <ProactivFooter
        brand={envConfigs.app_name}
        copyright={m['proactiv.footer.copyright']()}
        rights={m['proactiv.footer.rights']()}
        columns={footerColumns()}
      />
    </div>
  );
}
