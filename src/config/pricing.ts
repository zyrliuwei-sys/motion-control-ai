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
import { creditsForPriceInCents } from '@/lib/retail-pricing';

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
 * Default demo catalog. Replace with your real products when launching.
 * Keys MUST match what the pricing UI sends as product_id.
 */
export const pricingCatalog: Record<string, PricingProduct> = {
  starter_monthly: {
    productId: 'starter_monthly',
    productName: 'Essentials',
    planName: 'Essentials',
    description: 'Essentials Monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 2900,
    currency: 'usd',
    credits: creditsForPriceInCents(2900),
    plan: {
      name: 'Essentials',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  pro_monthly: {
    productId: 'pro_monthly',
    productName: 'Studio',
    planName: 'Studio',
    description: 'Studio Monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 9900,
    currency: 'usd',
    credits: creditsForPriceInCents(9900),
    plan: { name: 'Studio', interval: PaymentInterval.MONTH, intervalCount: 1 },
  },
  enterprise_monthly: {
    productId: 'enterprise_monthly',
    productName: 'Production',
    planName: 'Production',
    description: 'Production Monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 29900,
    currency: 'usd',
    credits: creditsForPriceInCents(29900),
    plan: {
      name: 'Production',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  starter_yearly: {
    productId: 'starter_yearly',
    productName: 'Essentials',
    planName: 'Essentials',
    description: 'Essentials Yearly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 27800,
    currency: 'usd',
    credits: creditsForPriceInCents(27800),
    plan: {
      name: 'Essentials',
      interval: PaymentInterval.YEAR,
      intervalCount: 1,
    },
  },
  pro_yearly: {
    productId: 'pro_yearly',
    productName: 'Studio',
    planName: 'Studio',
    description: 'Studio Yearly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 95000,
    currency: 'usd',
    credits: creditsForPriceInCents(95000),
    plan: { name: 'Studio', interval: PaymentInterval.YEAR, intervalCount: 1 },
  },
  enterprise_yearly: {
    productId: 'enterprise_yearly',
    productName: 'Production',
    planName: 'Production',
    description: 'Production Yearly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 287000,
    currency: 'usd',
    credits: creditsForPriceInCents(287000),
    plan: {
      name: 'Production',
      interval: PaymentInterval.YEAR,
      intervalCount: 1,
    },
  },
  starter_lifetime: {
    productId: 'starter_lifetime',
    productName: 'Essentials Credit Pack',
    planName: 'Essentials Credit Pack',
    description: 'Essentials One-time Credit Pack',
    type: PaymentType.ONE_TIME,
    priceInCents: 1000,
    currency: 'usd',
    credits: creditsForPriceInCents(1000),
  },
  pro_lifetime: {
    productId: 'pro_lifetime',
    productName: 'Studio Credit Pack',
    planName: 'Studio Credit Pack',
    description: 'Studio One-time Credit Pack',
    type: PaymentType.ONE_TIME,
    priceInCents: 3000,
    currency: 'usd',
    credits: creditsForPriceInCents(3000),
  },
  enterprise_lifetime: {
    productId: 'enterprise_lifetime',
    productName: 'Production Credit Pack',
    planName: 'Production Credit Pack',
    description: 'Production One-time Credit Pack',
    type: PaymentType.ONE_TIME,
    priceInCents: 10000,
    currency: 'usd',
    credits: creditsForPriceInCents(10000),
  },
};

export function getPricingProduct(productId: string): PricingProduct | null {
  if (!productId) return null;
  return pricingCatalog[productId] ?? null;
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}
