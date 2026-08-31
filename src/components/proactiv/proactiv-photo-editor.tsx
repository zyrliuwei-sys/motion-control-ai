import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Download,
  ImagePlus,
  LoaderCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { apiGet, apiPost, apiUpload } from '@/lib/api-client';

export interface ProactivPhotoEditorCopy {
  addImagesLabel: string;
  completedLabel: string;
  description: string;
  downloadLabel: string;
  dropImagesLabel: string;
  editModeLabel: string;
  editingLabel: string;
  failedLabel: string;
  generatedFailedLabel: string;
  generateImageLabel: string;
  generateLabel: string;
  generatedReadyLabel: string;
  generatingImageLabel: string;
  generatingLabel: string;
  imageCountLabel: (values: { count: number }) => string;
  imagesRequiredMessage: string;
  openLabel: string;
  outputFormatLabel: string;
  outputLabel: string;
  outputPendingLabel: string;
  generatedOutputLabel: string;
  generatedOutputPendingLabel: string;
  promptLabel: string;
  promptPlaceholder: string;
  promptRequiredMessage: string;
  queuedLabel: string;
  removeImageLabel: string;
  signInLabel: string;
  signInRequiredMessage: string;
  sourceLabel: string;
  textDescription: string;
  textModeLabel: string;
  textOutputFormatLabel: string;
  textPromptLabel: string;
  textPromptPlaceholder: string;
  title: string;
}

type FalFlux2Task = {
  errorMessage?: string;
  id: string;
  model: string;
  progress: number;
  resultUrls: string[];
  status: string;
};

type GenerationMode = 'edit' | 'text';

type SavedTask = {
  id: string;
  mode: GenerationMode;
};

const FAL_TEXT_TO_IMAGE_MODEL = 'fal-ai/flux-2';

function apiBaseForMode(mode: GenerationMode) {
  return mode === 'text' ? '/api/fal/flux-2' : '/api/fal/flux-2-edit';
}

function taskMode(task: Pick<FalFlux2Task, 'model'>): GenerationMode {
  return task.model === FAL_TEXT_TO_IMAGE_MODEL ? 'text' : 'edit';
}

type LocalImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const imageSizes = [
  { value: 'square_hd', label: '1:1' },
  { value: 'portrait_4_3', label: '3:4' },
  { value: 'portrait_16_9', label: '9:16' },
  { value: 'landscape_4_3', label: '4:3' },
  { value: 'landscape_16_9', label: '16:9' },
] as const;

function isTerminalTask(status: string) {
  return ['success', 'failed', 'canceled'].includes(status);
}

function taskLabel(task: FalFlux2Task, copy: ProactivPhotoEditorCopy) {
  const isTextTask = taskMode(task) === 'text';

  switch (task.status) {
    case 'success':
      return isTextTask ? copy.generatedReadyLabel : copy.completedLabel;
    case 'failed':
    case 'canceled':
      return isTextTask ? copy.generatedFailedLabel : copy.failedLabel;
    case 'processing':
      return isTextTask ? copy.generatingImageLabel : copy.editingLabel;
    default:
      return copy.queuedLabel;
  }
}

/**
 * A focused FLUX.2 image editing surface. It uploads the user's references to
 * the configured public storage first, then sends only their URLs to Fal.
 */
