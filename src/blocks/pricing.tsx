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
import { currentPathWithQuery } from '@/lib/redirect';
import { creditsForPriceInCents } from '@/lib/retail-pricing';
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
          price: '$29',
          interval: 'mo',
          features: essentialsFeatures(creditsForPriceInCents(2900)),
          productId: 'starter_monthly',
          priceInCents: 2900,
          currency: 'usd',
          credits: creditsForPriceInCents(2900),
          plan: { name: 'Essentials', interval: 'month', intervalCount: 1 },
        },
        {
          id: 'studio-monthly',
          name: m['landing.pricing.studio'](),
          description: m['landing.pricing.studio_desc'](),
          price: '$99',
          interval: 'mo',
          featured: true,
          badge: m['landing.pricing.popular'](),
          features: studioFeatures(creditsForPriceInCents(9900)),
          productId: 'pro_monthly',
          priceInCents: 9900,
          currency: 'usd',
          credits: creditsForPriceInCents(9900),
          plan: { name: 'Studio', interval: 'month', intervalCount: 1 },
        },
        {
          id: 'production-monthly',
          name: m['landing.pricing.production'](),
          description: m['landing.pricing.production_desc'](),
          price: '$299',
          interval: 'mo',
          features: productionFeatures(creditsForPriceInCents(29900)),
          productId: 'enterprise_monthly',
          priceInCents: 29900,
          currency: 'usd',
          credits: creditsForPriceInCents(29900),
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
          price: '$23.17',
          originalPrice: '$29/mo',
          interval: 'mo',
          billingNote: billedAnnually('$278'),
          checkoutPrice: '$278',
          features: essentialsFeatures(creditsForPriceInCents(27800)),
          productId: 'starter_yearly',
          priceInCents: 27800,
          currency: 'usd',
          credits: creditsForPriceInCents(27800),
          plan: { name: 'Essentials', interval: 'year', intervalCount: 1 },
        },
        {
          id: 'studio-yearly',
          name: m['landing.pricing.studio'](),
          description: m['landing.pricing.studio_desc'](),
          price: '$79.17',
          originalPrice: '$99/mo',
          interval: 'mo',
          billingNote: billedAnnually('$950'),
          checkoutPrice: '$950',
          featured: true,
          badge: m['landing.pricing.popular'](),
          features: studioFeatures(creditsForPriceInCents(95000)),
          productId: 'pro_yearly',
          priceInCents: 95000,
          currency: 'usd',
          credits: creditsForPriceInCents(95000),
          plan: { name: 'Studio', interval: 'year', intervalCount: 1 },
        },
        {
          id: 'production-yearly',
          name: m['landing.pricing.production'](),
          description: m['landing.pricing.production_desc'](),
          price: '$239.17',
          originalPrice: '$299/mo',
          interval: 'mo',
          billingNote: billedAnnually('$2,870'),
          checkoutPrice: '$2,870',
          features: productionFeatures(creditsForPriceInCents(287000)),
          productId: 'enterprise_yearly',
          priceInCents: 287000,
          currency: 'usd',
          credits: creditsForPriceInCents(287000),
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
          features: essentialsFeatures(creditsForPriceInCents(1000)),
          productId: 'starter_lifetime',
          priceInCents: 1000,
          currency: 'usd',
          credits: creditsForPriceInCents(1000),
          buttonText: m['landing.pricing.buy_credits'](),
        },
        {
          id: 'studio-one-time',
          name: m['landing.pricing.studio'](),
          description: m['landing.pricing.studio_desc'](),
          price: '$30',
          features: studioFeatures(creditsForPriceInCents(3000)),
          featured: true,
          badge: m['landing.pricing.best_value'](),
          productId: 'pro_lifetime',
          priceInCents: 3000,
          currency: 'usd',
          credits: creditsForPriceInCents(3000),
          buttonText: m['landing.pricing.buy_credits'](),
        },
        {
          id: 'production-one-time',
          name: m['landing.pricing.production'](),
          description: m['landing.pricing.production_desc'](),
          price: '$100',
          features: productionFeatures(creditsForPriceInCents(10000)),
          productId: 'enterprise_lifetime',
          priceInCents: 10000,
          currency: 'usd',
          credits: creditsForPriceInCents(10000),
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
