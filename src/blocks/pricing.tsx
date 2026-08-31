'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Check,
  Folder,
  Folders,
  Headphones,
  Mail,
  Puzzle,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import { apiPost } from '@/lib/api-client';
import { grokPricingPlans } from '@/lib/grok-pricing-plans';
import { currentPathWithQuery } from '@/lib/redirect';
import { m } from '@/paraglide/messages.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import {
  PaymentProviderModal,
  type PaymentProvider,
} from '@/components/payment-provider-modal';
import {
  PricingTable,
  type PricingGroup,
  type PricingPlan,
} from '@/components/pricing-table';

const ALL_PROVIDERS: PaymentProvider[] = [
  'stripe',
  'creem',
  'paypal',
  'alipay',
  'wechat',
];

type PricingPeriod = 'one-time' | 'monthly' | 'yearly';

export function Pricing({
  title,
  description,
  periods = ['one-time', 'monthly', 'yearly'],
}: {
  title?: string;
  description?: string;
  periods?: PricingPeriod[];
} = {}) {
  const router = useRouter();
  const { data: session } = useSession();

  const { data: configsData } = usePublicConfig();
  const configs = configsData ?? {};
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PricingPlan | null>(null);
  const [loadingProvider, setLoadingProvider] =
    useState<PaymentProvider | null>(null);

  const enabledProviders = useMemo<PaymentProvider[]>(
    () => ALL_PROVIDERS.filter((p) => configs[`${p}_enabled`] === 'true'),
    [configs]
  );

  const creditFeature = (credits: number) => ({
    icon: Sparkles,
    label: m['landing.pricing.feature_credits']({
      credits: credits.toLocaleString('en-US'),
    }),
  });
  const billedAnnually = (price: string) =>
    m['landing.pricing.billed_annually']({ price });
  const essentialsFeatures = (credits: number) => [
    { icon: Folder, label: m['landing.pricing.feature_1_project']() },
    creditFeature(credits),
    { icon: Mail, label: m['landing.pricing.feature_email_support']() },
  ];
  const studioFeatures = (credits: number) => [
    { icon: Folders, label: m['landing.pricing.feature_unlimited_projects']() },
    creditFeature(credits),
    { icon: Zap, label: m['landing.pricing.feature_priority_support']() },
    { icon: Terminal, label: m['landing.pricing.feature_api_access']() },
  ];
  const productionFeatures = (credits: number) => [
    {
      icon: Check,
      label: m['landing.pricing.feature_everything_studio'](),
    },
    creditFeature(credits),
    {
      icon: Headphones,
      label: m['landing.pricing.feature_dedicated_support'](),
    },
    { icon: Puzzle, label: m['landing.pricing.feature_custom_integrations']() },
  ];

  const groups: PricingGroup[] = [
    {
      key: 'monthly',
      label: m['landing.pricing.monthly'](),
      plans: [
        {
          id: 'essentials-monthly',
          name: m['landing.pricing.essentials'](),
          description: m['landing.pricing.essentials_desc'](),
          price: '$19',
          interval: 'mo',
          features: essentialsFeatures(
            grokPricingPlans.essentials.monthly.credits
          ),
          productId: 'starter_monthly',
          priceInCents: grokPricingPlans.essentials.monthly.priceInCents,
          currency: 'usd',
          credits: grokPricingPlans.essentials.monthly.credits,
          plan: { name: 'Essentials', interval: 'month', intervalCount: 1 },
        },
        {
          id: 'studio-monthly',
          name: m['landing.pricing.studio'](),
          description: m['landing.pricing.studio_desc'](),
          price: '$39',
          interval: 'mo',
          featured: true,
          badge: m['landing.pricing.popular'](),
          features: studioFeatures(grokPricingPlans.studio.monthly.credits),
          productId: 'pro_monthly',
          priceInCents: grokPricingPlans.studio.monthly.priceInCents,
          currency: 'usd',
          credits: grokPricingPlans.studio.monthly.credits,
          plan: { name: 'Studio', interval: 'month', intervalCount: 1 },
        },
        {
          id: 'production-monthly',
          name: m['landing.pricing.production'](),
          description: m['landing.pricing.production_desc'](),
          price: '$59',
          interval: 'mo',
          features: productionFeatures(
            grokPricingPlans.production.monthly.credits
          ),
          productId: 'enterprise_monthly',
          priceInCents: grokPricingPlans.production.monthly.priceInCents,
          currency: 'usd',
          credits: grokPricingPlans.production.monthly.credits,
          plan: { name: 'Production', interval: 'month', intervalCount: 1 },
        },
      ],
    },
    {
      key: 'yearly',
      label: m['landing.pricing.yearly'](),
      plans: [
        {
          id: 'essentials-yearly',
          name: m['landing.pricing.essentials'](),
          description: m['landing.pricing.essentials_desc'](),
          price: '$16',
          originalPrice: '$19/mo',
          interval: 'mo',
          billingNote: billedAnnually('$190'),
          checkoutPrice: '$190',
          features: essentialsFeatures(
            grokPricingPlans.essentials.yearly.credits
          ),
          productId: 'starter_yearly',
          priceInCents: grokPricingPlans.essentials.yearly.priceInCents,
          currency: 'usd',
          credits: grokPricingPlans.essentials.yearly.credits,
          plan: { name: 'Essentials', interval: 'year', intervalCount: 1 },
        },
        {
          id: 'studio-yearly',
          name: m['landing.pricing.studio'](),
          description: m['landing.pricing.studio_desc'](),
          price: '$33',
          originalPrice: '$39/mo',
          interval: 'mo',
          billingNote: billedAnnually('$390'),
          checkoutPrice: '$390',
          featured: true,
          badge: m['landing.pricing.popular'](),
          features: studioFeatures(grokPricingPlans.studio.yearly.credits),
          productId: 'pro_yearly',
          priceInCents: grokPricingPlans.studio.yearly.priceInCents,
          currency: 'usd',
          credits: grokPricingPlans.studio.yearly.credits,
          plan: { name: 'Studio', interval: 'year', intervalCount: 1 },
        },
        {
          id: 'production-yearly',
          name: m['landing.pricing.production'](),
          description: m['landing.pricing.production_desc'](),
          price: '$49',
          originalPrice: '$59/mo',
          interval: 'mo',
          billingNote: billedAnnually('$590'),
          checkoutPrice: '$590',
          features: productionFeatures(
            grokPricingPlans.production.yearly.credits
          ),
          productId: 'enterprise_yearly',
          priceInCents: grokPricingPlans.production.yearly.priceInCents,
          currency: 'usd',
          credits: grokPricingPlans.production.yearly.credits,
          plan: { name: 'Production', interval: 'year', intervalCount: 1 },
        },
      ],
    },
    {
      key: 'one-time',
      label: m['landing.pricing.one_time'](),
      plans: [
        {
          id: 'essentials-one-time',
          name: m['landing.pricing.essentials'](),
          description: m['landing.pricing.essentials_desc'](),
          price: '$10',
          features: essentialsFeatures(
            grokPricingPlans.essentials.oneTime.credits
          ),
          productId: 'starter_lifetime',
          priceInCents: grokPricingPlans.essentials.oneTime.priceInCents,
          currency: 'usd',
          credits: grokPricingPlans.essentials.oneTime.credits,
          buttonText: m['landing.pricing.buy_credits'](),
        },
        {
          id: 'studio-one-time',
          name: m['landing.pricing.studio'](),
          description: m['landing.pricing.studio_desc'](),
          price: '$30',
          features: studioFeatures(grokPricingPlans.studio.oneTime.credits),
          featured: true,
          badge: m['landing.pricing.best_value'](),
          productId: 'pro_lifetime',
          priceInCents: grokPricingPlans.studio.oneTime.priceInCents,
          currency: 'usd',
          credits: grokPricingPlans.studio.oneTime.credits,
          buttonText: m['landing.pricing.buy_credits'](),
        },
        {
          id: 'production-one-time',
          name: m['landing.pricing.production'](),
          description: m['landing.pricing.production_desc'](),
          price: '$59',
          features: productionFeatures(
            grokPricingPlans.production.oneTime.credits
          ),
          productId: 'enterprise_lifetime',
          priceInCents: grokPricingPlans.production.oneTime.priceInCents,
          currency: 'usd',
          credits: grokPricingPlans.production.oneTime.credits,
          buttonText: m['landing.pricing.buy_credits'](),
        },
      ],
    },
  ];
  const visibleGroups = (['one-time', 'monthly', 'yearly'] as const).flatMap(
    (period) =>
      periods.includes(period)
        ? groups.filter((group) => group.key === period)
        : []
  );

  const checkoutMutation = useMutation({
    mutationFn: ({
      plan,
      provider,
    }: {
      plan: PricingPlan;
      provider: PaymentProvider;
    }) =>
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
        payment_provider: provider,
        // Come back to the page the user paid from.
        redirect: currentPathWithQuery('/settings/billing'),
      }),
    onSuccess: (data) => {
      if (!data?.checkout_url) {
        toast.error('Checkout failed');
        setLoadingProvider(null);
        return;
      }
      window.location.href = data.checkout_url;
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Checkout failed');
      setLoadingProvider(null);
    },
  });

  function startCheckout(plan: PricingPlan, provider: PaymentProvider) {
    setLoadingProvider(provider);
    checkoutMutation.mutate({ plan, provider });
  }

  async function handleCheckout(plan: PricingPlan) {
    if (!session?.user) {
      const callbackUrl = encodeURIComponent(currentPathWithQuery('/pricing'));
      router.push(`/sign-in?callbackUrl=${callbackUrl}`);
      return;
    }

    const selectEnabled = configs.select_payment_enabled === 'true';
    const defaultProvider = (configs.default_payment_provider ||
      enabledProviders[0] ||
      'stripe') as PaymentProvider;

    if (selectEnabled && enabledProviders.length > 1) {
      setPendingPlan(plan);
      setModalOpen(true);
      return;
    }

    await startCheckout(plan, defaultProvider);
  }

  function handleProviderSelect(provider: PaymentProvider) {
    if (!pendingPlan) return;
    startCheckout(pendingPlan, provider);
  }

  return (
    <section
      id="pricing"
      className="border-border border-t px-4 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-20 text-center">
          <h2 className="font-serif text-4xl font-normal tracking-tight sm:text-5xl">
            {title ?? m['landing.pricing.title']()}
          </h2>
          <p className="text-muted-foreground mt-5">
            {description ?? m['landing.pricing.description']()}
          </p>
        </div>
        <PricingTable groups={visibleGroups} onCheckout={handleCheckout} />
      </div>

      <PaymentProviderModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setPendingPlan(null);
            setLoadingProvider(null);
          }
        }}
        providers={enabledProviders.length ? enabledProviders : ['stripe']}
        loadingProvider={loadingProvider}
        onSelect={handleProviderSelect}
        planName={pendingPlan?.name}
        price={pendingPlan?.checkoutPrice || pendingPlan?.price}
      />
    </section>
  );
}
