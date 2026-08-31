import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  ChevronDown,
  Clock3,
  ImagePlus,
  Sparkles,
  X,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ProactivHeroComposerLabels {
  addReference: string;
  aspectRatio: string;
  avatar: string;
  duration: string;
  durationLoading: string;
  durationPending: string;
  durationUnavailable: string;
  durationUnsupported: string;
  generate: string;
  generated: string;
  image: string;
  imageModel: string;
  model: string;
  placeholder: string;
  product: string;
  removeAttachment: string;
  textModel: string;
  video: string;
  videoModel: string;
}

export interface ProactivGenerationReference {
  file: File;
  id: string;
  name: string;
  slot?: 'avatar' | 'product';
  type: 'image' | 'video';
}

export interface ProactivGenerationValues {
  aspectRatio: string;
  batchSize: number;
  mode: 'edit' | 'text' | 'video';
  prompt: string;
  references: ProactivGenerationReference[];
  style: string;
}

export interface ProactivHeroComposerProps {
  allowImageMode?: boolean;
  allowTextToImageMode?: boolean;
  allowVideoMode?: boolean;
  compactAction?: boolean;
  isGenerating?: boolean;
  labels: ProactivHeroComposerLabels;
  onPromptChange?: (prompt: string) => void;
  onGenerate?: (values: ProactivGenerationValues) => void;
  promptValue?: string;
  requireReferences?: boolean;
  showReferenceControls?: boolean;
}

const aspectRatioOptions = [
  { value: '21:9', previewClassName: 'h-2 w-7' },
  { value: '16:9', previewClassName: 'h-2.5 w-6' },
  { value: '4:3', previewClassName: 'h-3.5 w-5' },
  { value: '1:1', previewClassName: 'size-4.5' },
  { value: '3:4', previewClassName: 'h-5 w-4' },
  { value: '9:16', previewClassName: 'h-5.5 w-3' },
  { value: 'adaptive', previewClassName: 'size-5' },
] as const;
const defaultAspectRatio = '9:16';
const maximumImageReferenceCount = 10;
const minimumMotionVideoDuration = 3;
const maximumMotionVideoDuration = 10;
type ReferenceSlot = 'avatar' | 'product' | null;
type MotionVideoDurationState = 'idle' | 'loading' | 'ready' | 'unavailable';
type ReferenceAttachment = {
  file: File;
  id: string;
  name: string;
  previewUrl: string;
  slot?: Exclude<ReferenceSlot, null>;
  type: 'image' | 'video';
};

function formatDuration(seconds: number) {
  const rounded = Math.round(seconds * 10) / 10;
  return `${rounded}s`;
}

