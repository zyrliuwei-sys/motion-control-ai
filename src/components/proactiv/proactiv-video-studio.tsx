import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  CircleCheckBig,
  Download,
  ExternalLink,
  ImageIcon,
  Layers3,
  LoaderCircle,
  Play,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { useRouter } from '@/core/i18n/navigation';
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
  liveLabel: string;
  readyLabel: string;
  referenceImageLabel: string;
  referenceVideoLabel: string;
  generatedVideoLabel: string;
  generatedImageLabel: string;
  imagePreviewEmptyLabel: string;
  imagePreviewTitleLabel: string;
  regenerateLabel: string;
  insufficientCreditsMessage: string;
  downloadVideoLabel: string;
  downloadImageLabel: string;
  openGeneratedVideoLabel: string;
  openGeneratedImageLabel: string;
  resultExpirationLabel: string;
  resultSavedLabel: string;
  dismissGeneratedVideoLabel: string;
  dismissGeneratedImageLabel: string;
  uploadsRequiredMessage: string;
  imageUploadsRequiredMessage: string;
  uploadInProgressLabel: string;
  taskPendingLabel: string;
  taskProcessingLabel: string;
  taskCompletedLabel: string;
  taskFailedLabel: string;
  videoUnavailableMessage: string;
  imageTaskPendingLabel: string;
  imageTaskProcessingLabel: string;
  imageTaskCompletedLabel: string;
  imageTaskFailedLabel: string;
  retryGenerationLabel: string;
  selectTemplateLabel: string;
}

export interface ProactivVideoStudioProps {
  cases: ProactivVideoShowcaseCase[];
  composerLabels: ProactivHeroComposerLabels;
  copy: ProactivVideoStudioCopy;
  initialPrompt?: string;
  showTemplateFeed?: boolean;
  videoModelEnabled?: boolean;
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
const maximumImageReferenceCount = 3;
const GROK_IMAGINE_IMAGE_API = '/api/evolink/grok-imagine-image';
const GENERATING_IMAGE_PREVIEW_SRC = '/imgs/generated/image-1787716408940.png';

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

interface GrokImagineImageTask {
  id: string;
  model: string;
  status: string;
  progress: number;
  resultUrls: string[];
  errorMessage?: string;
}

export interface GeneratedImagePreview {
  createdAt: string;
  downloadUrl?: string;
  id: string;
  prompt: string;
  url: string;
}

/** A persisted generation returned by /api/ai-tasks/images. */
interface SavedGeneratedImage {
  createdAt: string;
  downloadUrl?: string;
  id: string;
  model: string;
  prompt: string;
  url: string;
}

/** One ChatGPT-style exchange: the submitted prompt and its generated images. */
interface StudioChatTurn {
  createdAt: string;
  id: string;
  images: GeneratedImagePreview[];
  prompt: string;
}

type GenerationTask =
  | { kind: 'image'; task: GrokImagineImageTask }
  | { kind: 'video'; task: MotionControlTask };

const grokImageSizeByAspectRatio: Record<string, string> = {
  '21:9': '20:9',
  '16:9': '16:9',
  '4:3': '4:3',
  '1:1': '1:1',
  '3:4': '3:4',
  '9:16': '9:16',
  adaptive: 'auto',
};

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

function promptWithStyle(values: ProactivGenerationValues) {
  const prompt = values.prompt.trim();
  return values.style ? `${prompt}\n\nVisual style: ${values.style}` : prompt;
}

// A submission creates a paid upstream task. Users retry explicitly instead
// of through an automatic client retry that could trigger a second charge.
async function createMotionControlTask(payload: {
  prompt: string;
  imageUrls: string[];
  videoUrls: string[];
  quality: '720p';
  characterOrientation: 'image';
  keepSound: boolean;
}): Promise<MotionControlTask> {
  return apiPost<MotionControlTask>('/api/evolink/motion-control', payload);
}

async function createGrokImagineImageTask(payload: {
  prompt: string;
  imageUrls?: string[];
  n: number;
  resolution: '1K' | '2K';
  size: string;
}): Promise<GrokImagineImageTask> {
  return apiPost<GrokImagineImageTask>(GROK_IMAGINE_IMAGE_API, {
    ...payload,
    quality: 'medium',
  });
}

function generatedImagePreviews(
  task: GrokImagineImageTask,
  prompt: string
): GeneratedImagePreview[] {
  const createdAt = new Date().toISOString();
  return task.resultUrls.map((url, index) => ({
    createdAt,
    downloadUrl: `${GROK_IMAGINE_IMAGE_API}?taskId=${encodeURIComponent(task.id)}&download=1&index=${index}`,
    id: `${task.id}-${index}`,
    prompt,
    url,
  }));
}

/** Strip the appended "Visual style:" note so chat bubbles stay readable. */
function displayPrompt(prompt: string) {
  const separatorIndex = prompt.indexOf('\n\nVisual style:');
  return (separatorIndex > 0 ? prompt.slice(0, separatorIndex) : prompt).trim();
}

/** A full-bleed template feed with the landing composer docked above it. */
export function ProactivVideoStudio({
  cases,
  composerLabels,
  copy,
  initialPrompt = '',
  showTemplateFeed = true,
  videoModelEnabled = false,
}: ProactivVideoStudioProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedCase, setSelectedCase] =
    useState<ProactivVideoShowcaseCase | null>(null);
  const [isQueued, setIsQueued] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  // The composer is position:fixed, so the feed's bottom padding must track its
  // live height (task cards, retry rows and reference thumbs all change it) or
  // the last turns stay hidden behind it even when scrolled to the end.
  const composerRef = useRef<HTMLDivElement | null>(null);
  const [composerInset, setComposerInset] = useState(0);

