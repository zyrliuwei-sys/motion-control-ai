/**
 * Authoritative pricing catalog.
 *
 * The checkout API uses this as the SOURCE OF TRUTH for price/credits/duration.
 * Any price, credits, or plan info sent by the client is IGNORED — only the
 * product_id is honored, and everything else is looked up here.
 *
 * To change pricing, edit this file and redeploy. Admin UI cannot alter prices.
 */

import { PaymentInterval, PaymentType } from '@/core/payment/types';
import { grokPricingPlans } from '@/lib/grok-pricing-plans';

export type PricingPlanInfo = {
  name: string;
  interval: PaymentInterval;
  intervalCount: number;
};

export type PricingProduct = {
  productId: string;
  productName: string;
  planName: string;
  description: string;
  type: PaymentType;
  priceInCents: number;
  currency: string;
  credits: number;
  creditsValidDays?: number;
  plan?: PricingPlanInfo;
};

/**
 * Grok Imagine Image 2.0 catalog. Credit amounts use the same unit as the
 * EvoLink API; the image-generation route deducts the published API credit
 * cost at a 7× retail multiplier.
 * Keys MUST match what the pricing UI sends as product_id.
 */
export const pricingCatalog: Record<string, PricingProduct> = {
  starter_monthly: {
    productId: 'starter_monthly',
    productName: 'Essentials Monthly',
    planName: 'Essentials Monthly',
    description: 'Monthly AI image credits',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: grokPricingPlans.essentials.monthly.priceInCents,
    currency: 'usd',
    credits: grokPricingPlans.essentials.monthly.credits,
    plan: {
      name: 'Essentials Monthly',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  pro_monthly: {
    productId: 'pro_monthly',
    productName: 'Studio Monthly',
    planName: 'Studio Monthly',
    description: 'Monthly AI image credits',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: grokPricingPlans.studio.monthly.priceInCents,
    currency: 'usd',
    credits: grokPricingPlans.studio.monthly.credits,
    plan: {
      name: 'Studio Monthly',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  enterprise_monthly: {
    productId: 'enterprise_monthly',
    productName: 'Production Monthly',
    planName: 'Production Monthly',
    description: 'Monthly AI image credits',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: grokPricingPlans.production.monthly.priceInCents,
    currency: 'usd',
    credits: grokPricingPlans.production.monthly.credits,
    plan: {
      name: 'Production Monthly',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  starter_yearly: {
    productId: 'starter_yearly',
    productName: 'Essentials Annual',
    planName: 'Essentials Annual',
    description: 'Annual AI image credits',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: grokPricingPlans.essentials.yearly.priceInCents,
    currency: 'usd',
    credits: grokPricingPlans.essentials.yearly.credits,
    plan: {
      name: 'Essentials Annual',
      interval: PaymentInterval.YEAR,
      intervalCount: 1,
    },
  },
  pro_yearly: {
    productId: 'pro_yearly',
    productName: 'Studio Annual',
    planName: 'Studio Annual',
    description: 'Annual AI image credits',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: grokPricingPlans.studio.yearly.priceInCents,
    currency: 'usd',
    credits: grokPricingPlans.studio.yearly.credits,
    plan: {
      name: 'Studio Annual',
      interval: PaymentInterval.YEAR,
      intervalCount: 1,
    },
  },
  enterprise_yearly: {
    productId: 'enterprise_yearly',
    productName: 'Production Annual',
    planName: 'Production Annual',
    description: 'Annual AI image credits',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: grokPricingPlans.production.yearly.priceInCents,
    currency: 'usd',
    credits: grokPricingPlans.production.yearly.credits,
    plan: {
      name: 'Production Annual',
      interval: PaymentInterval.YEAR,
      intervalCount: 1,
    },
  },
  starter_lifetime: {
    productId: 'starter_lifetime',
    productName: 'Essentials Credit Pack',
    planName: 'Essentials Credit Pack',
    description: 'One-time AI image credits',
    type: PaymentType.ONE_TIME,
    priceInCents: grokPricingPlans.essentials.oneTime.priceInCents,
    currency: 'usd',
    credits: grokPricingPlans.essentials.oneTime.credits,
  },
  pro_lifetime: {
    productId: 'pro_lifetime',
    productName: 'Studio Credit Pack',
    planName: 'Studio Credit Pack',
    description: 'One-time AI image credits',
    type: PaymentType.ONE_TIME,
    priceInCents: grokPricingPlans.studio.oneTime.priceInCents,
    currency: 'usd',
    credits: grokPricingPlans.studio.oneTime.credits,
  },
  enterprise_lifetime: {
    productId: 'enterprise_lifetime',
    productName: 'Production Credit Pack',
    planName: 'Production Credit Pack',
    description: 'One-time AI image credits',
    type: PaymentType.ONE_TIME,
    priceInCents: grokPricingPlans.production.oneTime.priceInCents,
    currency: 'usd',
    credits: grokPricingPlans.production.oneTime.credits,
  },
};

export function getPricingProduct(productId: string): PricingProduct | null {
  if (!productId) return null;
  return pricingCatalog[productId] ?? null;
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}