/** A compact landing composer that can expose only the models currently available. */
export function ProactivHeroComposer({
  allowImageMode = true,
  allowTextToImageMode = true,
  allowVideoMode = true,
  compactAction = false,
  isGenerating = false,
  labels,
  onPromptChange,
  onGenerate,
  promptValue,
  requireReferences = true,
  showReferenceControls = true,
}: ProactivHeroComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'edit' | 'text' | 'video'>(
    allowTextToImageMode ? 'text' : allowVideoMode ? 'video' : 'edit'
  );
  const [uncontrolledPrompt, setUncontrolledPrompt] = useState('');
  const style = 'Closeup';
  const [aspectRatio, setAspectRatio] = useState(defaultAspectRatio);
  const batchSize = 1;
  const [references, setReferences] = useState<ReferenceAttachment[]>([]);
  const [referenceSlot, setReferenceSlot] = useState<ReferenceSlot>(null);
  const [hasRequestedGeneration, setHasRequestedGeneration] = useState(false);
  const [motionVideoDuration, setMotionVideoDuration] = useState<number | null>(
    null
  );
  const [motionVideoDurationState, setMotionVideoDurationState] =
    useState<MotionVideoDurationState>('idle');
  const referencesRef = useRef<ReferenceAttachment[]>([]);
  const motionVideo = references.find(
    (reference) => reference.slot === 'product' && reference.type === 'video'
  );
  const avatarImage = references.find(
    (reference) => reference.slot === 'avatar' && reference.type === 'image'
  );
  const prompt = promptValue ?? uncontrolledPrompt;
  const imageReferences = references.filter(
    (reference) => reference.type === 'image'
  );
  const hasReachedImageReferenceLimit =
    mode === 'edit' && imageReferences.length >= maximumImageReferenceCount;
  const hasRequiredReferences =
    mode === 'edit'
      ? prompt.trim().length > 0 && imageReferences.length > 0
      : mode === 'text'
        ? prompt.trim().length > 0
        : Boolean(avatarImage && motionVideo);
  const isReady = requireReferences
    ? hasRequiredReferences
    : prompt.trim().length > 0;
  const isMotionVideoDurationUnsupported =
    motionVideoDurationState === 'ready' &&
    motionVideoDuration !== null &&
    (motionVideoDuration < minimumMotionVideoDuration ||
      motionVideoDuration > maximumMotionVideoDuration);
  const canGenerate =
    isReady && (mode !== 'video' || !isMotionVideoDurationUnsupported);
  const hasMultipleModels =
    Number(allowTextToImageMode) +
      Number(allowImageMode) +
      Number(allowVideoMode) >
    1;

  const durationText =
    motionVideoDurationState === 'loading'
      ? labels.durationLoading
      : motionVideoDurationState === 'unavailable'
        ? labels.durationUnavailable
        : motionVideoDuration === null
          ? labels.durationPending
          : formatDuration(motionVideoDuration);
  const durationHelp = isMotionVideoDurationUnsupported
    ? labels.durationUnsupported
    : undefined;

  const updatePrompt = (nextPrompt: string) => {
    if (promptValue === undefined) {
      setUncontrolledPrompt(nextPrompt);
    }
    onPromptChange?.(nextPrompt);
  };

  useEffect(() => {
    referencesRef.current = references;
  }, [references]);

  useEffect(
    () => () => {
      referencesRef.current.forEach((reference) => {
        URL.revokeObjectURL(reference.previewUrl);
      });
    },
    []
  );

  useEffect(() => {
    if (!motionVideo) {
      setMotionVideoDuration(null);
      setMotionVideoDurationState('idle');
      return;
    }

    let cancelled = false;
    const video = document.createElement('video');
    video.preload = 'metadata';
    setMotionVideoDuration(null);
    setMotionVideoDurationState('loading');

    video.onloadedmetadata = () => {
      if (cancelled) return;
      if (Number.isFinite(video.duration) && video.duration > 0) {
        setMotionVideoDuration(video.duration);
        setMotionVideoDurationState('ready');
      } else {
        setMotionVideoDurationState('unavailable');
      }
    };
    video.onerror = () => {
      if (!cancelled) setMotionVideoDurationState('unavailable');
    };
    video.src = motionVideo.previewUrl;

    return () => {
      cancelled = true;
      video.removeAttribute('src');
      video.load();
    };
  }, [motionVideo?.id, motionVideo?.previewUrl]);

  const updateMode = (nextMode: 'edit' | 'text' | 'video') => {
    if (nextMode === 'edit' && !allowImageMode) return;
    if (nextMode === 'text' && !allowTextToImageMode) return;
    if (nextMode === 'video' && !allowVideoMode) return;
    setMode(nextMode);
    if (nextMode === 'edit') {
      setReferences((current) => {
        current
          .filter((reference) => reference.type === 'video')
          .forEach((reference) => URL.revokeObjectURL(reference.previewUrl));
        return current.filter((reference) => reference.type === 'image');
      });
    }
    if (nextMode === 'text') {
      setReferences((current) => {
        current.forEach((reference) =>
          URL.revokeObjectURL(reference.previewUrl)
        );
        return [];
      });
      setReferenceSlot(null);
    }
    setHasRequestedGeneration(false);
  };

  useEffect(() => {
    if (allowVideoMode || mode !== 'video') return;

    setMode(allowTextToImageMode ? 'text' : 'edit');
    setReferences((current) => {
      current
        .filter((reference) => reference.type === 'video')
        .forEach((reference) => URL.revokeObjectURL(reference.previewUrl));
      return current.filter((reference) => reference.type === 'image');
    });
    setHasRequestedGeneration(false);
  }, [allowTextToImageMode, allowVideoMode, mode]);

  const openFilePicker = (slot: ReferenceSlot = null) => {
    setReferenceSlot(slot);
    window.requestAnimationFrame(() => fileInputRef.current?.click());
  };

  const acceptedFileTypes =
    mode === 'text' || mode === 'edit' || referenceSlot === 'avatar'
      ? 'image/*'
      : referenceSlot === 'product'
        ? 'video/*'
        : 'image/*,video/*';

  const removeReference = (id: string) => {
    setReferences((current) => {
      const removed = current.find((reference) => reference.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);

      return current.filter((reference) => reference.id !== id);
    });
    setHasRequestedGeneration(false);
  };

  const addUploadedReferences = (files: FileList | null) => {
    if (!files?.length) return;

    // Adding an image from the text-to-image composer turns the request into
    // an image-edit task, so the attachment is used rather than discarded.
    const uploadMode = mode === 'text' ? 'edit' : mode;
    const expectedType =
      uploadMode === 'edit' || referenceSlot === 'avatar'
        ? 'image'
        : referenceSlot === 'product'
          ? 'video'
          : null;
    const uploaded = Array.from(files)
      .filter((file) =>
        expectedType === 'image'
          ? file.type.startsWith('image/')
          : expectedType === 'video'
            ? file.type.startsWith('video/')
            : file.type.startsWith('image/') || file.type.startsWith('video/')
      )
      .map(
        (file, index): ReferenceAttachment => ({
          id: `${Date.now()}-${index}-${file.name}`,
          file,
          name: file.name,
          previewUrl: URL.createObjectURL(file),
          slot: referenceSlot ?? undefined,
          type: file.type.startsWith('video/') ? 'video' : 'image',
        })
      )
      .slice(0, referenceSlot ? 1 : undefined);

    if (!uploaded.length) return;

    if (mode === 'text') setMode('edit');

    setReferences((current) => {
      const retained = current.filter((reference) => {
        if (!referenceSlot || reference.slot !== referenceSlot) return true;
        URL.revokeObjectURL(reference.previewUrl);
        return false;
      });
      let assigned = uploaded;
      if (!referenceSlot && uploadMode === 'video') {
        let hasAvatar = retained.some(
          (reference) =>
            reference.slot === 'avatar' && reference.type === 'image'
        );
        let hasMotionVideo = retained.some(
          (reference) =>
            reference.slot === 'product' && reference.type === 'video'
        );
        assigned = uploaded.map((reference) => {
          if (reference.type === 'image' && !hasAvatar) {
            hasAvatar = true;
            return { ...reference, slot: 'avatar' };
          }
          if (reference.type === 'video' && !hasMotionVideo) {
            hasMotionVideo = true;
            return { ...reference, slot: 'product' };
          }
          return reference;
        });
      }
      const availableImageSlots = Math.max(
        0,
        maximumImageReferenceCount -
          retained.filter((reference) => reference.type === 'image').length
      );
      const accepted =
        uploadMode === 'edit'
          ? assigned
              .filter((reference) => reference.type === 'image')
              .slice(0, availableImageSlots)
          : assigned;
      return [...retained, ...accepted];
    });
    setReferenceSlot(null);
    setHasRequestedGeneration(false);
  };

  const requestGeneration = () => {
    if (!canGenerate || isGenerating) return;

    setHasRequestedGeneration(true);
    onGenerate?.({
      mode,
      prompt,
      references: references.map(
        ({ file, id, name, slot, type }): ProactivGenerationReference => ({
          file,
          id,
          name,
          slot,
          type,
        })
      ),
      style,
      aspectRatio,
      batchSize,
    });
  };

  return (
    <section
      aria-label={labels.model}
      className={`mx-auto w-full text-[#15202b] ${
        compactAction ? 'max-w-[860px]' : 'max-w-[1088px]'
      }`}
    >
      <div className="flex w-full items-end gap-2">
        <div
          className={`min-w-0 flex-1 border border-[#ead7df] bg-[#fff8fa] shadow-[0_12px_30px_rgba(66,20,37,0.09)] ${
            compactAction ? 'rounded-[28px] p-1' : 'rounded-[28px] p-1'
          }`}
        >
          <div
            className={`bg-[#fff1f5] ${
              compactAction
                ? 'min-h-[84px] rounded-[20px] p-2.5 sm:p-3'
                : 'min-h-[104px] rounded-[22px] p-3'
            }`}
          >
            <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row">
              <div className="flex min-h-20 min-w-0 flex-1 flex-col">
                <label className="sr-only" htmlFor="hero-marketing-prompt">
                  {labels.placeholder}
                </label>
                <div
                  className={`relative flex w-full flex-1 flex-col px-1 ${
                    compactAction ? 'min-h-12' : 'min-h-12'
                  }`}
                >
                  {showReferenceControls ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={acceptedFileTypes}
                        className="sr-only"
                        onChange={(event) => {
                          addUploadedReferences(event.target.files);
                          event.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        disabled={hasReachedImageReferenceLimit}
                        onClick={() => openFilePicker()}
                        className={`absolute left-2 z-10 inline-flex shrink-0 items-center justify-center rounded-xl border shadow-[0_5px_14px_rgba(66,20,37,0.1)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68] disabled:cursor-not-allowed disabled:opacity-45 ${
                          // Match the thumbnail row's py-1 so both edges (and
                          // badges) sit flush once references are attached.
                          references.length ? 'top-1' : 'top-0'
                        } ${
                          references.length
                            ? 'border-[#efb0c4] bg-[#fde3ec] text-[#c92f68] hover:bg-[#f9ccd9]'
                            : 'border-[#efbed0] bg-white text-[#c92f68] hover:bg-[#fff5f8] hover:text-[#a62150]'
                        } ${compactAction ? 'size-10' : 'size-12'}`}
                        aria-label={labels.addReference}
                        title={
                          references.length
                            ? `${labels.addReference} (${imageReferences.length}/${maximumImageReferenceCount})`
                            : labels.addReference
                        }
                      >
                        <ImagePlus
                          className={compactAction ? 'size-4.5' : 'size-5'}
                          aria-hidden="true"
                        />
                        {references.length ? (
                          <span className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-[#c92f68] text-[9px] font-bold text-white shadow-sm">
                            {references.length}
                          </span>
                        ) : null}
                      </button>
                    </>
                  ) : null}
                  {references.length ? (
                    <div
                      className={`flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                        compactAction ? 'min-h-10 pl-12' : 'min-h-12 pl-14'
                      }`}
                    >
                      {references.map((reference) => (
                        <AttachmentPreview
                          key={reference.id}
                          attachment={reference}
                          compact={compactAction}
                          removeLabel={labels.removeAttachment}
                          onRemove={() => removeReference(reference.id)}
                        />
                      ))}
                    </div>
                  ) : null}
                  <textarea
                    id="hero-marketing-prompt"
                    rows={references.length ? 1 : 2}
                    value={prompt}
                    onChange={(event) => {
                      updatePrompt(event.target.value);
                      setHasRequestedGeneration(false);
                    }}
                    placeholder={labels.placeholder}
                    className={`block w-full flex-1 resize-none bg-transparent py-1 pr-1 pl-14 text-[#15202b] outline-none placeholder:text-[#7b8995] ${
                      compactAction
                        ? 'min-h-10 text-sm leading-5 sm:text-base'
                        : 'min-h-24 text-sm leading-5'
                    } ${references.length ? 'mt-2' : ''}`}
                  />
                </div>

                <div className="mt-2.5 flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {hasMultipleModels ? (
                    <label className="inline-flex h-7 shrink-0 items-center rounded-lg bg-[#fff5f8] px-2 text-xs font-medium text-[#4b5b68] transition-colors hover:bg-[#fde3ec]">
                      <span className="sr-only">{labels.model}</span>
                      <select
                        value={mode}
                        onChange={(event) =>
                          updateMode(
                            event.target.value as 'edit' | 'text' | 'video'
                          )
                        }
                        aria-label={labels.model}
                        className="max-w-32 bg-transparent text-xs text-[#15202b] outline-none"
                      >
                        {allowTextToImageMode ? (
                          <option
                            value="text"
                            className="bg-white text-[#15202b]"
                          >
                            {labels.textModel}
                          </option>
                        ) : null}
                        {allowImageMode ? (
                          <option
                            value="edit"
                            className="bg-white text-[#15202b]"
                          >
                            {labels.imageModel}
                          </option>
                        ) : null}
                        {allowVideoMode ? (
                          <option
                            value="video"
                            className="bg-white text-[#15202b]"
                          >
                            {labels.videoModel}
                          </option>
                        ) : null}
                      </select>
                    </label>
                  ) : (
                    <span
                      className="inline-flex h-7 shrink-0 items-center rounded-lg bg-[#fff5f8] px-2 text-xs font-medium text-[#4b5b68]"
                      aria-label={labels.model}
                    >
                      {allowTextToImageMode
                        ? labels.textModel
                        : allowImageMode
                          ? labels.imageModel
                          : labels.videoModel}
                    </span>
                  )}

                  {mode !== 'video' ? (
                    <AspectRatioPicker
                      label={labels.aspectRatio}
                      value={aspectRatio}
                      onChange={(nextRatio) => {
                        setAspectRatio(nextRatio);
                        setHasRequestedGeneration(false);
                      }}
                    />
                  ) : null}

                  {mode === 'video' ? (
                    <span
                      aria-label={`${labels.duration}: ${durationText}${
                        durationHelp ? `. ${durationHelp}` : ''
                      }`}
                      aria-live="polite"
                      className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium tabular-nums transition-colors ${
                        isMotionVideoDurationUnsupported
                          ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                          : motionVideoDurationState === 'ready'
                            ? 'bg-[#fde3ec] text-[#c92f68]'
                            : 'bg-[#fff5f8] text-[#627181]'
                      }`}
                      title={durationHelp}
                    >
                      <Clock3 className="size-3.5" aria-hidden="true" />
                      <span>{durationText}</span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div
                className={`flex shrink-0 items-stretch gap-1.5 self-end ${
                  compactAction || mode === 'text'
                    ? 'mr-1 ml-auto size-14 self-center sm:mr-2'
                    : 'h-14 sm:w-[232px]'
                }`}
              >
                <button
                  type="button"
                  disabled={!canGenerate || isGenerating}
                  onClick={requestGeneration}
                  aria-label={
                    hasRequestedGeneration ? labels.generated : labels.generate
                  }
                  title={
                    hasRequestedGeneration ? labels.generated : labels.generate
                  }
                  className={`group relative overflow-hidden px-4 text-xs font-bold tracking-wide text-white uppercase transition-[filter,transform] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                    compactAction || mode === 'text'
                      ? 'size-full flex-none rounded-[18px] border border-white/65 bg-[#c92f68] p-0 shadow-[inset_0_-4px_0_#9f1f50,0_8px_18px_rgba(201,47,104,0.32)]'
                      : 'min-w-[112px] flex-1 rounded-xl bg-[#c92f68] shadow-[inset_0_-3px_0_#9f1f50,0_8px_18px_rgba(201,47,104,0.2)]'
                  }`}
                >
                  <span className="absolute -right-5 -bottom-8 size-24 rounded-full bg-white/20 blur-2xl transition-transform duration-300 group-hover:scale-125" />
                  <span
                    className={`relative flex items-center justify-center ${
                      compactAction || mode === 'text'
                        ? 'h-full'
                        : 'h-full flex-col gap-1'
                    }`}
                  >
                    {compactAction || mode === 'text' ? (
                      <>
                        <ArrowUp
                          className="size-6 stroke-[2.5]"
                          aria-hidden="true"
                        />
                        <span className="sr-only">
                          {hasRequestedGeneration
                            ? labels.generated
                            : labels.generate}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" aria-hidden="true" />
                        <span>
                          {hasRequestedGeneration
                            ? labels.generated
                            : labels.generate}
                        </span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AspectRatioPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedOption =
    aspectRatioOptions.find((option) => option.value === value) ??
    aspectRatioOptions[5];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-[#fff1f5] px-2 text-xs font-medium text-[#4b5b68] transition-colors hover:bg-[#fde3ec] hover:text-[#15202b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
      >
        <span
          className={`block rounded-[3px] border border-current ${selectedOption.previewClassName}`}
          aria-hidden="true"
        />
        <span>{value}</span>
        <ChevronDown className="size-3.5 text-[#627181]" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={10}
        className="w-[292px] min-w-[292px] rounded-xl border border-[#ead7df] bg-[#fffafd] p-1.5 text-[#15202b] shadow-[0_18px_48px_rgba(66,20,37,0.16)]"
      >
        <p className="px-2.5 pt-1.5 pb-2 text-[10px] font-semibold tracking-[0.16em] text-[#627181] uppercase">
          {label}
        </p>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onChange(String(nextValue))}
          className="grid grid-cols-2 gap-1"
        >
          {aspectRatioOptions.map((option) => {
            const selected = value === option.value;
            return (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                label={option.value}
                closeOnClick
                className="group/ratio flex h-11 items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-[#627181] transition-[background-color,border-color,color] duration-150 hover:border-[#efbed0] hover:bg-[#fff7fa] hover:text-[#15202b] focus:border-[#efb0c4] focus:bg-[#fff1f5] focus:text-[#15202b] data-checked:border-[#efb0c4] data-checked:bg-[#fff0f5] data-checked:text-[#8f2348] [&_[data-slot=dropdown-menu-radio-item-indicator]]:right-2 [&_[data-slot=dropdown-menu-radio-item-indicator]]:text-[#c92f68]"
              >
                <span
                  className={`block shrink-0 rounded-[2px] border-[1.5px] transition-colors ${option.previewClassName} ${
                    selected
                      ? 'border-[#c92f68] text-[#c92f68]'
                      : 'border-[#8ba0ac] text-[#8ba0ac] group-hover/ratio:border-[#c92f68] group-hover/ratio:text-[#c92f68]'
                  }`}
                  aria-hidden="true"
                />
                <span className="tabular-nums">{option.value}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AttachmentPreview({
  attachment,
  compact = false,
  onRemove,
  removeLabel,
}: {
  attachment: ReferenceAttachment;
  compact?: boolean;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <figure
      className={`group/attachment relative shrink-0 overflow-visible rounded-lg border border-[#e8cbd5] bg-[#fffafd] shadow-[0_6px_16px_rgba(66,20,37,0.12)] ${
        compact ? 'size-10' : 'size-12'
      }`}
    >
      {attachment.type === 'video' ? (
        <video
          src={attachment.previewUrl}
          muted
          playsInline
          className="size-full rounded-[7px] object-cover"
        />
      ) : (
        <img
          src={attachment.previewUrl}
          alt={attachment.name}
          className="size-full rounded-[7px] object-cover"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${removeLabel}: ${attachment.name}`}
        className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full border border-[#e8cbd5] bg-white text-[#627181] shadow-[0_2px_8px_rgba(21,32,43,0.16)] transition-colors hover:bg-[#ef5350] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c92f68]"
      >
        <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
      </button>
      <figcaption className="sr-only">{attachment.name}</figcaption>
    </figure>
  );
}