  useEffect(() => {
    const node = composerRef.current;
    if (!node) return;
    const update = () => setComposerInset(node.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const feedBottomPadding =
    composerInset > 0 ? `${composerInset + 28}px` : undefined;
  const [motionTask, setMotionTask] = useState<MotionControlTask | null>(null);
  const [imageTask, setImageTask] = useState<GrokImagineImageTask | null>(null);
  const [imageTaskPrompts, setImageTaskPrompts] = useState<
    Record<string, string>
  >({});
  const [imagePreviewItems, setImagePreviewItems] = useState<
    GeneratedImagePreview[]
  >([]);
  const [selectedImagePreviewId, setSelectedImagePreviewId] = useState<
    string | null
  >(null);
  const [dismissedTaskId, setDismissedTaskId] = useState<string | null>(null);
  const [retryValues, setRetryValues] =
    useState<ProactivGenerationValues | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const selectedImagePreview =
    imagePreviewItems.find((item) => item.id === selectedImagePreviewId) ??
    null;
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
    enabled: Boolean(
      videoModelEnabled && motionTask && !isTerminalTask(motionTask.status)
    ),
    refetchInterval: (query) =>
      isTerminalTask(query.state.data?.status ?? motionTask?.status ?? '')
        ? false
        : 5_000,
  });

  const imageTaskQuery = useQuery({
    queryKey: ['evolink-grok-imagine-image', imageTask?.id],
    queryFn: () =>
      apiGet<GrokImagineImageTask>(
        `${GROK_IMAGINE_IMAGE_API}?taskId=${encodeURIComponent(imageTask!.id)}`
      ),
    enabled: Boolean(imageTask && !isTerminalTask(imageTask.status)),
    refetchInterval: (query) =>
      isTerminalTask(query.state.data?.status ?? imageTask?.status ?? '')
        ? false
        : 3_000,
  });

  const recentTasksQuery = useQuery({
    queryKey: ['evolink-motion-control', 'recent'],
    queryFn: () => apiGet<MotionControlTask[]>('/api/evolink/motion-control'),
    enabled: Boolean(videoModelEnabled && session?.user),
    staleTime: 15_000,
  });

  const savedImagesQuery = useQuery({
    queryKey: ['evolink-image-history'],
    queryFn: () => apiGet<SavedGeneratedImage[]>('/api/ai-tasks/images'),
    enabled: Boolean(session?.user),
    staleTime: 15_000,
  });

  // Session results first (they carry download links), then persisted history.
  // Deduplicated by URL and ordered oldest → newest so the latest image always
  // lands at the far end, mirroring the chat thread's newest-at-the-bottom flow.
  const composerImageThumbnails = useMemo(() => {
    const seen = new Set<string>();
    const thumbnails: GeneratedImagePreview[] = [];
    const source = [
      ...imagePreviewItems,
      ...(savedImagesQuery.data ?? []),
    ] as GeneratedImagePreview[];
    for (const item of source) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      thumbnails.push(item);
    }
    return thumbnails.sort((a, b) =>
      (a.createdAt ?? '').localeCompare(b.createdAt ?? '')
    );
  }, [imagePreviewItems, savedImagesQuery.data]);

