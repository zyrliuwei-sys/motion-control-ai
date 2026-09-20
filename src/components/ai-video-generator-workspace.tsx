import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  Download,
  Expand,
  ExternalLink,
  Film,
  History,
  ImagePlus,
  LoaderCircle,
  Play,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
import { apiGet, apiPost, apiUpload } from '@/lib/api-client';
import {
  EVOLINK_VIDEO_DURATION_LIMITS,
  evolinkVideoCreditsForSeconds,
  type EvolinkVideoMode,
  type EvolinkVideoModelFamily,
  type EvolinkVideoQuality,
} from '@/lib/evolink-video-pricing';
import { grokPricingPlans } from '@/lib/grok-pricing-plans';
import { cn } from '@/lib/utils';
import { usePublicConfig } from '@/hooks/use-public-config';
import { AiVideoGeneratorSeoContent } from '@/components/ai-video-generator-seo-content';
import {
  PaymentProviderModal,
  type PaymentProvider,
} from '@/components/payment-provider-modal';

export interface AiVideoModelCard {
  apiModel: EvolinkVideoModelFamily;
  description: string;
  imageSrc: string;
  name: string;
  videoSrc: string;
}

export interface AiVideoFeature {
  description: string;
  imageSrc: string;
  title: string;
  videoSrc: string;
}

export interface AiVideoStep {
  description: string;
  imageSrc: string;
  title: string;
  videoSrc: string;
}

export interface AiVideoBenefit {
  description: string;
  title: string;
}

export interface AiVideoGeneratorCopy {
  benefitsTitle: string;
  checkoutFailedMessage: string;
  credits: string;
  creditsUnit: string;
  creditPaywallDescription: string;
  creditPaywallTitle: string;
  eyebrow: string;
  expandInput: string;
  generate: string;
  history: string;
  historyDownload: string;
  historyEmpty: string;
  historyOpen: string;
  historyTitle: string;
  mode: string;
  modeImage: string;
  modeReference: string;
  modeText: string;
  model: string;
  optional: string;
  output: string;
  pageDescription: string;
  pageTitle: string;
  promptLabel: string;
  promptPlaceholder: string;
  removeUpload: string;
  settings: string;
  stepsTitle: string;
  uploadImage: string;
  readyLabel: string;
  queuedLabel: string;
  monthlyPlanOptions: readonly {
    productId: string;
    price: number;
    planName: string;
    creditsLabel: string;
    billingLabel?: string;
  }[];
}

interface AiVideoGeneratorWorkspaceProps {
  benefits: AiVideoBenefit[];
  copy: AiVideoGeneratorCopy;
  features: AiVideoFeature[];
  models: AiVideoModelCard[];
  steps: AiVideoStep[];
}

interface EvolinkVideoTask {
  id: string;
  model: string;
  status: string;
  progress: number;
  resultUrls: string[];
  errorMessage?: string;
  createdAt: string;
}

interface EvolinkVideoHistoryItem {
  createdAt: string;
  downloadUrl: string;
  id: string;
  index: number;
  resultUrl: string;
  task: EvolinkVideoTask;
}

const paymentProviders: PaymentProvider[] = [
  'stripe',
  'creem',
  'paypal',
  'alipay',
  'wechat',
];

function parseOutput(value: string) {
  const match = value.match(/^(\S+)\s*\/\s*(\d+)s\s*\/\s*(\S+)$/);
  return {
    aspectRatio: match?.[1] ?? '16:9',
    duration: Number(match?.[2]) || 5,
    quality: (match?.[3] ?? '480p') as EvolinkVideoQuality,
  };
}

function isTerminalStatus(status?: string) {
  return status === 'success' || status === 'failed' || status === 'canceled';
}

function outputLabel(params: {
  aspectRatio: string;
  duration: number;
  quality: string;
}) {
  return `${params.aspectRatio} / ${params.duration}s / ${params.quality}`;
}

