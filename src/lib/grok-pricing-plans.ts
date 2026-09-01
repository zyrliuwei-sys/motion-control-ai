/**
 * Public Grok Imagine Image credit packages.
 *
 * Credit amounts use the same unit as EvoLink's published model credits. The
 * Grok route deducts a 7× retail amount from these balances; for example, a
 * default 1K Medium image costs 22 website credits.
 */
export const GROK_DEFAULT_IMAGE_CREDITS = 22;

export type GrokPricingPeriod = 'monthly' | 'oneTime' | 'yearly';

export type GrokPricingPlan = {
  credits: number;
  priceInCents: number;
  productId: string;
};

export const grokPricingPlans = {
  essentials: {
    monthly: {
      credits: 1_350,
      priceInCents: 1_900,
      productId: 'starter_monthly',
    },
    yearly: {
      credits: 16_200,
      priceInCents: 19_000,
      productId: 'starter_yearly',
    },
    oneTime: {
      credits: 680,
      priceInCents: 1_000,
      productId: 'starter_lifetime',
    },
  },
  studio: {
    monthly: {
      credits: 2_900,
      priceInCents: 3_900,
      productId: 'pro_monthly',
    },
    yearly: {
      credits: 34_800,
      priceInCents: 39_000,
      productId: 'pro_yearly',
    },
    oneTime: {
      credits: 2_100,
      priceInCents: 3_000,
      productId: 'pro_lifetime',
    },
  },
  production: {
    monthly: {
      credits: 6_100,
      priceInCents: 5_900,
      productId: 'enterprise_monthly',
    },
    yearly: {
      credits: 73_200,
      priceInCents: 59_000,
      productId: 'enterprise_yearly',
    },
    oneTime: {
      credits: 6_000,
      priceInCents: 5_900,
      productId: 'enterprise_lifetime',
    },
  },
} as const satisfies Record<string, Record<GrokPricingPeriod, GrokPricingPlan>>;

export function defaultGrokImageEstimate(credits: number) {
  return Math.floor(credits / GROK_DEFAULT_IMAGE_CREDITS);
}