  // ChatGPT-style turns: each submitted prompt with the images it produced.
  // Session results win on task-id clashes (download links); history fills in
  // everything generated on previous visits.
  const chatTurns = useMemo(() => {
    const turns = new Map<string, StudioChatTurn>();
    const collect = (items: GeneratedImagePreview[]) => {
      for (const item of items) {
        const separator = item.id.lastIndexOf('-');
        const taskId = separator > 0 ? item.id.slice(0, separator) : item.id;
        const turn = turns.get(taskId);
        if (turn) {
          if (!turn.images.some((image) => image.url === item.url)) {
            turn.images.push(item);
          }
        } else {
          turns.set(taskId, {
            createdAt: item.createdAt ?? '',
            id: taskId,
            images: [item],
            prompt: item.prompt,
          });
        }
      }
    };
    collect(imagePreviewItems);
    collect((savedImagesQuery.data ?? []) as GeneratedImagePreview[]);
    return [...turns.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
  }, [imagePreviewItems, savedImagesQuery.data]);

  const threadEndRef = useRef<HTMLDivElement>(null);

  // The right-hand preview panel docks over 26rem on md+; the docked composer
  // shifts left of it instead of covering it.
  const isImageGenerationActive =
    Boolean(pendingPrompt) ||
    Boolean(imageTask && !isTerminalTask(imageTask.status));
  // The preview is a transient detail panel. Closing its current image should
  // reclaim the workspace rather than leaving an empty panel behind.
  const isPreviewPanelOpen = Boolean(selectedImagePreview);

  // Keep the latest chat turn in view.
  useEffect(() => {
    if (!chatTurns.length && !isImageGenerationActive) return;
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [chatTurns, isImageGenerationActive]);

  useEffect(() => {
    if (!videoModelEnabled) return;
    if (!taskQuery.data || taskQuery.data.id === dismissedTaskId) return;
    setMotionTask(taskQuery.data);
    setIsQueued(!isTerminalTask(taskQuery.data.status));
    if (isTerminalTask(taskQuery.data.status)) {
      setPendingPrompt(null);
    }
    if (taskQuery.data.status === 'success') {
      setShowRetry(false);
      void queryClient.invalidateQueries({
        queryKey: ['evolink-motion-control', 'recent'],
      });
    } else if (['failed', 'canceled'].includes(taskQuery.data.status)) {
      setShowRetry(true);
    }
  }, [dismissedTaskId, queryClient, taskQuery.data, videoModelEnabled]);

  useEffect(() => {
    if (!imageTaskQuery.data || imageTaskQuery.data.id === dismissedTaskId) {
      return;
    }
    setImageTask(imageTaskQuery.data);
    setIsQueued(!isTerminalTask(imageTaskQuery.data.status));
    if (isTerminalTask(imageTaskQuery.data.status)) {
      setPendingPrompt(null);
    }
    if (imageTaskQuery.data.status === 'success') {
      setShowRetry(false);
      void queryClient.invalidateQueries({
        queryKey: ['evolink-image-history'],
      });
    } else if (['failed', 'canceled'].includes(imageTaskQuery.data.status)) {
      setShowRetry(true);
    }
  }, [dismissedTaskId, imageTaskQuery.data, queryClient]);

  useEffect(() => {
    if (imageTask?.status !== 'success' || !imageTask.resultUrls.length) {
      return;
    }

    const taskPreviews = generatedImagePreviews(
      imageTask,
      imageTaskPrompts[imageTask.id] ?? copy.generatedImageLabel
    );

    setImagePreviewItems((current) => {
      const remaining = current.filter(
        (item) => !item.id.startsWith(`${imageTask.id}-`)
      );
      return [...taskPreviews, ...remaining];
    });
  }, [copy.generatedImageLabel, imageTask, imageTaskPrompts]);

  const openImagePreview = useCallback((preview: GeneratedImagePreview) => {
    setImagePreviewItems((current) =>
      current.some((item) => item.id === preview.id)
        ? current
        : [preview, ...current]
    );
    setSelectedImagePreviewId(preview.id);
  }, []);

  // Every generation API requires a session, so route anonymous visitors to
  // sign-in (prompt preserved via the ?prompt= search param) instead of
  // surfacing a raw "Unauthorized" error and a misleading retry bar.
  const signInForGeneration = (values: ProactivGenerationValues) => {
    const trimmedPrompt = values.prompt.trim();
    const target = trimmedPrompt
      ? `/text-to-image?prompt=${encodeURIComponent(trimmedPrompt)}`
      : '/text-to-image';
    router.push(`/sign-in?callbackUrl=${encodeURIComponent(target)}`);
  };

  const generationMutation = useMutation({
    mutationFn: async (
      values: ProactivGenerationValues
    ): Promise<GenerationTask> => {
      const images = values.references.filter(
        (reference) => reference.type === 'image'
      );
      if (values.mode === 'text' && images.length === 0) {
        if (!values.prompt.trim()) {
          throw new Error(copy.imageUploadsRequiredMessage);
        }

        const task = await createGrokImagineImageTask({
          prompt: promptWithStyle(values),
          n: values.batchSize,
          resolution: values.resolution,
          size: grokImageSizeByAspectRatio[values.aspectRatio] ?? 'auto',
        });
        return { kind: 'image', task };
      }

      // Reference images always take precedence over the text-only path. This
      // keeps every image selected through the composer in the model request,
      // even if a mode update and a generate click happen in quick succession.
      if (values.mode === 'edit' || images.length > 0) {
        if (!values.prompt.trim() || !images.length) {
          throw new Error(copy.imageUploadsRequiredMessage);
        }

        const formData = new FormData();
        for (const reference of images.slice(0, maximumImageReferenceCount)) {
          formData.append('files', reference.file, reference.name);
        }
        const uploaded = await apiUpload<{ images: string[] }>(
          '/api/storage/upload-media',
          formData
        );
        if (!uploaded.images.length) {
          throw new Error(copy.imageUploadsRequiredMessage);
        }

        const task = await createGrokImagineImageTask({
          prompt: promptWithStyle(values),
          imageUrls: uploaded.images.slice(0, maximumImageReferenceCount),
          n: values.batchSize,
          resolution: values.resolution,
          size: grokImageSizeByAspectRatio[values.aspectRatio] ?? 'auto',
        });
        return { kind: 'image', task };
      }

      if (!videoModelEnabled) {
        throw new Error(copy.videoUnavailableMessage);
      }

      const avatarImage = values.references.find(
        (reference) => reference.slot === 'avatar' && reference.type === 'image'
      );
      const motionVideo = values.references.find(
        (reference) =>
          reference.slot === 'product' && reference.type === 'video'
      );
      if (!avatarImage || !motionVideo) {
        throw new Error(copy.uploadsRequiredMessage);
      }

      const formData = new FormData();
      for (const reference of [avatarImage, motionVideo]) {
        formData.append('files', reference.file, reference.name);
      }
      const uploaded = await apiUpload<{ images: string[]; videos: string[] }>(
        '/api/storage/upload-media',
        formData
      );
      const task = await createMotionControlTask({
        prompt: promptWithStyle(values),
        imageUrls: uploaded.images,
        videoUrls: uploaded.videos,
        quality: '720p',
        characterOrientation: 'image',
        keepSound: true,
      });
      return { kind: 'video', task };
    },
    onSuccess: (result, values) => {
      setDismissedTaskId(null);
      if (result.kind === 'image') {
        setImageTask(result.task);
        setImageTaskPrompts((current) => ({
          ...current,
          [result.task.id]: values.prompt,
        }));
      } else {
        setMotionTask(result.task);
      }
      setIsQueued(!isTerminalTask(result.task.status));
      setShowRetry(false);
    },
    onError: (error: Error, values) => {
      if (error.message === 'Unauthorized') {
        setIsQueued(false);
        setRetryValues(values);
        setPendingPrompt(null);
        signInForGeneration(values);
        return;
      }
      const insufficientCredits = error.message === 'Insufficient credits';
      toast.error(
        insufficientCredits ? copy.insufficientCreditsMessage : error.message
      );
      setIsQueued(false);
      setPendingPrompt(null);
      setRetryValues(values);
      setShowRetry(!insufficientCredits);
    },
  });

  function startGeneration(values: ProactivGenerationValues) {
    if (!isSessionPending && !session?.user) {
      signInForGeneration(values);
      return;
    }

    setRetryValues(values);
    setShowRetry(false);
    setDismissedTaskId(null);
    setMotionTask(null);
    setImageTask(null);
    setIsQueued(true);
    setPendingPrompt(values.prompt);
    // ChatGPT-style send: the prompt moves into the thread and the composer
    // clears immediately, while pendingPrompt/retryValues keep the text.
    setPrompt('');
    generationMutation.mutate(values);
  }

  function retryGeneration() {
    if (!retryValues || generationMutation.isPending) return;
    startGeneration(retryValues);
  }

  // ChatGPT-style "regenerate": re-run a turn's prompt as a fresh text-to-image
  // request. Reference files from earlier submissions are intentionally not
  // reused — only the prompt travels with the turn.
  function regenerateFromTurn(turn: StudioChatTurn) {
    if (generationMutation.isPending) return;
    startGeneration({
      aspectRatio: retryValues?.aspectRatio ?? '9:16',
      batchSize: 1,
      mode: 'text',
      prompt: turn.prompt,
      references: [],
      resolution: retryValues?.resolution ?? '1K',
      style: '',
    });
  }

  useEffect(() => {
    if (!videoModelEnabled) return;
    if (generationMutation.isPending || isQueued || motionTask || imageTask) {
      return;
    }
    const mostRecentTask = recentTasksQuery.data?.[0];
    if (mostRecentTask && mostRecentTask.id !== dismissedTaskId) {
      setMotionTask(mostRecentTask);
    }
  }, [
    dismissedTaskId,
    generationMutation.isPending,
    imageTask,
    isQueued,
    motionTask,
    recentTasksQuery.data,
    videoModelEnabled,
  ]);

  const selectCase = (videoCase: ProactivVideoShowcaseCase) => {
    setSelectedCase(videoCase);
    setPrompt(videoCase.description);
    setIsQueued(false);
    setIsComposerOpen(true);
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)] min-w-0">
      <section
        id="studio-feed"
        className="relative flex h-[calc(100dvh-3rem)] min-w-0 flex-1 overflow-hidden bg-[#fff8fa] text-[#15202b]"
      >
        {/* The only scrollable region on this page: the thread column and its
            backdrop scroll here while the sidebar, preview panel and composer
            stay fixed. Flat #fff8fa backdrop — same tone as the landing page. */}
        <div className="relative h-full min-w-0 flex-1 overflow-y-auto">
          {isImageGenerationActive ? (
            <div
              className="relative mx-auto flex w-full flex-1 items-center justify-center px-4 py-8"
              style={{ paddingBottom: feedBottomPadding }}
              role="status"
              aria-live="polite"
            >
              <span className="sr-only">{copy.imageTaskProcessingLabel}</span>
              <img
                alt=""
                aria-hidden="true"
                src={GENERATING_IMAGE_PREVIEW_SRC}
                className="aspect-square w-full max-w-[20rem] rounded-[26px] object-cover shadow-[0_16px_38px_rgba(21,32,43,0.14)]"
              />
            </div>
          ) : isPreviewPanelOpen ? (
            <div
              className="relative mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-8 pb-[180px] sm:px-6 sm:pb-[204px] md:pb-[224px]"
              style={{ paddingBottom: feedBottomPadding }}
            >
              {chatTurns.map((turn) => (
                <article key={turn.id} className="flex flex-col gap-3.5">
                  <div className="flex justify-end">
                    <p className="ml-auto max-w-[75%] rounded-[22px] rounded-br-md bg-[#fde3ec] px-4 py-2.5 text-sm leading-6 break-words whitespace-pre-wrap text-[#15202b] md:max-w-[32rem]">
                      {displayPrompt(turn.prompt) || copy.generatedImageLabel}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2.5">
                    <div className="flex flex-wrap items-start gap-3">
                      {turn.images.map((image) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => openImagePreview(image)}
                          title={displayPrompt(image.prompt)}
                          aria-label={copy.openGeneratedImageLabel}
                          className="group relative overflow-hidden rounded-2xl border border-[#d6e0e7] bg-white shadow-[0_8px_22px_rgba(21,32,43,0.1)] transition duration-200 hover:-translate-y-0.5 hover:border-[#efb0c4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
                        >
                          <img
                            alt={
                              displayPrompt(image.prompt) ||
                              copy.generatedImageLabel
                            }
                            src={image.url}
                            loading="lazy"
                            decoding="async"
                            className="h-64 w-auto max-w-full object-cover transition duration-300 group-hover:scale-[1.025]"
                          />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => regenerateFromTurn(turn)}
                      disabled={generationMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[#627181] transition-colors hover:bg-[#fff1f5] hover:text-[#c92f68] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <RefreshCw className="size-3.5" aria-hidden="true" />
                      {copy.regenerateLabel}
                    </button>
                  </div>
                </article>
              ))}
              <div ref={threadEndRef} aria-hidden="true" />
            </div>
          ) : showTemplateFeed ? (
            <div
              className="relative px-[3px] pt-3 pb-[180px] sm:pt-4 sm:pb-[204px] md:pb-[224px]"
              style={{ paddingBottom: feedBottomPadding }}
            >
              <div className="sticky top-0 z-20 mx-1 mb-3 flex items-center justify-between gap-3 border-y border-[#d6e0e7] bg-white/85 px-3 py-2.5 backdrop-blur-xl sm:mx-2 sm:px-4">
                <div className="flex min-w-0 items-center gap-2.5 text-[10px] font-semibold tracking-[0.15em] text-[#627181] uppercase sm:text-[11px]">
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex size-2 animate-ping rounded-full bg-[#c92f68] opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#c92f68]" />
                  </span>
                  <span className="truncate text-[#15202b]">
                    {copy.liveLabel}
                  </span>
                  <span className="hidden text-[#a4b2bd] sm:inline">/</span>
                  <span className="hidden sm:inline">
                    {copy.clipCountLabel}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-2 text-[10px] font-medium tracking-[0.1em] text-[#627181] uppercase sm:text-[11px]">
                  <Layers3
                    className="size-3.5 shrink-0 text-[#c92f68]"
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">
                    {copy.activeTemplateLabel}
                  </span>
                  <span className="truncate text-[#15202b]">
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
          ) : null}
        </div>

        {isPreviewPanelOpen ? (
          <aside
            aria-label={copy.imagePreviewTitleLabel}
            className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-[#d6e0e7] bg-white pb-[180px] shadow-[-18px_0_44px_rgba(21,32,43,0.14)] sm:pb-[204px] md:static md:w-[26rem] md:shrink-0 md:pb-0"
          >
            {selectedImagePreview ? (
              <>
                <div className="relative min-h-0 flex-1 overflow-hidden bg-[#fff8fa]">
                  <div className="fixed top-2 right-2 z-30 flex shrink-0 items-center gap-0.5 rounded-lg border border-[#d6e0e7] bg-white/90 p-0.5 shadow-[0_4px_12px_rgba(21,32,43,0.14)] backdrop-blur">
                    <a
                      href={
                        selectedImagePreview.downloadUrl ??
                        selectedImagePreview.url
                      }
                      download
                      className="inline-flex size-7 items-center justify-center rounded-md text-[#627181] transition hover:bg-[#fff1f5] hover:text-[#15202b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
                      aria-label={copy.downloadImageLabel}
                      title={copy.downloadImageLabel}
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                    </a>
                    <a
                      href={selectedImagePreview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex size-7 items-center justify-center rounded-md text-[#627181] transition hover:bg-[#fff1f5] hover:text-[#15202b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
                      aria-label={copy.openGeneratedImageLabel}
                      title={copy.openGeneratedImageLabel}
                    >
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setSelectedImagePreviewId(null)}
                      className="inline-flex size-7 items-center justify-center rounded-md text-[#627181] transition hover:bg-[#fff1f5] hover:text-[#15202b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
                      aria-label={copy.dismissGeneratedImageLabel}
                      title={copy.dismissGeneratedImageLabel}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <img
                    alt={
                      displayPrompt(selectedImagePreview.prompt) ||
                      copy.generatedImageLabel
                    }
                    decoding="async"
                    src={selectedImagePreview.url}
                    className="size-full object-cover"
                  />
                </div>
                <div className="shrink-0 border-t border-[#d6e0e7] px-4 py-3">
                  {composerImageThumbnails.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
                      {composerImageThumbnails.map((image) => {
                        const selected = image.id === selectedImagePreview.id;
                        return (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => openImagePreview(image)}
                            title={displayPrompt(image.prompt)}
                            aria-label={copy.openGeneratedImageLabel}
                            aria-pressed={selected}
                            className={`size-12 shrink-0 overflow-hidden rounded-lg border-2 bg-[#fff8fa] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68] ${
                              selected
                                ? 'border-[#c92f68]'
                                : 'border-transparent hover:border-[#efb0c4]'
                            }`}
                          >
                            <img
                              alt=""
                              src={image.url}
                              loading="lazy"
                              className="size-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-[#fff8fa] p-6 text-center">
                <ImageIcon
                  className="size-8 text-[#c4d3dc]"
                  aria-hidden="true"
                />
                <p className="max-w-56 text-xs leading-5 text-[#627181]">
                  {copy.imagePreviewEmptyLabel}
                </p>
              </div>
            )}
          </aside>
        ) : null}

        <div
          ref={composerRef}
          className={`fixed right-3 bottom-3 left-3 z-40 md:bottom-5 md:left-[calc(var(--app-sidebar-width,0rem)+1.25rem)] ${
            isPreviewPanelOpen ? 'md:right-[calc(26rem+1.25rem)]' : 'md:right-5'
          }`}
        >
          {/* Keep the composer focused: it expands with the sidebar but remains comfortably narrower than the feed. */}
          <div className="mx-auto w-full max-w-[min(880px,calc(620px+var(--app-sidebar-width,0rem)))]">
            <div className="relative min-w-0">
              <div className="relative flex items-center justify-between gap-3 px-3 pt-1.5 pb-2 sm:px-4 sm:pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen((open) => !open)}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[#627181] transition hover:bg-[#fff1f5] hover:text-[#15202b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68] md:hidden"
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
                  <MotionTaskCard
                    task={motionTask}
                    copy={copy}
                    onDismiss={() => {
                      setDismissedTaskId(motionTask.id);
                      setMotionTask(null);
                      setShowRetry(false);
                    }}
                  />
                ) : null}
                {showRetry && retryValues ? (
                  <div className="mx-1 mt-1 mb-2 rounded-[22px] border border-[#d6e0e7] bg-[#f8fafc] p-2 sm:p-3">
                    <button
                      className="flex min-h-10 w-full items-center justify-center rounded-xl bg-[#fff0f5] px-3 text-sm font-semibold text-[#8f2348] transition-colors hover:bg-[#ffe1ea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68] disabled:cursor-wait disabled:opacity-60"
                      disabled={generationMutation.isPending}
                      onClick={retryGeneration}
                      type="button"
                    >
                      {copy.retryGenerationLabel}
                    </button>
                  </div>
                ) : null}
                <ProactivHeroComposer
                  allowVideoMode={videoModelEnabled}
                  isGenerating={
                    generationMutation.isPending ||
                    Boolean(motionTask && !isTerminalTask(motionTask.status)) ||
                    Boolean(imageTask && !isTerminalTask(imageTask.status))
                  }
                  labels={{
                    ...composerLabels,
                    avatar: copy.referenceImageLabel,
                    product: copy.referenceVideoLabel,
                  }}
                  maxImageReferences={maximumImageReferenceCount}
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
    </div>
  );
}

function MotionTaskCard({
  task,
  copy,
  onDismiss,
}: {
  task: MotionControlTask;
  copy: ProactivVideoStudioCopy;
  onDismiss: () => void;
}) {
  const failed = task.status === 'failed' || task.status === 'canceled';

  return (
    <div
      className="relative mx-1 mt-1 mb-2 overflow-hidden rounded-[22px] border border-[#d6e0e7] bg-[#f8fafc] p-3 sm:p-4"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-full border border-[#ead7df] bg-white text-[#627181] transition hover:border-[#efb0c4] hover:bg-[#fff0f5] hover:text-[#8f2348] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68] sm:top-4 sm:right-4"
        aria-label={copy.dismissGeneratedVideoLabel}
        title={copy.dismissGeneratedVideoLabel}
      >
        <X className="size-4" strokeWidth={2.5} aria-hidden="true" />
      </button>

      <div className="flex items-center justify-between gap-4 pr-10">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#627181] uppercase">
            {copy.generatedVideoLabel}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#15202b]">
            {failed ? copy.retryGenerationLabel : taskLabel(task.status, copy)}
          </p>
        </div>
        <span className="text-xs font-semibold text-[#c92f68] tabular-nums">
          {task.progress}%
        </span>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#dce7ed]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            failed ? 'bg-[#d08484]' : 'bg-[#c92f68]'
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
    <div className="overflow-hidden rounded-xl border border-[#d6e0e7] bg-white">
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
      <div className="flex items-center justify-between gap-2 border-t border-[#d6e0e7] px-2 py-2">
        <a
          href={downloadUrl}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#c92f68] px-3 text-xs font-bold text-white transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
        >
          <Download className="size-3.5" aria-hidden="true" />
          {downloadLabel}
        </a>
        <a
          href={resultUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#627181] transition hover:bg-[#fff1f5] hover:text-[#15202b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
        >
          <ExternalLink className="size-3.5" aria-hidden="true" />
          {openLabel}
        </a>
      </div>
      <p className="px-3 pb-3 text-[11px] leading-4 text-[#627181]">
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
      className={`group relative mb-[3px] inline-block w-full break-inside-avoid overflow-hidden bg-[#fff1f5] text-left align-top transition duration-300 outline-none focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#c92f68] ${
        isSelected ? 'ring-2 ring-[#c92f68] ring-inset' : ''
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
                className="size-3.5 text-[#c92f68]"
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