function qualityForModel(
  model: EvolinkVideoModelFamily,
  quality: EvolinkVideoQuality
): EvolinkVideoQuality {
  if (model === 'minimax-h3-max') {
    return quality === '480p' ? '480p' : '768p';
  }
  return quality === '768p' ? '720p' : quality;
}

export function AiVideoGeneratorWorkspace({
  benefits,
  copy,
  features,
  models,
  steps,
}: AiVideoGeneratorWorkspaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const { data: publicConfigs } = usePublicConfig();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [mode, setMode] = useState(copy.modeText);
  const [model, setModel] = useState(models[0]?.name ?? copy.model);
  const [output, setOutput] = useState(copy.output);
  const [openMenu, setOpenMenu] = useState<'mode' | 'model' | 'output' | null>(
    null
  );
  const [isCreditPaywallOpen, setIsCreditPaywallOpen] = useState(false);
  const [selectedMonthlyPlanProductId, setSelectedMonthlyPlanProductId] =
    useState(() => copy.monthlyPlanOptions[0]?.productId ?? 'starter_monthly');
  const [loadingPaymentProvider, setLoadingPaymentProvider] =
    useState<PaymentProvider | null>(null);
  const [generationState, setGenerationState] = useState<
    'idle' | 'queued' | 'ready'
  >('idle');
  const [videoTask, setVideoTask] = useState<EvolinkVideoTask | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const activeModel = models.find((item) => item.name === model) ?? models[0];
  const parsedOutput = useMemo(() => parseOutput(output), [output]);
  const activeModelFamily = activeModel?.apiModel ?? 'seedance-2.5';
  const durationLimits = EVOLINK_VIDEO_DURATION_LIMITS[activeModelFamily];
  const currentCredits = evolinkVideoCreditsForSeconds({
    model: activeModelFamily,
    quality: qualityForModel(activeModelFamily, parsedOutput.quality),
    durationSeconds: Math.min(
      durationLimits.max,
      Math.max(durationLimits.min, parsedOutput.duration)
    ),
  });

  const enabledPaymentProviders = useMemo(
    () =>
      paymentProviders.filter(
        (provider) => publicConfigs?.[`${provider}_enabled`] === 'true'
      ),
    [publicConfigs]
  );

  const creditsQuery = useQuery({
    queryKey: ['user-credits', 'balance'],
    queryFn: () =>
      apiGet<{ balance: number; hasPaidCredits: boolean }>('/api/credits'),
    enabled: Boolean(session?.user),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawDraft = window.sessionStorage.getItem(
      'ai-video-generator-payment-draft'
    );
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft) as {
        mode?: string;
        model?: string;
        output?: string;
        prompt?: string;
      };
      if (typeof draft.prompt === 'string') setPrompt(draft.prompt);
      if (typeof draft.mode === 'string') setMode(draft.mode);
      if (typeof draft.model === 'string') {
        setModel(draft.model);
      }
      if (typeof draft.output === 'string') setOutput(draft.output);
    } catch {
      // Ignore an invalid stale draft.
    } finally {
      window.sessionStorage.removeItem('ai-video-generator-payment-draft');
    }
  }, []);

  const historyQuery = useQuery({
    queryKey: ['evolink-video-generation', 'history'],
    queryFn: () => apiGet<EvolinkVideoTask[]>('/api/evolink/video-generation'),
    enabled: Boolean(session?.user),
    staleTime: 15_000,
  });

  const historyVideos = useMemo<EvolinkVideoHistoryItem[]>(
    () =>
      (historyQuery.data ?? [])
        .filter((task) => task.status === 'success' && task.resultUrls.length)
        .flatMap((task) =>
          task.resultUrls.map((resultUrl, index) => ({
            createdAt: task.createdAt,
            downloadUrl: `/api/evolink/video-generation/download?taskId=${encodeURIComponent(task.id)}&index=${index}`,
            id: `${task.id}-${index}`,
            index,
            resultUrl,
            task,
          }))
        ),
    [historyQuery.data]
  );

  const taskQuery = useQuery({
    queryKey: ['evolink-video-generation', videoTask?.id],
    enabled: Boolean(videoTask?.id) && !isTerminalStatus(videoTask?.status),
    queryFn: () =>
      apiGet<EvolinkVideoTask>(
        `/api/evolink/video-generation?taskId=${encodeURIComponent(videoTask!.id)}`
      ),
    refetchInterval: (query) =>
      isTerminalStatus(query.state.data?.status) ? false : 3000,
  });

  useEffect(() => {
    if (!taskQuery.data) return;
    setVideoTask(taskQuery.data);
    setGenerationState(
      taskQuery.data.status === 'success'
        ? 'ready'
        : taskQuery.data.status === 'failed' ||
            taskQuery.data.status === 'canceled'
          ? 'idle'
          : 'queued'
    );
    if (taskQuery.data.status === 'failed') {
      toast.error(taskQuery.data.errorMessage || 'Video generation failed');
    }
    if (taskQuery.data.status === 'success') {
      void queryClient.invalidateQueries({
        queryKey: ['evolink-video-generation', 'history'],
      });
    }
  }, [queryClient, taskQuery.data]);

  const generationMutation = useMutation({
    mutationFn: async () => {
      if (!activeModel) throw new Error('Choose a video model');
      if (!prompt.trim()) throw new Error(copy.promptPlaceholder);

      const selectedOutput = parseOutput(output);
      const quality = qualityForModel(
        activeModel.apiModel,
        selectedOutput.quality
      );
      let imageUrls: string[] = [];
      if (file) {
        const formData = new FormData();
        formData.append('files', file, file.name);
        const uploaded = await apiUpload<{ images: string[] }>(
          '/api/storage/upload-media',
          formData
        );
        imageUrls = uploaded.images;
      }

      const modeKey: EvolinkVideoMode =
        mode === copy.modeImage
          ? 'image-to-video'
          : mode === copy.modeReference
            ? 'reference-to-video'
            : 'text-to-video';
      return apiPost<EvolinkVideoTask>('/api/evolink/video-generation', {
        model: activeModel.apiModel,
        mode: modeKey,
        prompt: prompt.trim(),
        imageUrls,
        duration: selectedOutput.duration,
        quality,
        aspectRatio: selectedOutput.aspectRatio,
        generateAudio: true,
      });
    },
    onSuccess: (task) => {
      setVideoTask(task);
      setGenerationState(isTerminalStatus(task.status) ? 'ready' : 'queued');
      void queryClient.invalidateQueries({
        queryKey: ['evolink-video-generation', 'history'],
      });
    },
    onError: (error: Error) => {
      setGenerationState('idle');
      if (
        error.message === 'Payment required before video generation' ||
        error.message === 'Insufficient credits'
      ) {
        setIsCreditPaywallOpen(true);
        void creditsQuery.refetch();
        return;
      }
      toast.error(error.message);
    },
  });

  const creditCheckoutMutation = useMutation({
    mutationFn: (provider: PaymentProvider) =>
      apiPost<{ checkout_url?: string }>('/api/payment/checkout', {
        product_id: selectedMonthlyPlanProductId,
        payment_provider: provider,
        redirect: '/ai-video-generator',
      }),
    onSuccess: (data) => {
      if (!data.checkout_url) {
        toast.error(copy.checkoutFailedMessage);
        setLoadingPaymentProvider(null);
        return;
      }
      window.location.href = data.checkout_url;
    },
    onError: (error: Error) => {
      toast.error(error.message || copy.checkoutFailedMessage);
      setLoadingPaymentProvider(null);
    },
  });

  const selectFile = (nextFile: File | undefined) => {
    if (!nextFile || !nextFile.type.startsWith('image/')) return;
    setFile(nextFile);
    setGenerationState('idle');
    setVideoTask(null);
  };

  const clearFile = () => {
    setFile(null);
    setGenerationState('idle');
    setVideoTask(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const startCreditCheckout = (provider: PaymentProvider) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        'ai-video-generator-payment-draft',
        JSON.stringify({ mode, model, output, prompt })
      );
    }
    setLoadingPaymentProvider(provider);
    creditCheckoutMutation.mutate(provider);
  };

  const startGeneration = () => {
    if (generationMutation.isPending || generationState === 'queued') return;
    if (!session?.user) {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent('/ai-video-generator')}`
      );
      return;
    }
    if (creditsQuery.isPending || !creditsQuery.data) {
      void creditsQuery.refetch();
      return;
    }
    if (!creditsQuery.data.hasPaidCredits) {
      setIsCreditPaywallOpen(true);
      return;
    }

    setGenerationState('queued');
    generationMutation.mutate();
  };

  const outputOptions = useMemo(() => {
    const qualityOptions =
      activeModelFamily === 'seedance-2.5'
        ? (['480p', '720p', '1080p'] as const)
        : (['480p', '768p'] as const);
    const durations =
      activeModelFamily === 'seedance-2.5' ? [5, 8, 15, 30] : [5, 8, 15];
    return qualityOptions.flatMap((quality) =>
      durations.map((duration) =>
        outputLabel({ aspectRatio: '16:9', duration, quality })
      )
    );
  }, [activeModelFamily]);

  return (
    <main className="min-h-[calc(100dvh-3rem)] overflow-x-hidden bg-transparent px-4 py-10 text-[#334047] sm:px-7 lg:px-10 lg:py-12">
      <div className="mx-auto w-full max-w-[1052px]">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[#2d3438] sm:text-4xl lg:text-[42px]">
            {copy.pageTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#69777b] sm:text-base">
            {copy.pageDescription}
          </p>
        </header>

        <section
          aria-label={copy.pageTitle}
          className="relative mt-7 overflow-visible rounded-[20px] border border-white/70 bg-white/[0.96] shadow-[0_10px_36px_rgba(0,0,0,0.12)]"
        >
          <div className="relative min-h-[178px] border-b border-[#edf1f2] p-5 sm:p-6">
            <div className="relative w-[108px]">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="group flex min-h-[132px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#c9ced3] bg-white px-2 text-center transition hover:border-[#747b82] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#646b72]"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={copy.uploadImage}
                    className="h-16 w-20 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-white text-[#646b72] shadow-[0_4px_12px_rgba(73,80,87,0.12)]">
                    <ImagePlus className="size-4" aria-hidden="true" />
                  </span>
                )}
                <span className="text-xs font-semibold text-[#5d656c]">
                  {copy.uploadImage}
                </span>
                <span className="text-[10px] text-[#9aa8aa]">
                  {copy.optional}
                </span>
              </button>
              {file ? (
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute -top-1 -right-1 z-10 grid size-6 place-items-center rounded-md border-2 border-[#f15b5d] bg-white text-[#f15b5d] shadow-[0_2px_6px_rgba(241,91,93,0.18)] transition hover:bg-[#fff4f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f15b5d]"
                  aria-label={copy.removeUpload}
                  title={copy.removeUpload}
                >
                  <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            <div className="absolute top-5 right-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPromptExpanded((expanded) => !expanded)}
                aria-pressed={isPromptExpanded}
                className="grid size-9 place-items-center rounded-full border border-[#e3e6e8] bg-white text-[#7a8086] transition hover:border-[#aeb4b9] hover:text-[#545b62]"
                aria-label={copy.expandInput}
                title={copy.expandInput}
              >
                <Expand className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="absolute top-6 right-20 left-[148px]">
              <label htmlFor="ai-video-prompt" className="sr-only">
                {copy.promptLabel}
              </label>
              <textarea
                id="ai-video-prompt"
                value={prompt}
                onChange={(event) => {
                  setPrompt(event.target.value);
                  setGenerationState('idle');
                }}
                placeholder={copy.promptPlaceholder}
                rows={4}
                className={cn(
                  'w-full resize-none bg-transparent pr-3 text-sm leading-6 text-[#364347] outline-none placeholder:text-[#9aa6b0] sm:text-base',
                  isPromptExpanded ? 'min-h-[210px]' : 'min-h-[122px]'
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 px-5 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Dropdown
                label={mode}
                open={openMenu === 'mode'}
                onToggle={() =>
                  setOpenMenu((current) => (current === 'mode' ? null : 'mode'))
                }
                options={[
                  copy.mode,
                  copy.modeText,
                  copy.modeImage,
                  copy.modeReference,
                ]}
                onSelect={(value) => {
                  setMode(value);
                  setOpenMenu(null);
                }}
              />
              <Dropdown
                label={model}
                modelFamily={activeModel?.apiModel}
                getModelFamily={(option) =>
                  models.find((item) => item.name === option)?.apiModel
                }
                open={openMenu === 'model'}
                onToggle={() =>
                  setOpenMenu((current) =>
                    current === 'model' ? null : 'model'
                  )
                }
                options={models.map((item) => item.name)}
                onSelect={(value) => {
                  setModel(value);
                  const nextModel = models.find((item) => item.name === value);
                  if (nextModel) {
                    const nextOutput = parseOutput(output);
                    const limits =
                      EVOLINK_VIDEO_DURATION_LIMITS[nextModel.apiModel];
                    setOutput(
                      outputLabel({
                        aspectRatio: nextOutput.aspectRatio,
                        duration: Math.min(
                          limits.max,
                          Math.max(limits.min, nextOutput.duration)
                        ),
                        quality: qualityForModel(
                          nextModel.apiModel,
                          nextOutput.quality
                        ),
                      })
                    );
                  }
                  setOpenMenu(null);
                }}
              />
              <Dropdown
                label={output}
                open={openMenu === 'output'}
                onToggle={() =>
                  setOpenMenu((current) =>
                    current === 'output' ? null : 'output'
                  )
                }
                options={outputOptions}
                onSelect={(value) => {
                  setOutput(value);
                  setOpenMenu(null);
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setOpenMenu((current) =>
                    current === 'output' ? null : 'output'
                  )
                }
                aria-expanded={openMenu === 'output'}
                className="grid size-9 place-items-center rounded-xl text-[#738083] transition hover:bg-white hover:text-[#545b62]"
                aria-label={copy.settings}
                title={copy.settings}
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              disabled={
                generationMutation.isPending || generationState === 'queued'
              }
              onClick={startGeneration}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#5d646b] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(70,77,84,0.18)] transition hover:bg-[#484f56] disabled:cursor-not-allowed disabled:bg-[#c4c9cd] disabled:shadow-none"
            >
              {generationMutation.isPending || generationState === 'queued' ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              <span>{copy.generate}</span>
              <span className="text-xs opacity-90">
                ({currentCredits} {copy.creditsUnit})
              </span>
            </button>
          </div>
        </section>

        <div className="mt-3 flex items-center justify-between">
          <div aria-live="polite" className="min-h-5 text-xs text-[#607073]">
            {generationState === 'queued' ? (
              <span className="inline-flex items-center gap-1.5">
                <LoaderCircle
                  className="size-3 animate-spin"
                  aria-hidden="true"
                />
                {copy.queuedLabel}
              </span>
            ) : generationState === 'ready' ? (
              <span className="inline-flex items-center gap-1.5 text-[#5e666d]">
                <Check className="size-3.5" aria-hidden="true" />
                {copy.readyLabel}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() =>
              historyRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-[#687078] transition hover:text-[#454c53]"
          >
            {copy.history}
            <History className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        {videoTask?.resultUrls[0] ? (
          <section
            className="mt-5 overflow-hidden rounded-[22px] border border-[#e5e9e9] bg-[#fbfdfd] p-3 shadow-[0_10px_26px_rgba(76,82,88,0.08)]"
            aria-label={copy.readyLabel}
          >
            <video
              controls
              playsInline
              src={videoTask.resultUrls[0]}
              className="mx-auto max-h-[560px] w-full rounded-2xl bg-[#e8eeee] object-contain"
            />
            <div className="flex items-center justify-end px-1 pt-2">
              <a
                href={`/api/evolink/video-generation/download?taskId=${encodeURIComponent(videoTask.id)}&index=0`}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#52706f] transition hover:bg-[#e8f2f1] hover:text-[#354144]"
              >
                <Download className="size-3.5" aria-hidden="true" />
                {copy.historyDownload}
              </a>
            </div>
          </section>
        ) : null}

        {session?.user ? (
          <section
            ref={historyRef}
            className="mt-7 scroll-mt-6 rounded-[22px] border border-[#e5e9e9] p-5 sm:p-6"
            aria-labelledby="ai-video-history-heading"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-xl bg-[#e8f2f1] text-[#52706f]">
                  <Film className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="ai-video-history-heading"
                    className="text-base font-semibold text-[#354144]"
                  >
                    {copy.historyTitle}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#849092]">
                    {historyVideos.length} {copy.historyTitle.toLowerCase()}
                  </p>
                </div>
              </div>
              {historyQuery.isFetching ? (
                <LoaderCircle
                  className="size-4 animate-spin text-[#829397]"
                  aria-label={copy.queuedLabel}
                />
              ) : null}
            </div>

            {historyVideos.length ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {historyVideos.map((video) => (
                  <article
                    key={video.id}
                    className="overflow-hidden rounded-2xl border border-[#e1e8e8] bg-white shadow-[0_7px_18px_rgba(76,82,88,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(76,82,88,0.12)]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setVideoTask(video.task);
                        setGenerationState('ready');
                      }}
                      className="group relative block aspect-video w-full overflow-hidden bg-[#e8eeee] text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#52706f]"
                      aria-label={copy.historyOpen}
                    >
                      <video
                        src={video.resultUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="size-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.035] group-hover:opacity-100"
                      />
                      <span className="absolute inset-0 grid place-items-center bg-black/10 text-white/0 transition group-hover:bg-black/35 group-hover:text-white">
                        <Play
                          className="size-8 fill-current"
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <time
                        dateTime={video.createdAt}
                        className="min-w-0 truncate text-[11px] font-medium text-[#78878a]"
                      >
                        {formatCreatedAt(video.createdAt)}
                      </time>
                      <div className="flex shrink-0 items-center gap-1">
                        <a
                          href={video.resultUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex size-7 items-center justify-center rounded-lg text-[#718083] transition hover:bg-[#eef6f5] hover:text-[#354144]"
                          aria-label={copy.historyOpen}
                          title={copy.historyOpen}
                        >
                          <ExternalLink
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </a>
                        <a
                          href={video.downloadUrl}
                          className="inline-flex size-7 items-center justify-center rounded-lg text-[#52706f] transition hover:bg-[#e8f2f1] hover:text-[#354144]"
                          aria-label={copy.historyDownload}
                          title={copy.historyDownload}
                        >
                          <Download className="size-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : historyQuery.isLoading ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="aspect-video animate-pulse rounded-2xl bg-[#edf2f2]"
                  />
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-[#cbd9d9] bg-white/70 px-4 py-7 text-center text-sm leading-6 text-[#7b898b]">
                {copy.historyEmpty}
              </p>
            )}
          </section>
        ) : null}

        <div className="mt-10 space-y-14 sm:mt-14 sm:space-y-20">
          {features.map((feature, index) => (
            <section
              key={feature.title}
              className={cn(
                'grid items-center gap-8 md:grid-cols-2 md:gap-12',
                index % 2 === 1 && 'md:[&>div:first-child]:order-2'
              )}
            >
              <div>
                <span className="text-xs font-semibold tracking-[0.14em] text-[#687078] uppercase">
                  {copy.eyebrow}
                </span>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#354144] sm:text-3xl">
                  {feature.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#718083] sm:text-base">
                  {feature.description}
                </p>
              </div>
              <div className="overflow-hidden rounded-[22px] border border-[#e5e7e9] bg-white p-2 shadow-[0_12px_28px_rgba(76,82,88,0.12)]">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  src={feature.videoSrc}
                  poster={'/ezremove-video/' + feature.imageSrc}
                  className="aspect-[4/3] w-full rounded-2xl object-cover"
                  aria-hidden="true"
                />
              </div>
            </section>
          ))}
        </div>

        <section
          className="mt-16 sm:mt-24"
          aria-labelledby="ai-video-steps-heading"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="ai-video-steps-heading"
              className="text-3xl font-semibold tracking-[-0.05em] text-[#354144]"
            >
              {copy.stepsTitle}
            </h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="overflow-hidden rounded-2xl border border-[#e5e7e9] bg-white shadow-[0_8px_18px_rgba(76,82,88,0.08)]"
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  src={step.videoSrc}
                  poster={'/ezremove-video/' + step.imageSrc}
                  className="aspect-[3/2] w-full object-cover"
                  aria-hidden="true"
                />
                <div className="p-5">
                  <span className="text-xs font-semibold text-[#687078]">
                    0{index + 1}
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-[#354144]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#718083]">
                    {step.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="mt-16 sm:mt-24"
          aria-labelledby="ai-video-benefits-heading"
        >
          <h2
            id="ai-video-benefits-heading"
            className="text-center text-3xl font-semibold tracking-[-0.05em] text-[#354144]"
          >
            {copy.benefitsTitle}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="rounded-2xl border border-[#e5e7e9] bg-white p-5 shadow-[0_8px_18px_rgba(76,82,88,0.06)]"
              >
                <div className="grid size-9 place-items-center rounded-xl border border-[#e1e4e6] bg-white text-[#687078]">
                  <Sparkles className="size-4" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-[#354144]">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#718083]">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <AiVideoGeneratorSeoContent />
      </div>

      <PaymentProviderModal
        open={isCreditPaywallOpen}
        onOpenChange={(open) => {
          setIsCreditPaywallOpen(open);
          if (!open) setLoadingPaymentProvider(null);
        }}
        providers={
          enabledPaymentProviders.length ? enabledPaymentProviders : ['stripe']
        }
        loadingProvider={loadingPaymentProvider}
        onSelect={startCreditCheckout}
        title={copy.creditPaywallTitle}
        description={copy.creditPaywallDescription}
        priceOptions={copy.monthlyPlanOptions}
        selectedPriceOptionId={selectedMonthlyPlanProductId}
        onSelectPriceOption={setSelectedMonthlyPlanProductId}
      />
    </main>
  );
}

function Dropdown({
  getModelFamily,
  label,
  modelFamily,
  onSelect,
  onToggle,
  open,
  options,
}: {
  getModelFamily?: (option: string) => EvolinkVideoModelFamily | undefined;
  label: string;
  modelFamily?: EvolinkVideoModelFamily;
  onSelect: (value: string) => void;
  onToggle: () => void;
  open: boolean;
  options: string[];
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="inline-flex h-9 max-w-full items-center gap-2 rounded-xl border border-[#e1e4e6] bg-white px-2.5 text-xs font-medium text-[#647477] transition hover:border-[#b5bbc0] hover:bg-white"
      >
        {modelFamily ? <ModelLogo family={modelFamily} /> : null}
        <span className="max-w-[145px] truncate">{label}</span>
        <ChevronDown
          className={cn('size-3.5 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 min-w-[190px] rounded-xl border border-[#e1e4e6] bg-white p-1.5 shadow-[0_12px_28px_rgba(52,58,64,0.18)]">
          {options.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => onSelect(option)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-[#5b6268] transition hover:bg-white hover:text-[#4f575e]"
            >
              <span className="inline-flex items-center gap-2">
                {getModelFamily?.(option) ? (
                  <ModelLogo family={getModelFamily(option)!} />
                ) : null}
                {option}
              </span>
              {option === label ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ModelLogo({ family }: { family: EvolinkVideoModelFamily }) {
  const logoSrc =
    family === 'seedance-2.5'
      ? '/ai-video/logos/seedance.png'
      : '/ai-video/logos/minimax.png';

  return (
    <img
      src={logoSrc}
      alt=""
      aria-hidden="true"
      className="size-5 shrink-0 rounded-md object-contain"
      draggable={false}
    />
  );
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(date);
}
