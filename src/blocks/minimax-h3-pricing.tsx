import { m } from '@/paraglide/messages.js';
import { Pricing } from '@/blocks/pricing';
import { MiniMaxH3Pricing } from '@/components/minimax-h3-pricing';

/** Localized rate data for the Kling 3.0 Motion Control pricing page. */
export function MiniMaxH3PricingBlock() {
  return (
    <>
      <MiniMaxH3Pricing
        eyebrow={m['pricing.kling.eyebrow']()}
        title={m['pricing.kling.title']()}
        description={m['pricing.kling.description']()}
        columns={{
          model: m['pricing.kling.model'](),
          mode: m['pricing.kling.mode'](),
          quality: m['pricing.kling.quality'](),
          price: m['pricing.kling.price'](),
          credits: m['pricing.kling.credits'](),
        }}
        rates={[
          {
            model: m['pricing.kling.model_name'](),
            mode: m['pricing.kling.motion_control'](),
            quality: m['pricing.kling.resolution_720'](),
            rate: {
              price: '$0.605 / s',
              credits: '40.824',
            },
          },
          {
            model: m['pricing.kling.model_name'](),
            mode: m['pricing.kling.motion_control'](),
            quality: m['pricing.kling.resolution_1080'](),
            rate: {
              price: '$0.805 / s',
              credits: '54.460',
            },
          },
        ]}
        billingRulesLabel={m['pricing.kling.billing_rules']()}
        billingRules={[
          m['pricing.kling.billing_rule_price'](),
          m['pricing.kling.billing_rule_rounding'](),
          m['pricing.kling.billing_rule_duration'](),
          m['pricing.kling.billing_rule_total'](),
        ]}
        fallbackLabel={m['pricing.kling.fallback_label']()}
        fallbackNote={m['pricing.kling.fallback_note']()}
      />
      <Pricing
        title={m['pricing.kling.subscriptions_title']()}
        description={m['pricing.kling.subscriptions_description']()}
        periods={['one-time', 'monthly', 'yearly']}
      />
    </>
  );
}
