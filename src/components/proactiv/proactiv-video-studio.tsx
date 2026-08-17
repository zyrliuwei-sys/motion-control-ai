import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  CircleCheckBig,
  Download,
  ExternalLink,
  Layers3,
  Play,
  Radio,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { apiGet, apiPost, apiUpload } from '@/lib/api-client';
import {
  ProactivHeroComposer,
  type ProactivGenerationValues,
  type ProactivHeroComposerLabels,
} from '@/components/proactiv/proactiv-hero-composer';
import type { ProactivVideoShowcaseCase } from '@/components/proactiv/proactiv-video-showcase';

export interface ProactivVideoStudioCopy {
  activeTemplateLabel: string;
  clipCountLabel: string;
  collapseComposerLabel: string;
  composerLabel: string;
  liveLabel: string;
  readyLabel: string;
  referenceImageLabel: string;
  referenceVideoLabel: string;
  generatedVideoLabel: string;
  downloadVideoLabel: string;
  openGeneratedVideoLabel: string;
  resultExpirationLabel: string;
  resultSavedLabel: string;
  uploadsRequiredMessage: string;
  uploadInProgressLabel: string;
  taskPendingLabel: string;
  taskProcessingLabel: string;
  taskCompletedLabel: string;
  taskFailedLabel: string;
  retryGenerationLabel: string;
  selectTemplateLabel: string;
}

export interface ProactivVideoStudioProps {
  cases: ProactivVideoShowcaseCase[];
  composerLabels: ProactivHeroComposerLabels;
  copy: ProactivVideoStudioCopy;
  initialPrompt?: string;
}

const galleryLayouts = [
  'aspect-[9/16]',
  'aspect-[4/5]',
  'aspect-[3/4]',
  'aspect-[5/4]',
  'aspect-[2/3]',
  'aspect-[3/4]',
  'aspect-[4/5]',
  'aspect-[9/16]',
  'aspect-[3/4]',
  'aspect-[5/4]',
  'aspect-[2/3]',
  'aspect-[4/5]',
] as const;

interface MotionControlTask {
  id: string;
  providerTaskId: string | null;
  model: string;
  status: string;
  progress: number;
  resultUrls: string[];
  isArchived: boolean;
  errorMessage?: string;
}

function isTerminalTask(status: string) {
  return ['success', 'failed', 'canceled'].includes(status);
}

function taskLabel(status: string, copy: ProactivVideoStudioCopy) {
  switch (status) {
    case 'success':
      return copy.taskCompletedLabel;
    case 'failed':
    case 'canceled':
      return copy.taskFailedLabel;
    case 'processing':
      return copy.taskProcessingLabel;
    default:
      return copy.taskPendingLabel;
  }
}

