import { grokPricingPlans } from '@/lib/grok-pricing-plans';
import { m } from '@/paraglide/messages.js';
import {
  AiVideoGeneratorWorkspace,
  type AiVideoBenefit,
  type AiVideoFeature,
  type AiVideoGeneratorCopy,
  type AiVideoModelCard,
} from '@/components/ai-video-generator-workspace';

const localVideoSources = Array.from(
  { length: 16 },
  (_, index) => `/ai-video/${String(index + 1).padStart(2, '0')}.mp4`
);

const videoAssignments = {
  features: [11, 12, 13, 15],
  models: [4, 5],
  steps: [8, 1, 7],
};

function records(value: string, size: 2 | 3): string[][] {
  return value
    .split('\n')
    .filter(Boolean)
    .map((row) => {
      const parts = row.split('||');
      return Array.from({ length: size }, (_, index) => parts[index] ?? '');
    });
}

function models(): AiVideoModelCard[] {
  return records(m['ai_video.models.records'](), 3).map(
    ([name, description, imageSrc], index) => ({
      description,
      imageSrc,
      name,
      // Keep the selector aligned with the EvoLink families currently wired
      // into the generation route.
      apiModel: name.startsWith('Seedance') ? 'seedance-2.5' : 'minimax-h3-max',
      videoSrc: localVideoSources[videoAssignments.models[index] ?? 0],
    })
  );
}

function features(): AiVideoFeature[] {
  return records(m['ai_video.feature_records'](), 3).map(
    ([title, description, imageSrc], index) => ({
      description,
      imageSrc,
      title,
      videoSrc: localVideoSources[videoAssignments.features[index] ?? 0],
    })
  );
}

function benefits(): AiVideoBenefit[] {
  return records(m['ai_video.benefits.records'](), 2).map(
    ([title, description]) => ({
      description,
      title,
    })
  );
}

function copy(): AiVideoGeneratorCopy {
  return {
    benefitsTitle: m['ai_video.benefits.title'](),
    checkoutFailedMessage: m['ai_video.paywall.checkout_failed'](),
    credits: m['ai_video.credits'](),
    creditsUnit: m['ai_video.credits_unit'](),
    creditPaywallDescription: m['ai_video.paywall.description'](),
    creditPaywallTitle: m['ai_video.paywall.title'](),
    eyebrow: m['ai_video.eyebrow'](),
    expandInput: m['ai_video.expand_input'](),
    generate: m['ai_video.generate'](),
    history: m['ai_video.history'](),
    historyDownload: m['ai_video.history.download'](),
    historyEmpty: m['ai_video.history.empty'](),
    historyOpen: m['ai_video.history.open'](),
    historyTitle: m['ai_video.history.title'](),
    mode: m['ai_video.mode'](),
    modeImage: m['ai_video.mode.image'](),
    modeReference: m['ai_video.mode.reference'](),
    modeText: m['ai_video.mode.text'](),
    model: m['ai_video.model'](),
    optional: m['ai_video.upload.optional'](),
    output: m['ai_video.output'](),
    pageDescription: m['ai_video.page.description'](),
    pageTitle: m['ai_video.page.title'](),
    promptLabel: m['ai_video.prompt.label'](),
    promptPlaceholder: m['ai_video.prompt.placeholder'](),
    queuedLabel: m['ai_video.status.queued'](),
    readyLabel: m['ai_video.status.ready'](),
    removeUpload: m['ai_video.remove_upload'](),
    settings: m['ai_video.settings'](),
    uploadImage: m['ai_video.upload.title'](),
    monthlyPlanOptions: [
      {
        productId: grokPricingPlans.essentials.monthly.productId,
        price: grokPricingPlans.essentials.monthly.priceInCents / 100,
        planName: m['landing.pricing.essentials'](),
        creditsLabel: m['landing.pricing.feature_credits']({
          credits:
            grokPricingPlans.essentials.monthly.credits.toLocaleString('en-US'),
        }),
        billingLabel: m['proactiv.pricing.monthly'](),
      },
      {
        productId: grokPricingPlans.studio.monthly.productId,
        price: grokPricingPlans.studio.monthly.priceInCents / 100,
        planName: m['landing.pricing.studio'](),
        creditsLabel: m['landing.pricing.feature_credits']({
          credits:
            grokPricingPlans.studio.monthly.credits.toLocaleString('en-US'),
        }),
        billingLabel: m['proactiv.pricing.monthly'](),
      },
      {
        productId: grokPricingPlans.production.monthly.productId,
        price: grokPricingPlans.production.monthly.priceInCents / 100,
        planName: m['landing.pricing.production'](),
        creditsLabel: m['landing.pricing.feature_credits']({
          credits:
            grokPricingPlans.production.monthly.credits.toLocaleString('en-US'),
        }),
        billingLabel: m['proactiv.pricing.monthly'](),
      },
    ],
  };
}

export function AiVideoGenerator() {
  return (
    <AiVideoGeneratorWorkspace
      benefits={benefits()}
      copy={copy()}
      features={features()}
      models={models()}
    />
  );
}
