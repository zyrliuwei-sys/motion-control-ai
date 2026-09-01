import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ProactivPriceTier } from '@/types/proactiv';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { apiPost } from '@/lib/api-client';
import { currentPathWithQuery } from '@/lib/redirect';
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
  processingCtaLabel?: string;
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
  processingCtaLabel = 'Opening checkout…',
  annualBillingLabel = (price) => `Billed ${price} annually`,
  customPriceLabel = 'Custom',
  currencySymbol = '$',
  ctaHref = '#book-demo',
  getCtaHref,
  className,
}: ProactivPricingProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [billingPeriod, setBillingPeriod] = useState<
    'one-time' | 'monthly' | 'yearly'
  >('monthly');
  const billingPeriods = [
    { value: 'one-time' as const, label: oneTimeLabel },
    { value: 'monthly' as const, label: monthlyLabel },
    { value: 'yearly' as const, label: yearlyLabel },
  ];
  const checkoutMutation = useMutation({
    mutationFn: (productId: string) =>
      apiPost<{ checkout_url?: string }>('/api/payment/checkout', {
        product_id: productId,
        redirect: currentPathWithQuery('/settings/billing'),
      }),
    onSuccess: (data) => {
      if (!data.checkout_url) {
        toast.error('Checkout failed');
        return;
      }
      window.location.href = data.checkout_url;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const startCheckout = (productId: string) => {
    if (!session?.user) {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(currentPathWithQuery('/pricing'))}`
      );
      return;
    }
    checkoutMutation.mutate(productId);
  };

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
          <h2 className="text-4xl leading-tight font-semibold tracking-[-0.04em] md:text-5xl">
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
                    'min-h-9 rounded-lg px-3.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#18181b] sm:px-4',
                    isActive
                      ? 'bg-[#18181b] text-white'
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
              billingPeriod === 'one-time'
                ? tier.oneTimeCredits
                : billingPeriod === 'yearly'
                  ? tier.yearlyCredits
                  : tier.monthlyCredits;
            const productId =
              billingPeriod === 'one-time'
                ? tier.oneTimeProductId
                : billingPeriod === 'yearly'
                  ? tier.yearlyProductId
                  : tier.monthlyProductId;
            const href = getCtaHref?.(tier, index) ?? ctaHref;

            return (
              <article
                key={`${tier.title}-${index}`}
                className={cn(
                  'relative flex min-h-[420px] flex-col overflow-hidden rounded-lg px-6 py-5',
                  tier.featured
                    ? 'bg-zinc-50 ring-1 ring-zinc-200'
                    : 'bg-white ring-1 ring-zinc-200'
                )}
              >
                {tier.featured && (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-px bg-zinc-200"
                    />
                    <span
                      aria-hidden="true"
                      className="proactiv-meteor proactiv-price-meteor pointer-events-none absolute top-0 left-0 h-px w-[30%] bg-gradient-to-r from-transparent via-[#18181b] to-transparent shadow-[0_0_12px_rgba(24,24,27,0.28)]"
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
                    <p className="mt-4 text-xs font-medium text-[#627181]">
                      <span className="tabular-nums">
                        {creditsAfterPaymentLabel}{' '}
                        {credits.toLocaleString('en-US')}
                      </span>
                    </p>
                  )}
                </div>

                {productId ? (
                  <button
                    type="button"
                    disabled={checkoutMutation.isPending}
                    onClick={() => startCheckout(productId)}
                    className={cn(
                      'relative mt-7 inline-flex min-h-10 items-center justify-center rounded-[6px] px-4 py-2 text-sm font-medium transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
                      tier.featured
                        ? 'bg-[#18181b] text-white focus-visible:outline-[#18181b]'
                        : 'bg-zinc-100 text-[#18181b] hover:bg-zinc-200 focus-visible:outline-[#18181b]'
                    )}
                  >
                    {checkoutMutation.isPending
                      ? processingCtaLabel
                      : billingPeriod === 'one-time'
                        ? oneTimeCtaLabel
                        : tier.cta}
                  </button>
                ) : (
                  <Link
                    href={href}
                    className={cn(
                      'relative mt-7 inline-flex min-h-10 items-center justify-center rounded-[6px] px-4 py-2 text-sm font-medium transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 active:scale-[0.98]',
                      tier.featured
                        ? 'bg-[#18181b] text-white focus-visible:outline-[#18181b]'
                        : 'bg-zinc-100 text-[#18181b] hover:bg-zinc-200 focus-visible:outline-[#18181b]'
                    )}
                  >
                    {tier.cta}
                  </Link>
                )}

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
                        className="mt-0.5 size-4 shrink-0 text-[#18181b]"
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