const GENERATION_REQUEST_ATTEMPTS = 2;
const GENERATION_RETRY_DELAY_MS = 2_000;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function createMotionControlTaskWithRetry(payload: {
  prompt: string;
  imageUrls: string[];
  videoUrls: string[];
  quality: '720p';
  characterOrientation: 'image';
  keepSound: boolean;
}): Promise<MotionControlTask> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= GENERATION_REQUEST_ATTEMPTS; attempt += 1) {
    try {
      return await apiPost<MotionControlTask>(
        '/api/evolink/motion-control',
        payload
      );
    } catch (error) {
      lastError = error;
      if (attempt < GENERATION_REQUEST_ATTEMPTS) {
        await wait(GENERATION_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to create generation task');
}

/** A full-bleed template feed with the landing composer docked above it. */
export function ProactivVideoStudio({
  cases,
  composerLabels,
  copy,
  initialPrompt = '',
}: ProactivVideoStudioProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedCase, setSelectedCase] =
    useState<ProactivVideoShowcaseCase | null>(null);
  const [isQueued, setIsQueued] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [motionTask, setMotionTask] = useState<MotionControlTask | null>(null);
  const [retryValues, setRetryValues] =
    useState<ProactivGenerationValues | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const galleryCases = useMemo(
    () =>
      cases.map((videoCase, index) => ({
        layout: galleryLayouts[index % galleryLayouts.length]!,
        videoCase,
      })),
    [cases]
  );

  useEffect(() => {
    setPrompt(initialPrompt);
    setIsQueued(false);
  }, [initialPrompt]);

  const taskQuery = useQuery({
    queryKey: ['evolink-motion-control', motionTask?.id],
    queryFn: () =>
      apiGet<MotionControlTask>(
        `/api/evolink/motion-control?taskId=${encodeURIComponent(motionTask!.id)}`
      ),
    enabled: Boolean(motionTask && !isTerminalTask(motionTask.status)),
    refetchInterval: (query) =>
      isTerminalTask(query.state.data?.status ?? motionTask?.status ?? '')
        ? false
        : 5_000,
  });

  const recentTasksQuery = useQuery({
    queryKey: ['evolink-motion-control', 'recent'],
    queryFn: () => apiGet<MotionControlTask[]>('/api/evolink/motion-control'),
    enabled: Boolean(session?.user),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!taskQuery.data) return;
    setMotionTask(taskQuery.data);
    setIsQueued(!isTerminalTask(taskQuery.data.status));
    if (taskQuery.data.status === 'success') {
      setShowRetry(false);
      void queryClient.invalidateQueries({
        queryKey: ['evolink-motion-control', 'recent'],
      });
    } else if (['failed', 'canceled'].includes(taskQuery.data.status)) {
      setShowRetry(true);
    }
  }, [queryClient, taskQuery.data]);

  const generationMutation = useMutation({
    mutationFn: async (values: ProactivGenerationValues) => {
      const images = values.references.filter(
        (reference) => reference.type === 'image'
      );
      const videos = values.references.filter(
        (reference) => reference.type === 'video'
      );
      if (!images.length || !videos.length) {
        throw new Error(copy.uploadsRequiredMessage);
      }

      const formData = new FormData();
      for (const reference of [...images, ...videos]) {
        formData.append('files', reference.file, reference.name);
      }
      const uploaded = await apiUpload<{ images: string[]; videos: string[] }>(
        '/api/storage/upload-media',
        formData
      );
      return createMotionControlTaskWithRetry({
        prompt: values.prompt,
        imageUrls: uploaded.images,
        videoUrls: uploaded.videos,
        quality: '720p',
        characterOrientation: 'image',
        keepSound: true,
      });
    },
    onSuccess: (task) => {
      setMotionTask(task);
      setIsQueued(!isTerminalTask(task.status));
      setShowRetry(false);
    },
    onError: (_error: Error, values) => {
      setIsQueued(false);
      setRetryValues(values);
      setShowRetry(true);
    },
  });

  function startGeneration(values: ProactivGenerationValues) {
    setRetryValues(values);
    setShowRetry(false);
    setMotionTask(null);
    setIsQueued(true);
    generationMutation.mutate(values);
  }

  function retryGeneration() {
    if (!retryValues || generationMutation.isPending) return;
    startGeneration(retryValues);
  }

  useEffect(() => {
    if (generationMutation.isPending || isQueued || motionTask) return;
    const mostRecentTask = recentTasksQuery.data?.[0];
    if (mostRecentTask) setMotionTask(mostRecentTask);
  }, [
    generationMutation.isPending,
    isQueued,
    motionTask,
    recentTasksQuery.data,
  ]);

  const selectCase = (videoCase: ProactivVideoShowcaseCase) => {
    setSelectedCase(videoCase);
    setPrompt(videoCase.description);
    setIsQueued(false);
    setIsComposerOpen(true);
  };

  return (
    <section
      id="studio-feed"
      className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-[#080a0d] pb-[132px] text-white sm:pb-[156px] md:pb-[176px]"
    >
      <div
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:52px_52px] opacity-45"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_50%_0%,rgba(74,115,26,0.16),transparent_68%)]"
        aria-hidden="true"
      />

      <div className="relative px-[3px] pt-3 sm:pt-4">
        <div className="sticky top-0 z-20 mx-1 mb-3 flex items-center justify-between gap-3 border-y border-white/8 bg-[#080a0d]/80 px-3 py-2.5 backdrop-blur-xl sm:mx-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5 text-[10px] font-semibold tracking-[0.15em] text-white/60 uppercase sm:text-[11px]">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-[#d1fe17] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#d1fe17]" />
            </span>
            <span className="truncate text-white/85">{copy.liveLabel}</span>
            <span className="hidden text-white/30 sm:inline">/</span>
            <span className="hidden sm:inline">{copy.clipCountLabel}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 text-[10px] font-medium tracking-[0.1em] text-white/50 uppercase sm:text-[11px]">
            <Layers3
              className="size-3.5 shrink-0 text-[#d1fe17]"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{copy.activeTemplateLabel}</span>
            <span className="truncate text-white/90">
              {selectedCase?.title ?? copy.selectTemplateLabel}
            </span>
          </div>
        </div>

        <div className="columns-2 gap-[3px] sm:columns-3 lg:columns-5 2xl:columns-6">
          {galleryCases.map(({ layout, videoCase }, index) => (
            <StudioVideoTile
              key={`${videoCase.src}-${index}`}
              isSelected={selectedCase?.src === videoCase.src}
              layout={layout}
              videoCase={videoCase}
              onSelect={() => selectCase(videoCase)}
            />
          ))}
        </div>
      </div>

      <div className="fixed right-3 bottom-3 left-3 z-40 md:right-5 md:bottom-5 md:left-[calc(16rem+1.25rem)] lg:left-[calc(16rem+2rem)]">
        <div className="mx-auto w-full max-w-[980px]">
          <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-[#12161b]/92 p-1.5 shadow-[0_24px_90px_rgba(0,0,0,0.6),0_0_0_1px_rgba(209,254,23,0.06)] backdrop-blur-2xl sm:p-2">
            <div
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(209,254,23,0.9),transparent)]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-8 -bottom-16 size-44 rounded-full bg-[#d1fe17]/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative flex items-center justify-between gap-3 px-3 pt-1.5 pb-2 sm:px-4 sm:pt-2">
              <div className="flex min-w-0 items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-white/55 uppercase">
                <Radio
                  className={`size-3.5 shrink-0 ${
                    isQueued ? 'text-[#d1fe17]' : 'text-white/40'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">
                  {generationMutation.isPending
                    ? copy.uploadInProgressLabel
                    : motionTask
                      ? taskLabel(motionTask.status, copy)
                      : isQueued
                        ? copy.readyLabel
                        : copy.composerLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen((open) => !open)}
                className="inline-flex size-7 items-center justify-center rounded-full text-white/55 transition hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1fe17] md:hidden"
                aria-expanded={isComposerOpen}
                aria-label={copy.collapseComposerLabel}
              >
                <ChevronDown
                  className={`size-4 transition-transform ${
                    isComposerOpen ? '' : 'rotate-180'
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className={isComposerOpen ? 'block' : 'hidden md:block'}>
              {motionTask ? (
                <MotionTaskCard task={motionTask} copy={copy} />
              ) : null}
              {showRetry && retryValues ? (
                <div className="mx-1 mt-1 mb-2 rounded-[22px] border border-white/12 bg-white/[0.035] p-2 sm:p-3">
                  <button
                    className="flex min-h-10 w-full items-center justify-center rounded-xl bg-white/10 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1fe17] disabled:cursor-wait disabled:opacity-60"
                    disabled={generationMutation.isPending}
                    onClick={retryGeneration}
                    type="button"
                  >
                    {copy.retryGenerationLabel}
                  </button>
                </div>
              ) : null}
              <ProactivHeroComposer
                isGenerating={
                  generationMutation.isPending ||
                  Boolean(motionTask && !isTerminalTask(motionTask.status))
                }
                labels={{
                  ...composerLabels,
                  avatar: copy.referenceImageLabel,
                  product: copy.referenceVideoLabel,
                }}
                promptValue={prompt}
                onPromptChange={(nextPrompt) => {
                  setPrompt(nextPrompt);
                  setIsQueued(false);
                }}
                onGenerate={startGeneration}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MotionTaskCard({
  task,
  copy,
}: {
  task: MotionControlTask;
  copy: ProactivVideoStudioCopy;
}) {
  const failed = task.status === 'failed' || task.status === 'canceled';

  return (
    <div
      className="relative mx-1 mt-1 mb-2 overflow-hidden rounded-[22px] border border-white/10 bg-[#0e1115] p-3 sm:p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-white/50 uppercase">
            {copy.generatedVideoLabel}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {failed ? copy.retryGenerationLabel : taskLabel(task.status, copy)}
          </p>
        </div>
        <span className="text-xs font-semibold text-[#d1fe17] tabular-nums">
          {task.progress}%
        </span>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            failed ? 'bg-white/35' : 'bg-[#d1fe17]'
          }`}
          style={{ width: `${Math.max(4, task.progress)}%` }}
        />
      </div>

      {task.resultUrls.length ? (
        <div
          className={`mt-3 grid gap-3 ${
            task.resultUrls.length > 1 ? 'sm:grid-cols-2' : ''
          }`}
        >
          {task.resultUrls.map((resultUrl, index) => (
            <GeneratedVideoPlayer
              key={resultUrl}
              downloadLabel={copy.downloadVideoLabel}
              downloadUrl={`/api/evolink/motion-control/download?taskId=${encodeURIComponent(task.id)}&index=${index}`}
              expirationLabel={copy.resultExpirationLabel}
              isArchived={task.isArchived}
              resultUrl={resultUrl}
              openLabel={copy.openGeneratedVideoLabel}
              savedLabel={copy.resultSavedLabel}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function GeneratedVideoPlayer({
  downloadLabel,
  downloadUrl,
  expirationLabel,
  isArchived,
  resultUrl,
  openLabel,
  savedLabel,
}: {
  downloadLabel: string;
  downloadUrl: string;
  expirationLabel: string;
  isArchived: boolean;
  resultUrl: string;
  openLabel: string;
  savedLabel: string;
}) {
  const [unplayable, setUnplayable] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
      {!unplayable ? (
        <video
          key={resultUrl}
          src={resultUrl}
          controls
          playsInline
          preload="metadata"
          onError={() => setUnplayable(true)}
          className="max-h-[320px] w-full bg-black object-contain"
        />
      ) : null}
      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-2 py-2">
        <a
          href={downloadUrl}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#d1fe17] px-3 text-xs font-bold text-[#101600] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1fe17]"
        >
          <Download className="size-3.5" aria-hidden="true" />
          {downloadLabel}
        </a>
        <a
          href={resultUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-white/65 transition hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1fe17]"
        >
          <ExternalLink className="size-3.5" aria-hidden="true" />
          {openLabel}
        </a>
      </div>
      <p className="px-3 pb-3 text-[11px] leading-4 text-white/45">
        {isArchived ? savedLabel : expirationLabel}
      </p>
    </div>
  );
}

function StudioVideoTile({
  isSelected,
  layout,
  onSelect,
  videoCase,
}: {
  isSelected: boolean;
  layout: string;
  onSelect: () => void;
  videoCase: ProactivVideoShowcaseCase;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { rootMargin: '220px 0px' }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${videoCase.title}: ${videoCase.description}`}
      className={`group relative mb-[3px] inline-block w-full break-inside-avoid overflow-hidden bg-[#121418] text-left align-top transition duration-300 outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#d1fe17] ${
        isSelected ? 'ring-2 ring-[#d1fe17] ring-inset' : ''
      }`}
    >
      <div className={`relative overflow-hidden ${layout}`}>
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="metadata"
          poster={videoCase.posterSrc}
          className="h-full w-full object-cover transition duration-700 ease-out motion-safe:group-hover:scale-[1.055]"
        >
          <source src={videoCase.src} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,9,0.04)_30%,rgba(4,5,6,0.82)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        />
        <div className="absolute right-0 bottom-0 left-0 flex translate-y-2 items-end justify-between gap-3 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold tracking-[-0.025em] text-white">
              {videoCase.title}
            </p>
            <p className="mt-1 text-[9px] font-semibold tracking-[0.14em] text-white/55 uppercase">
              {videoCase.category}
            </p>
          </div>
          <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm">
            {isSelected ? (
              <CircleCheckBig
                className="size-3.5 text-[#d1fe17]"
                aria-hidden="true"
              />
            ) : (
              <Play className="ml-0.5 size-3" aria-hidden="true" />
            )}
          </span>
        </div>
      </div>
    </button>
  );
}