export function ProactivPhotoEditor({
  copy,
  initialMode = 'text',
  initialPrompt = '',
}: {
  copy: ProactivPhotoEditorCopy;
  initialMode?: GenerationMode;
  initialPrompt?: string;
}) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<LocalImage[]>([]);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [mode, setMode] = useState<GenerationMode>(initialMode);
  const [imageSize, setImageSize] =
    useState<(typeof imageSizes)[number]['value']>('landscape_4_3');
  const [task, setTask] = useState<FalFlux2Task | null>(null);
  const [savedTask, setSavedTask] = useState<SavedTask | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(
    () => () => {
      imagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl)
      );
    },
    []
  );

  useEffect(() => {
    const saved = window.localStorage.getItem('fal-flux-2-last-task');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedTask;
        if (parsed.id && (parsed.mode === 'text' || parsed.mode === 'edit')) {
          setSavedTask(parsed);
          return;
        }
      } catch {
        // Fall through to the legacy edit-task entry.
      }
    }

    const legacyTaskId = window.localStorage.getItem(
      'fal-flux-2-edit-last-task'
    );
    if (legacyTaskId) setSavedTask({ id: legacyTaskId, mode: 'edit' });
  }, []);

  const activeTaskId = task?.id ?? savedTask?.id;
  const activeTaskMode = task ? taskMode(task) : (savedTask?.mode ?? mode);
  const activeTaskApiBase = apiBaseForMode(activeTaskMode);
  const saveTask = (nextTask: FalFlux2Task) => {
    const nextSavedTask = { id: nextTask.id, mode: taskMode(nextTask) };
    setTask(nextTask);
    setSavedTask(nextSavedTask);
    window.localStorage.setItem(
      'fal-flux-2-last-task',
      JSON.stringify(nextSavedTask)
    );
  };
  const downloadUrl = (nextTask: FalFlux2Task, index: number) =>
    `${apiBaseForMode(taskMode(nextTask))}?taskId=${encodeURIComponent(nextTask.id)}&download=1&index=${index}`;
  const taskQuery = useQuery({
    queryKey: ['fal-flux-2-image', activeTaskApiBase, activeTaskId],
    queryFn: () =>
      apiGet<FalFlux2Task>(
        `${activeTaskApiBase}?taskId=${encodeURIComponent(activeTaskId!)}`
      ),
    enabled: Boolean(activeTaskId && session?.user),
    refetchInterval: (query) =>
      isTerminalTask(query.state.data?.status ?? task?.status ?? '')
        ? false
        : 3_000,
  });

  useEffect(() => {
    if (!taskQuery.data) return;
    saveTask(taskQuery.data);
  }, [taskQuery.data]);

  useEffect(() => {
    if (taskQuery.data?.status !== 'success') return;
    void queryClient.invalidateQueries({ queryKey: ['fal-image-history'] });
  }, [queryClient, taskQuery.data?.id, taskQuery.data?.status]);

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user) throw new Error(copy.signInRequiredMessage);
      if (!prompt.trim()) throw new Error(copy.promptRequiredMessage);
      if (mode === 'text') {
        return apiPost<FalFlux2Task>('/api/fal/flux-2', {
          prompt: prompt.trim(),
          imageSize,
          outputFormat: 'png',
        });
      }
      if (!images.length) throw new Error(copy.imagesRequiredMessage);

      const formData = new FormData();
      images.forEach((image) => {
        formData.append('files', image.file, image.file.name);
      });
      const uploaded = await apiUpload<{ images: string[] }>(
        '/api/storage/upload-media',
        formData
      );
      if (!uploaded.images.length) throw new Error(copy.imagesRequiredMessage);

      return apiPost<FalFlux2Task>('/api/fal/flux-2-edit', {
        prompt: prompt.trim(),
        imageUrls: uploaded.images.slice(0, 4),
        imageSize,
        outputFormat: 'png',
      });
    },
    onSuccess: (nextTask) => {
      saveTask(nextTask);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addFiles = (fileList: FileList | File[]) => {
    const candidates = Array.from(fileList).filter((file) =>
      file.type.startsWith('image/')
    );
    const available = Math.max(0, 4 - images.length);
    const accepted = candidates.slice(0, available);
    if (!accepted.length) return;

    setImages((current) => [
      ...current,
      ...accepted.map((file, index) => ({
        file,
        id: `${Date.now()}-${index}-${file.name}`,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const removeImage = (id: string) => {
    setImages((current) => {
      const removed = current.find((image) => image.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((image) => image.id !== id);
    });
  };

  const isWorking =
    editMutation.isPending || Boolean(task && !isTerminalTask(task.status));
  const hasOutput = Boolean(task?.resultUrls.length);
  const submitBlocker = !session?.user
    ? copy.signInRequiredMessage
    : mode === 'edit' && !images.length
      ? copy.imagesRequiredMessage
      : !prompt.trim()
        ? copy.promptRequiredMessage
        : null;
  const canSubmit = !isWorking && !submitBlocker;
  const outputLabel =
    mode === 'text' ? copy.generatedOutputLabel : copy.outputLabel;
  const outputPendingLabel =
    mode === 'text'
      ? copy.generatedOutputPendingLabel
      : copy.outputPendingLabel;

  return (
    <section className="relative min-h-[calc(100dvh-3rem)] overflow-hidden bg-[#f5f8fb] px-3 py-4 text-[#15202b] sm:px-5 sm:py-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(201,47,104,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(21,32,43,0.035)_1px,transparent_1px)] [background-size:28px_28px] opacity-55"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-[-16rem] left-[28%] size-[40rem] rounded-full bg-[#ef78a4]/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[1240px]">
        <header className="mb-4 flex flex-col justify-between gap-3 sm:mb-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-[#c92f68] uppercase">
              <Sparkles className="size-3.5" aria-hidden="true" />
              FLUX.2 [dev]
            </div>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">
              {copy.title}
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[#627181]">
              {mode === 'text' ? copy.textDescription : copy.description}
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ead7df] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#627181] shadow-sm backdrop-blur">
            <span className="size-1.5 rounded-full bg-[#c92f68]" />
            {mode === 'text'
              ? copy.textOutputFormatLabel
              : copy.outputFormatLabel}
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
          <div className="overflow-hidden rounded-[28px] border border-[#d6e0e7] bg-white/90 p-2 shadow-[0_22px_50px_rgba(21,32,43,0.1)] backdrop-blur-xl">
            <div className="rounded-[21px] bg-[#fff8fa] p-4 sm:p-5">
              <div className="mb-5 inline-flex rounded-xl border border-[#ead7df] bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setMode('text')}
                  aria-pressed={mode === 'text'}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    mode === 'text'
                      ? 'bg-[#c92f68] text-white shadow-sm'
                      : 'text-[#627181] hover:bg-[#fff0f5] hover:text-[#8f2348]'
                  }`}
                >
                  {copy.textModeLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  aria-pressed={mode === 'edit'}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    mode === 'edit'
                      ? 'bg-[#c92f68] text-white shadow-sm'
                      : 'text-[#627181] hover:bg-[#fff0f5] hover:text-[#8f2348]'
                  }`}
                >
                  {copy.editModeLabel}
                </button>
              </div>

              {mode === 'edit' ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold tracking-[-0.02em] text-[#15202b]">
                      {copy.sourceLabel}
                    </h2>
                    <span className="rounded-full bg-[#fff0f5] px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-[#8f2348] uppercase">
                      {copy.imageCountLabel({ count: images.length })}
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      if (event.target.files) addFiles(event.target.files);
                      event.target.value = '';
                    }}
                  />

                  <div
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={(event) => {
                      if (event.currentTarget === event.target)
                        setIsDragging(false);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setIsDragging(false);
                      addFiles(event.dataTransfer.files);
                    }}
                    className={`mt-3 grid min-h-44 grid-cols-2 gap-2 rounded-[18px] border border-dashed p-2.5 transition-colors sm:grid-cols-4 ${
                      isDragging
                        ? 'border-[#c92f68] bg-[#fff0f5]'
                        : 'border-[#efbed0] bg-white/75'
                    }`}
                  >
                    {images.map((image) => (
                      <figure
                        key={image.id}
                        className="group/image relative min-h-28 overflow-hidden rounded-xl border border-[#ead7df] bg-[#fff1f5]"
                      >
                        <img
                          src={image.previewUrl}
                          alt=""
                          className="absolute inset-0 size-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pt-6 pb-1.5">
                          <figcaption className="truncate text-[10px] font-medium text-white">
                            {image.file.name}
                          </figcaption>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full border border-white/40 bg-black/45 text-white opacity-0 backdrop-blur transition group-hover/image:opacity-100 hover:bg-[#c92f68] focus:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
                          aria-label={`${copy.removeImageLabel}: ${image.file.name}`}
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </button>
                      </figure>
                    ))}
                    {images.length < 4 ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="group/add flex min-h-28 flex-col items-center justify-center rounded-xl border border-[#ead7df] bg-[#fffafd] px-2 text-center text-[#627181] transition hover:border-[#efb0c4] hover:bg-[#fff0f5] hover:text-[#8f2348] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
                      >
                        <span className="grid size-8 place-items-center rounded-full bg-[#fde3ec] text-[#c92f68] transition-transform group-hover/add:scale-110">
                          <ImagePlus className="size-4" aria-hidden="true" />
                        </span>
                        <span className="mt-2 text-[11px] font-bold">
                          {copy.addImagesLabel}
                        </span>
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[11px] text-[#71808d]">
                    {copy.dropImagesLabel}
                  </p>
                  {!images.length ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#fff0f5] px-2.5 py-1.5 text-[11px] font-semibold text-[#8f2348]">
                      <ImagePlus className="size-3.5" aria-hidden="true" />
                      {copy.imagesRequiredMessage}
                    </p>
                  ) : null}
                </>
              ) : null}

              <label className={mode === 'edit' ? 'mt-5 block' : 'block'}>
                <span className="text-xs font-bold text-[#15202b]">
                  {mode === 'text' ? copy.textPromptLabel : copy.promptLabel}
                </span>
                <textarea
                  value={prompt}
                  rows={5}
                  maxLength={2500}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={
                    mode === 'text'
                      ? copy.textPromptPlaceholder
                      : copy.promptPlaceholder
                  }
                  className="mt-2 block w-full resize-y rounded-2xl border border-[#ead7df] bg-white px-3.5 py-3 text-sm leading-6 text-[#15202b] transition outline-none placeholder:text-[#8a9aa6] focus:border-[#c92f68] focus:ring-4 focus:ring-[#c92f68]/10"
                />
              </label>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#edd4de] pt-4">
                <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-[inset_0_0_0_1px_#ead7df]">
                  {imageSizes.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setImageSize(option.value)}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold tabular-nums transition ${
                        imageSize === option.value
                          ? 'bg-[#c92f68] text-white shadow-sm'
                          : 'text-[#627181] hover:bg-[#fff0f5] hover:text-[#8f2348]'
                      }`}
                      aria-pressed={imageSize === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    editMutation.mutate();
                  }}
                  disabled={!canSubmit}
                  aria-describedby={
                    submitBlocker ? 'photo-editor-prerequisite' : undefined
                  }
                  title={submitBlocker ?? undefined}
                  className="group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#c92f68] px-5 text-sm font-bold text-white shadow-[inset_0_-3px_0_#9f1f50,0_10px_22px_rgba(201,47,104,0.24)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                >
                  {isWorking ? (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Sparkles className="size-4" aria-hidden="true" />
                  )}
                  {isWorking
                    ? mode === 'text'
                      ? copy.generatingImageLabel
                      : copy.generatingLabel
                    : mode === 'text'
                      ? copy.generateImageLabel
                      : copy.generateLabel}
                </button>
              </div>
              {submitBlocker ? (
                <p
                  id="photo-editor-prerequisite"
                  className="mt-3 text-xs text-[#71808d]"
                  aria-live="polite"
                >
                  {!session?.user ? (
                    <>{copy.signInRequiredMessage} </>
                  ) : (
                    submitBlocker
                  )}
                  {!session?.user ? (
                    <Link
                      href="/sign-in"
                      className="font-bold text-[#c92f68] underline decoration-[#efb0c4] underline-offset-2 hover:text-[#8f2348]"
                    >
                      {copy.signInLabel}
                    </Link>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[28px] border border-[#d6e0e7] bg-[#15202b] p-2 shadow-[0_22px_50px_rgba(21,32,43,0.16)]">
            <div
              className="pointer-events-none absolute -top-16 -right-12 size-52 rounded-full bg-[#c92f68]/35 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex min-h-[532px] flex-col rounded-[21px] border border-white/10 bg-[#1d2b38] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-white">{outputLabel}</h2>
                {task ? (
                  <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-[#f9c0d4] uppercase">
                    {taskLabel(task, copy)}
                  </span>
                ) : null}
              </div>

              {task ? (
                <div className="mt-5 flex flex-1 flex-col">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-[#c92f68] text-white shadow-[0_0_0_6px_rgba(201,47,104,0.16)]">
                      {isTerminalTask(task.status) ? (
                        <Sparkles className="size-4" aria-hidden="true" />
                      ) : (
                        <LoaderCircle
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {taskLabel(task, copy)}
                      </p>
                      <p className="mt-0.5 text-xs text-[#b7c4cc] tabular-nums">
                        {task.progress}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        task.status === 'failed' || task.status === 'canceled'
                          ? 'bg-[#e88989]'
                          : 'bg-[#ef78a4]'
                      }`}
                      style={{ width: `${Math.max(4, task.progress)}%` }}
                    />
                  </div>
                  {task.errorMessage ? (
                    <p className="mt-4 rounded-xl border border-[#ef8d9e]/30 bg-[#ef5350]/10 p-3 text-xs leading-5 text-[#ffd4dc]">
                      {task.errorMessage}
                    </p>
                  ) : null}

                  {hasOutput ? (
                    <div className="mt-5 grid flex-1 content-start gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {task.resultUrls.map((resultUrl, index) => (
                        <figure
                          key={resultUrl}
                          className="overflow-hidden rounded-2xl border border-white/10 bg-black/15"
                        >
                          <img
                            src={resultUrl}
                            alt={`${outputLabel} ${index + 1}`}
                            className="aspect-square w-full object-cover"
                          />
                          <figcaption className="flex items-center justify-between gap-2 px-2 py-2">
                            <a
                              href={downloadUrl(task, index)}
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-[#c92f68] px-2 text-[11px] font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef78a4]"
                            >
                              <Download className="size-3" aria-hidden="true" />
                              {copy.downloadLabel}
                            </a>
                            <a
                              href={resultUrl}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={copy.openLabel}
                              className="grid size-8 place-items-center rounded-lg text-[#d8e0e5] transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef78a4]"
                            >
                              <ArrowUpRight
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            </a>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  ) : (
                    <OutputPlaceholder
                      pendingLabel={outputPendingLabel}
                      isWorking={isWorking}
                    />
                  )}
                </div>
              ) : (
                <OutputPlaceholder
                  pendingLabel={outputPendingLabel}
                  isWorking={isWorking}
                />
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function OutputPlaceholder({
  pendingLabel,
  isWorking,
}: {
  pendingLabel: string;
  isWorking: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="relative grid size-20 place-items-center rounded-[28px] border border-dashed border-white/20 bg-white/[0.04]">
        <span className="absolute inset-3 rounded-[18px] border border-[#ef78a4]/30" />
        {isWorking ? (
          <LoaderCircle
            className="relative size-6 animate-spin text-[#ef78a4]"
            aria-hidden="true"
          />
        ) : (
          <Sparkles
            className="relative size-6 text-[#ef78a4]"
            aria-hidden="true"
          />
        )}
      </div>
      <p className="mt-5 max-w-56 text-sm leading-6 text-[#c4d0d7]">
        {pendingLabel}
      </p>
    </div>
  );
}
