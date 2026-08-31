import { useState, type ComponentType, type SVGProps } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CircleCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import { apiPost } from '@/lib/api-client';
import { currentPathWithQuery } from '@/lib/redirect';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type PricingFeature =
  | string
  | { icon?: IconComponent; label: string; tooltip?: string };

export interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  price: string;
  checkoutPrice?: string;
  billingNote?: string;
  originalPrice?: string;
  currency?: string;
  interval?: string;
  featured?: boolean;
  badge?: string;
  features: PricingFeature[];
  buttonText?: string;
  productId?: string;
  productName?: string;
  paymentProvider?: string;
  priceInCents?: number;
  credits?: number;
  creditsValidDays?: number;
  plan?: {
    name: string;
    interval: string;
    intervalCount: number;
  };
}

export interface PricingGroup {
  key: string;
  label: string;
  plans: PricingPlan[];
}

export function PricingTable({
  groups,
  onCheckout,
}: {
  groups: PricingGroup[];
  onCheckout?: (plan: PricingPlan) => void;
}) {
  const [activeGroup, setActiveGroup] = useState(groups[0]?.key || '');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const currentGroup = groups.find((g) => g.key === activeGroup) || groups[0];

  const checkoutMutation = useMutation({
    mutationFn: (plan: PricingPlan) =>
      apiPost<{ checkout_url?: string }>('/api/payment/checkout', {
        product_id: plan.productId,
        product_name: plan.productName || plan.name,
        plan_name: plan.plan?.name || plan.name,
        price: plan.priceInCents,
        currency: plan.currency || 'usd',
        type: plan.plan ? 'subscription' : 'one-time',
        description: plan.name,
        plan: plan.plan,
        credits: plan.credits,
        credits_valid_days: plan.creditsValidDays,
        payment_provider: plan.paymentProvider || 'stripe',
        // Come back to the page the user paid from.
        redirect: currentPathWithQuery('/settings/billing'),
      }),
    onSuccess: (data) => {
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
    onSettled: () => {
      setLoadingId(null);
    },
  });

  function handleCheckout(plan: PricingPlan) {
    if (onCheckout) {
      onCheckout(plan);
      return;
    }

    if (!plan.productId || !plan.priceInCents) return;

    setLoadingId(plan.id);
    checkoutMutation.mutate(plan);
  }

  return (
    <section
      aria-labelledby="subscription-plans-heading"
      className="space-y-10"
    >
      <h3 id="subscription-plans-heading" className="sr-only">
        {m['settings.billing.subscription']()}
      </h3>

      {groups.length > 1 && (
        <div className="flex justify-center">
          <div
            aria-label={m['settings.billing.interval']()}
            className="border-border bg-muted/50 inline-flex min-h-12 items-center rounded-xl border p-1"
            role="tablist"
          >
            {groups.map((group) => (
              <button
                aria-controls={`pricing-panel-${group.key}`}
                aria-selected={activeGroup === group.key}
                id={`pricing-tab-${group.key}`}
                key={group.key}
                onClick={() => setActiveGroup(group.key)}
                role="tab"
                type="button"
                className={cn(
                  'relative min-h-10 min-w-24 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                  activeGroup === group.key
                    ? 'text-background'
                    : 'text-muted-foreground hover:text-foreground focus-visible:text-foreground'
                )}
              >
                {activeGroup === group.key && (
                  <motion.span
                    aria-hidden="true"
                    className="bg-foreground absolute inset-0 rounded-lg"
                    layoutId="pricing-period-indicator"
                    transition={
                      reduceMotion
                        ? { duration: 0.15 }
                        : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
                    }
                  />
                )}
                <span className="relative z-10">{group.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        aria-labelledby={`pricing-tab-${activeGroup}`}
        id={`pricing-panel-${activeGroup}`}
        role="tabpanel"
        className={cn(
          'mx-auto grid items-stretch gap-4 sm:gap-5',
          currentGroup?.plans.length === 2
            ? 'max-w-3xl sm:grid-cols-2'
            : currentGroup?.plans.length === 3
              ? 'max-w-5xl sm:grid-cols-2 lg:grid-cols-3'
              : 'max-w-6xl sm:grid-cols-2 lg:grid-cols-4'
        )}
      >
        {currentGroup?.plans.map((plan, index) => {
          const panelTransition = reduceMotion
            ? { duration: 0.15 }
            : { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const };

          return (
            <motion.article
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'border-border relative flex min-w-0 flex-col rounded-2xl border p-6 transition-[transform,border-color,background-color] duration-200 ease-out sm:p-8',
                plan.featured
                  ? 'from-primary/15 to-card ring-primary/20 bg-gradient-to-b ring-1'
                  : 'bg-card hover:border-foreground/35 hover:bg-secondary/80'
              )}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              key={`${activeGroup}-${plan.id}`}
              transition={{
                ...panelTransition,
                delay: reduceMotion ? 0 : index * 0.05,
              }}
            >
              <div className="flex min-h-7 items-center justify-between gap-3">
                {plan.name && (
                  <p className="text-foreground text-base leading-7 font-semibold">
                    {plan.name}
                  </p>
                )}
                {plan.badge && (
                  <span className="bg-primary/15 text-primary rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}
              </div>

              <div className="mt-6 min-h-[104px]">
                <div className="flex items-end gap-1.5">
                  <motion.span
                    aria-live="polite"
                    animate={{ opacity: 1, y: 0 }}
                    className="font-serif text-5xl font-semibold tracking-tight tabular-nums"
                    initial={
                      reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }
                    }
                    key={`${activeGroup}-${plan.id}-price`}
                    transition={panelTransition}
                  >
                    {plan.price}
                  </motion.span>
                  {plan.interval && (
                    <span className="text-muted-foreground mb-1 text-sm font-medium">
                      /{plan.interval}
                    </span>
                  )}
                </div>
                {plan.originalPrice && (
                  <span className="text-muted-foreground mt-1 block text-sm tabular-nums line-through">
                    {plan.originalPrice}
                  </span>
                )}
                {plan.billingNote && (
                  <p className="text-muted-foreground mt-2 text-xs font-medium">
                    {plan.billingNote}
                  </p>
                )}
                {typeof plan.credits === 'number' && (
                  <p className="text-foreground mt-4 text-sm font-medium">
                    <span className="tabular-nums">
                      {m['landing.pricing.credits_after_payment']({
                        credits: plan.credits.toLocaleString('en-US'),
                      })}
                    </span>
                  </p>
                )}
              </div>

              <p className="text-muted-foreground mt-3 min-h-10 text-sm leading-5">
                {plan.description}
              </p>

              <Button
                className={cn(
                  'mt-7 h-11 w-full rounded-full text-sm font-semibold whitespace-nowrap !transition-[transform,background-color,border-color] duration-150 ease-out active:translate-y-px',
                  plan.featured && 'hover:bg-primary/90'
                )}
                disabled={loadingId === plan.id}
                onClick={() => handleCheckout(plan)}
                type="button"
                variant={plan.featured ? 'default' : 'outline'}
              >
                {loadingId === plan.id
                  ? m['common.pricing.processing']()
                  : plan.buttonText || m['common.pricing.get_started']()}
              </Button>

              <ul className="mt-8 space-y-3 pt-6">
                {plan.features.map((feature, featureIndex) => {
                  const label =
                    typeof feature === 'string' ? feature : feature.label;

                  return (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-x-3 text-sm leading-6"
                    >
                      <CircleCheck
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 size-4 shrink-0',
                          plan.featured
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        )}
                      />
                      <span className="text-foreground/90">{label}</span>
                    </li>
                  );
                })}
              </ul>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
