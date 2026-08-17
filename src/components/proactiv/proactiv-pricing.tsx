import { useState } from 'react';
import type { ProactivPriceTier } from '@/types/proactiv';
import { Check, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';

export interface ProactivLogo {
  src: string;
  alt: string;
}

export interface ProactivPricingProps {
  tiers: readonly ProactivPriceTier[];
  title?: string;
  description?: string;
  monthlyLabel?: string;
  yearlyLabel?: string;
  monthlyPriceLabel?: string;
  yearlyPriceLabel?: string;
  customPriceLabel?: string;
  currencySymbol?: string;
  ctaHref?: string;
  getCtaHref?: (tier: ProactivPriceTier, index: number) => string;
  logosHeading?: string;
  logos?: readonly ProactivLogo[];
  className?: string;
}

const defaultLogos: readonly ProactivLogo[] = [
  { src: '/proactiv/logos/netflix.png', alt: 'Netflix' },
  { src: '/proactiv/logos/google.webp', alt: 'Google' },
  { src: '/proactiv/logos/meta.png', alt: 'Meta' },
  { src: '/proactiv/logos/onlyfans.png', alt: 'OnlyFans' },
];

/**
 * A controlled-by-props pricing section. Only the monthly/yearly billing
 * selection is local state; tier copy and calls-to-action remain page data.
 */
export function ProactivPricing({
  tiers,
  title = 'Simple pricing',
  description = 'Simple pricing for startups, small businesses, medium scale businesses and enterprises.',
  monthlyLabel = 'Monthly',
  yearlyLabel = 'Yearly',
  monthlyPriceLabel = '/ month',
  yearlyPriceLabel = '/ month',
  customPriceLabel = 'Custom',
  currencySymbol = '$',
  ctaHref = '#book-demo',
  getCtaHref,
  logosHeading = 'Trusted by teams around the world',
  logos = defaultLogos,
  className,
}: ProactivPricingProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    'monthly'
  );
  const isYearly = billingPeriod === 'yearly';
  const repeatedLogos = [...logos, ...logos];

  return (
    <section
      id="pricing"
      className={cn('relative overflow-hidden text-white', className)}
    >
      <style>{`
        @keyframes proactiv-price-meteor {
          0% { transform: translateX(-120%); opacity: 0; }
          15% { opacity: .95; }
          78% { opacity: .75; }
          100% { transform: translateX(760%); opacity: 0; }
        }
        @keyframes proactiv-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .proactiv-meteor.proactiv-price-meteor {
          animation: proactiv-price-meteor 3.8s ease-in-out infinite;
        }
        .proactiv-marquee { animation: proactiv-marquee 22s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .proactiv-meteor.proactiv-price-meteor,
          .proactiv-marquee { animation: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-[1280px] px-4 pt-20 sm:px-6">
        <div className="mx-auto flex max-w-[768px] flex-col items-center text-center">
          <div
            aria-hidden="true"
            className="grid size-14 place-items-center rounded-2xl bg-[#39c3ef] text-black shadow-[0_0_34px_rgba(57,195,239,0.2)]"
          >
            <Sparkles className="size-6" strokeWidth={1.8} />
          </div>
          <h2 className="mt-5 text-4xl leading-tight font-semibold tracking-[-0.04em] md:text-5xl">
            {title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#a3a3a3]">
            {description}
          </p>

          <div className="mt-7 flex items-center gap-3 text-sm text-[#a3a3a3]">
            <span className={cn(!isYearly && 'text-white')}>
              {monthlyLabel}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isYearly}
              aria-label={`Switch to ${isYearly ? monthlyLabel : yearlyLabel} pricing`}
              onClick={() => setBillingPeriod(isYearly ? 'monthly' : 'yearly')}
              className="relative h-5 w-10 rounded-full border border-[#737373] bg-[#171717] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#39c3ef]"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all delay-100 duration-300 ease-out',
                  isYearly ? 'w-4 translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
            <span className={cn(isYearly && 'text-white')}>{yearlyLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 py-20 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {tiers.map((tier, index) => {
            const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
            const priceLabel = isYearly ? yearlyPriceLabel : monthlyPriceLabel;
            const href = getCtaHref?.(tier, index) ?? ctaHref;

            return (
              <article
                key={`${tier.title}-${index}`}
                className={cn(
                  'relative flex min-h-[390px] flex-col overflow-hidden rounded-lg px-6 py-4',
                  tier.featured
                    ? 'bg-[radial-gradient(circle_at_50%_0%,#262626_0%,#171717_48%,#0d0d0d_100%)] ring-1 ring-white/10'
                    : 'bg-transparent ring-1 ring-white/10'
                )}
              >
                {tier.featured && (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-px bg-white/10"
                    />
                    <span
                      aria-hidden="true"
                      className="proactiv-meteor proactiv-price-meteor pointer-events-none absolute top-0 left-0 h-px w-[30%] bg-gradient-to-r from-transparent via-[#39c3ef] to-transparent shadow-[0_0_12px_rgba(57,195,239,0.95)]"
                    />
                  </>
                )}
                <div className="relative">
                  <h3 className="text-xl font-semibold tracking-[-0.02em]">
                    {tier.title}
                  </h3>
                  <p className="mt-2 min-h-10 text-sm leading-relaxed text-[#a3a3a3]">
                    {tier.description}
                  </p>
                  <div className="mt-7 flex items-end gap-1">
                    <span className="text-4xl leading-none font-semibold tracking-[-0.04em]">
                      {price === null
                        ? customPriceLabel
                        : `${currencySymbol}${price}`}
                    </span>
                    {price !== null && (
                      <span className="pb-0.5 text-xs text-[#a3a3a3]">
                        {priceLabel}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={href}
                  className={cn(
                    'relative mt-7 inline-flex min-h-10 items-center justify-center rounded-[6px] px-4 py-2 text-sm font-medium transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 active:scale-[0.98]',
                    tier.featured
                      ? 'bg-[#39c3ef] text-black focus-visible:outline-[#39c3ef]'
                      : 'bg-[#262626] text-white hover:bg-[#303030] focus-visible:outline-white'
                  )}
                >
                  {tier.cta}
                </Link>

                <ul
                  className="relative mt-7 space-y-3"
                  aria-label={`${tier.title} features`}
                >
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2 text-sm text-[#a3a3a3]"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-[#39c3ef]"
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

      <div className="relative mx-auto flex h-40 max-w-[1280px] flex-col justify-center overflow-hidden px-4 sm:px-6">
        <p className="mb-5 text-center text-sm text-[#a3a3a3]">
          {logosHeading}
        </p>
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          }}
        >
          <div className="proactiv-marquee flex w-max items-center">
            {repeatedLogos.map((logo, index) => (
              <div
                key={`${logo.src}-${index}`}
                className="grid h-10 w-[100px] shrink-0 place-items-center px-3"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-7 max-w-full object-contain opacity-65 grayscale transition-[filter,opacity] duration-300 hover:opacity-100 hover:grayscale-0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
