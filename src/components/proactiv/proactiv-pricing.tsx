import { useState } from 'react';
import type { ProactivPriceTier } from '@/types/proactiv';
import { Check, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { creditsForPriceInCents } from '@/lib/retail-pricing';
import { cn } from '@/lib/utils';

export interface ProactivPricingProps {
  tiers: readonly ProactivPriceTier[];
  title?: string;
  description?: string;
  monthlyLabel?: string;
  yearlyLabel?: string;
  oneTimeLabel?: string;
  monthlyPriceLabel?: string;
  yearlyPriceLabel?: string;
  oneTimePriceLabel?: string;
  oneTimeCtaLabel?: string;
  creditsAfterPaymentLabel?: string;
  annualBillingLabel?: (price: string) => string;
  customPriceLabel?: string;
  currencySymbol?: string;
  ctaHref?: string;
  getCtaHref?: (tier: ProactivPriceTier, index: number) => string;
  className?: string;
}

/**
 * A controlled-by-props pricing section. Only the billing-period selection
 * selection is local state; tier copy and calls-to-action remain page data.
 */
export function ProactivPricing({
  tiers,
  title = 'Simple pricing',
  description = 'Simple pricing for startups, small businesses, medium scale businesses and enterprises.',
  monthlyLabel = 'Monthly',
  yearlyLabel = 'Yearly',
  oneTimeLabel = 'One-time',
  monthlyPriceLabel = '/ month',
  yearlyPriceLabel = '/ year',
  oneTimePriceLabel = 'one time',
  oneTimeCtaLabel = 'Buy credits',
  creditsAfterPaymentLabel = 'Credits after payment:',
  annualBillingLabel = (price) => `Billed ${price} annually`,
  customPriceLabel = 'Custom',
  currencySymbol = '$',
  ctaHref = '#book-demo',
  getCtaHref,
  className,
}: ProactivPricingProps) {
  const [billingPeriod, setBillingPeriod] = useState<
    'one-time' | 'monthly' | 'yearly'
  >('monthly');
  const billingPeriods = [
    { value: 'one-time' as const, label: oneTimeLabel },
    { value: 'monthly' as const, label: monthlyLabel },
    { value: 'yearly' as const, label: yearlyLabel },
  ];

  return (
    <section
      id="pricing"
      className={cn(
        'relative scroll-mt-24 overflow-hidden text-[#15202b]',
        className
      )}
    >
      <style>{`
        @keyframes proactiv-price-meteor {
          0% { transform: translateX(-120%); opacity: 0; }
          15% { opacity: .95; }
          78% { opacity: .75; }
          100% { transform: translateX(760%); opacity: 0; }
        }
        .proactiv-meteor.proactiv-price-meteor {
          animation: proactiv-price-meteor 3.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .proactiv-meteor.proactiv-price-meteor { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-[1280px] px-4 pt-20 sm:px-6">
        <div className="mx-auto flex max-w-[768px] flex-col items-center text-center">
          <div
            aria-hidden="true"
            className="grid size-14 place-items-center rounded-2xl bg-[#c92f68] text-white shadow-[0_12px_28px_rgba(201,47,104,0.2)]"
          >
            <Sparkles className="size-6" strokeWidth={1.8} />
          </div>
          <h2 className="mt-5 text-4xl leading-tight font-semibold tracking-[-0.04em] md:text-5xl">
            {title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#627181]">
            {description}
          </p>

          <div
            aria-label="Billing period"
            className="mt-7 inline-flex rounded-xl border border-[#d6e0e7] bg-white p-1 text-sm shadow-sm"
            role="tablist"
          >
            {billingPeriods.map((period) => {
              const isActive = billingPeriod === period.value;

              return (
                <button
                  aria-selected={isActive}
                  className={cn(
                    'min-h-9 rounded-lg px-3.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#c92f68] sm:px-4',
                    isActive
                      ? 'bg-[#c92f68] text-white'
                      : 'text-[#627181] hover:text-[#15202b]'
                  )}
                  key={period.value}
                  onClick={() => setBillingPeriod(period.value)}
                  role="tab"
                  type="button"
                >
                  {period.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-5 py-20 md:grid-cols-3">
          {tiers.map((tier, index) => {
            const price =
              billingPeriod === 'one-time'
                ? tier.oneTimePrice
                : billingPeriod === 'yearly'
                  ? tier.yearlyPrice
                  : tier.monthlyPrice;
            const priceLabel =
              billingPeriod === 'one-time'
                ? oneTimePriceLabel
                : billingPeriod === 'yearly'
                  ? monthlyPriceLabel
                  : monthlyPriceLabel;
            const displayPrice =
              billingPeriod === 'yearly' && price !== null
                ? Math.round(price / 12)
                : price;
            const credits =
              price === null ? null : creditsForPriceInCents(price * 100);
            const href = getCtaHref?.(tier, index) ?? ctaHref;

            return (
              <article
                key={`${tier.title}-${index}`}
                className={cn(
                  'relative flex min-h-[420px] flex-col overflow-hidden rounded-lg px-6 py-5',
                  tier.featured
                    ? 'bg-[#fff4f7] ring-1 ring-[#efb0c4]'
                    : 'bg-white ring-1 ring-[#d6e0e7]'
                )}
              >
                {tier.featured && (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-px bg-[#efb0c4]"
                    />
                    <span
                      aria-hidden="true"
                      className="proactiv-meteor proactiv-price-meteor pointer-events-none absolute top-0 left-0 h-px w-[30%] bg-gradient-to-r from-transparent via-[#ff8a5b] to-transparent shadow-[0_0_12px_rgba(255,138,91,0.75)]"
                    />
                  </>
                )}
                <div className="relative">
                  <h3 className="text-xl font-semibold tracking-[-0.02em]">
                    {tier.title}
                  </h3>
                  <p className="mt-2 min-h-10 text-sm leading-relaxed text-[#627181]">
                    {tier.description}
                  </p>
                  <div className="mt-7 flex items-end gap-1">
                    <span className="text-4xl leading-none font-semibold tracking-[-0.04em]">
                      {displayPrice === null
                        ? customPriceLabel
                        : `${currencySymbol}${displayPrice}`}
                    </span>
                    {displayPrice !== null && (
                      <span className="pb-0.5 text-xs text-[#627181]">
                        {priceLabel}
                      </span>
                    )}
                  </div>
                  {billingPeriod === 'yearly' && price !== null && (
                    <p className="mt-2 text-xs font-medium text-[#627181]">
                      {annualBillingLabel(
                        `${currencySymbol}${price.toLocaleString('en-US')}`
                      )}
                    </p>
                  )}
                  {credits !== null && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#c92f68]/25 bg-[#fff0f5] px-3 py-1.5 text-xs font-medium text-[#8f2348]">
                      <Sparkles
                        aria-hidden="true"
                        className="size-3.5 text-[#c92f68]"
                      />
                      <span className="tabular-nums">
                        {creditsAfterPaymentLabel}{' '}
                        {credits.toLocaleString('en-US')}
                      </span>
                    </div>
                  )}
                </div>

                <Link
                  href={href}
                  className={cn(
                    'relative mt-7 inline-flex min-h-10 items-center justify-center rounded-[6px] px-4 py-2 text-sm font-medium transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 active:scale-[0.98]',
                    tier.featured
                      ? 'bg-[#c92f68] text-white focus-visible:outline-[#c92f68]'
                      : 'bg-[#f6e9ee] text-[#15202b] hover:bg-[#efdae2] focus-visible:outline-[#c92f68]'
                  )}
                >
                  {billingPeriod === 'one-time' ? oneTimeCtaLabel : tier.cta}
                </Link>

                <ul
                  className="relative mt-7 space-y-3"
                  aria-label={`${tier.title} features`}
                >
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2 text-sm text-[#627181]"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-[#ff8a5b]"
                        strokeWidth={2.1}
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
