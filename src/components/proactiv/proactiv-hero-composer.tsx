import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Check,
  ChevronDown,
  Image,
  ImagePlus,
  Minus,
  Plus,
  Sparkles,
  UserRound,
  Video,
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
  batch: string;
  generate: string;
  generated: string;
  image: string;
  model: string;
  placeholder: string;
  product: string;
  removeAttachment: string;
  style: string;
  video: string;
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
  mode: 'image' | 'video';
  prompt: string;
  references: ProactivGenerationReference[];
  style: string;
}

export interface ProactivHeroComposerProps {
  isGenerating?: boolean;
  labels: ProactivHeroComposerLabels;
  onPromptChange?: (prompt: string) => void;
  onGenerate?: (values: ProactivGenerationValues) => void;
  promptValue?: string;
}

const styles = ['Closeup', 'Cinematic', 'Editorial'];
const aspectRatioOptions = [
  { value: '21:9', previewClassName: 'h-3 w-10' },
  { value: '16:9', previewClassName: 'h-4 w-9' },
  { value: '4:3', previewClassName: 'h-6 w-8' },
  { value: '1:1', previewClassName: 'size-7' },
  { value: '3:4', previewClassName: 'h-8 w-6' },
  { value: '9:16', previewClassName: 'h-10 w-[22px]' },
  { value: 'adaptive', previewClassName: 'size-8' },
] as const;
const defaultAspectRatio = '9:16';
type ReferenceSlot = 'avatar' | 'product' | null;
type ReferenceAttachment = {
  file: File;
  id: string;
  name: string;
  previewUrl: string;
  slot?: Exclude<ReferenceSlot, null>;
  type: 'image' | 'video';
};

/** A compact landing composer with dedicated image and video creation modes. */
export function ProactivHeroComposer({
  isGenerating = false,
  labels,
  onPromptChange,
  onGenerate,
  promptValue,
}: ProactivHeroComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'image' | 'video'>('video');
  const [uncontrolledPrompt, setUncontrolledPrompt] = useState('');
  const [style, setStyle] = useState(styles[0]);
  const [aspectRatio, setAspectRatio] = useState(defaultAspectRatio);
  const [batchSize, setBatchSize] = useState(1);
  const [references, setReferences] = useState<ReferenceAttachment[]>([]);
  const [referenceSlot, setReferenceSlot] = useState<ReferenceSlot>(null);
  const [hasRequestedGeneration, setHasRequestedGeneration] = useState(false);
  const referencesRef = useRef<ReferenceAttachment[]>([]);
  const prompt = promptValue ?? uncontrolledPrompt;
  const isReady = prompt.trim().length > 0 || references.length > 0;

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

  const updateMode = (nextMode: 'image' | 'video') => {
    setMode(nextMode);
    setHasRequestedGeneration(false);
  };

  const getSlotAttachment = (slot: Exclude<ReferenceSlot, null>) =>
    references.find((reference) => reference.slot === slot);

  const openFilePicker = (slot: ReferenceSlot = null) => {
    setReferenceSlot(slot);
    fileInputRef.current?.click();
  };

  const handleReferenceTile = (slot: Exclude<ReferenceSlot, null>) => {
    const attachment = getSlotAttachment(slot);
    if (!attachment) {
      openFilePicker(slot);
      return;
    }

    removeReference(attachment.id);
    setHasRequestedGeneration(false);
  };

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

    const uploaded = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      slot: referenceSlot ?? undefined,
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));

    setReferences((current) => {
      if (!referenceSlot) return [...current, ...uploaded];

      const retained = current.filter((reference) => {
        if (reference.slot !== referenceSlot) return true;
        URL.revokeObjectURL(reference.previewUrl);
        return false;
      });
      return [...retained, ...uploaded];
    });
    setReferenceSlot(null);
    setHasRequestedGeneration(false);
  };

  const requestGeneration = () => {
    if (!isReady || isGenerating) return;

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
      className="w-full max-w-[896px] text-white"
    >
      <div className="flex w-full items-end gap-2">
        <div
          role="tablist"
          aria-label={labels.model}
          aria-orientation="vertical"
          className="hidden h-28 w-[72px] shrink-0 flex-col gap-0.5 rounded-[28px] border border-white/10 bg-[#171b20]/95 p-1 shadow-[0_4px_16px_rgba(0,0,0,0.28)]"
        >
          <ModeTab
            active={mode === 'image'}
            icon={Image}
            label={labels.image}
            onClick={() => updateMode('image')}
          />
          <ModeTab
            active={mode === 'video'}
            icon={Video}
            label={labels.video}
            onClick={() => updateMode('video')}
          />
        </div>

        <div className="min-w-0 flex-1 rounded-[28px] border border-white/10 bg-[#171b20]/95 p-1 shadow-[0_4px_16px_rgba(0,0,0,0.28)]">
          <div className="min-h-[104px] rounded-[22px] bg-[#0e1115] p-3">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
              <div className="flex min-h-20 min-w-0 flex-1 flex-col">
                <label className="sr-only" htmlFor="hero-marketing-prompt">
                  {labels.placeholder}
                </label>
                <div className="flex min-h-10 w-full flex-1 flex-col px-1">
                  {references.length ? (
                    <div className="flex min-h-16 items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {references.map((reference) => (
                        <AttachmentPreview
                          key={reference.id}
                          attachment={reference}
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
                    className={`block min-h-10 w-full flex-1 resize-none bg-transparent py-0 text-sm leading-5 text-white outline-none placeholder:text-[#7f8994] ${
                      references.length ? 'mt-2' : ''
                    }`}
                  />
                </div>

                <div className="mt-3 flex min-w-0 items-center gap-1 overflow-x-auto border-t border-white/8 pt-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="sr-only"
                    onChange={(event) => {
                      addUploadedReferences(event.target.files);
                      event.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => openFilePicker()}
                    className={`relative inline-flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c3ef] ${
                      references.length
                        ? 'bg-[#d1fe17]/15 text-[#d1fe17] hover:bg-[#d1fe17]/25'
                        : 'text-[#cbd3dd] hover:bg-white/10 hover:text-white'
                    }`}
                    aria-label={labels.addReference}
                    title={
                      references.length
                        ? `${labels.addReference} (${references.length})`
                        : labels.addReference
                    }
                  >
                    <ImagePlus className="size-4" aria-hidden="true" />
                    {references.length ? (
                      <span className="absolute -top-1 -right-1 grid size-3 place-items-center rounded-full bg-[#d1fe17] text-[8px] font-bold text-[#0a1000]">
                        {references.length}
                      </span>
                    ) : null}
                  </button>

                  <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-white/6 px-2 text-xs font-medium text-[#d9e0e7]">
                    <Sparkles
                      className="size-3.5 text-[#d1fe17]"
                      aria-hidden="true"
                    />
                    {labels.model}{' '}
                    {mode === 'image' ? labels.image : labels.video}
                  </span>

                  <label className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-white/6 px-2 text-xs font-medium text-[#d9e0e7] transition-colors hover:bg-white/10">
                    <Box
                      className="size-3.5 text-[#9eabb8]"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{labels.style}</span>
                    <select
                      value={style}
                      onChange={(event) => {
                        setStyle(event.target.value);
                        setHasRequestedGeneration(false);
                      }}
                      aria-label={labels.style}
                      className="max-w-24 bg-transparent text-xs text-white outline-none"
                    >
                      {styles.map((option) => (
                        <option
                          key={option}
                          value={option}
                          className="bg-[#15191e]"
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <AspectRatioPicker
                    label={labels.aspectRatio}
                    value={aspectRatio}
                    onChange={(nextRatio) => {
                      setAspectRatio(nextRatio);
                      setHasRequestedGeneration(false);
                    }}
                  />

                  <div className="inline-flex h-7 shrink-0 items-center rounded-lg bg-white/6 text-xs font-medium text-[#d9e0e7]">
                    <button
                      type="button"
                      aria-label={`Decrease ${labels.batch}`}
                      disabled={batchSize === 1}
                      onClick={() => {
                        setBatchSize((value) => Math.max(1, value - 1));
                        setHasRequestedGeneration(false);
                      }}
                      className="grid size-7 place-items-center rounded-l-lg transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/25"
                    >
                      <Minus className="size-3.5" aria-hidden="true" />
                    </button>
                    <span className="min-w-8 text-center tabular-nums">
                      {batchSize}/4
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase ${labels.batch}`}
                      disabled={batchSize === 4}
                      onClick={() => {
                        setBatchSize((value) => Math.min(4, value + 1));
                        setHasRequestedGeneration(false);
                      }}
                      className="grid size-7 place-items-center rounded-r-lg transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/25"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex h-20 shrink-0 items-stretch gap-1.5 self-end sm:w-[292px]">
                <ReferenceTile
                  attachmentName={getSlotAttachment('avatar')?.name}
                  icon={UserRound}
                  label={labels.avatar}
                  onClick={() => handleReferenceTile('avatar')}
                />
                <ReferenceTile
                  attachmentName={getSlotAttachment('product')?.name}
                  icon={Box}
                  label={labels.product}
                  onClick={() => handleReferenceTile('product')}
                />
                <button
                  type="button"
                  disabled={!isReady || isGenerating}
                  onClick={requestGeneration}
                  className="group relative min-w-[112px] flex-1 overflow-hidden rounded-xl bg-[#d1fe17] px-4 text-xs font-bold tracking-wide text-[#0a1000] uppercase shadow-[inset_0_-3px_0_#829b19,0_12px_24px_rgba(0,0,0,0.28)] transition-[filter,transform] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1fe17] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="absolute -right-5 -bottom-8 size-24 rounded-full bg-white/50 blur-2xl transition-transform duration-300 group-hover:scale-125" />
                  <span className="relative flex flex-col items-center gap-1">
                    <Sparkles className="size-4" aria-hidden="true" />
                    <span>
                      {hasRequestedGeneration
                        ? labels.generated
                        : labels.generate}
                    </span>
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
        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-white/6 px-2 text-xs font-medium text-[#d9e0e7] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1fe17]"
      >
        <span
          className={`block rounded-[3px] border border-current ${selectedOption.previewClassName}`}
          aria-hidden="true"
        />
        <span>{value}</span>
        <ChevronDown className="size-3.5 text-white/75" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={10}
        className="w-[292px] min-w-[292px] rounded-xl border border-[#3d413e] bg-[#181b1a] p-1.5 text-white shadow-[0_18px_48px_rgba(0,0,0,0.52)]"
      >
        <p className="px-2.5 pt-1.5 pb-2 text-[10px] font-semibold tracking-[0.16em] text-[#aeb1aa] uppercase">
          {label}
        </p>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onChange(String(nextValue))}
          className="grid grid-cols-2 gap-1"
        >
          {aspectRatioOptions.map((option) => {
            const selected = value === option.value;
            const compactPreviewScale =
              option.value === '9:16'
                ? 'scale-[0.6]'
                : option.value === '3:4' || option.value === 'adaptive'
                  ? 'scale-75'
                  : '';

            return (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                label={option.value}
                closeOnClick
                className="group/ratio flex h-11 items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-[#b7bab3] transition-[background-color,border-color,color] duration-150 hover:border-white/10 hover:bg-white/[0.055] hover:text-white focus:border-[#a58a2d] focus:bg-[#282518] focus:text-white data-checked:border-[#8d7627] data-checked:bg-[#282518] data-checked:text-white [&_[data-slot=dropdown-menu-radio-item-indicator]]:right-2 [&_[data-slot=dropdown-menu-radio-item-indicator]]:text-[#e0b918]"
              >
                <span
                  className={`grid h-7 w-10 shrink-0 place-items-center rounded-md border transition-colors ${
                    selected
                      ? 'border-[#bda348] bg-[#211d12] text-[#e3d7a7]'
                      : 'border-white/12 bg-black/10 text-[#aaa59b] group-hover/ratio:border-white/25 group-hover/ratio:text-white'
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`block rounded-[2px] border-[1.5px] border-current ${option.previewClassName} ${compactPreviewScale}`}
                  />
                </span>
                <span className="tabular-nums">{option.value}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModeTab({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Image;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-h-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] text-[10px] leading-3 font-bold tracking-[0.02em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c3ef] ${
        active
          ? 'bg-[#f5f7f8] text-[#10151b] shadow-[0_2px_5px_rgba(0,0,0,0.2)]'
          : 'text-[#8a96a3] hover:bg-white/6 hover:text-white'
      }`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function AttachmentPreview({
  attachment,
  onRemove,
  removeLabel,
}: {
  attachment: ReferenceAttachment;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <figure className="group/attachment relative size-16 shrink-0 overflow-visible rounded-lg border border-white/15 bg-[#1a2026] shadow-[0_6px_16px_rgba(0,0,0,0.32)]">
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
        className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full border border-white/30 bg-[#101418] text-white shadow-[0_2px_8px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#ef5350] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1fe17]"
      >
        <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
      </button>
      <figcaption className="sr-only">{attachment.name}</figcaption>
    </figure>
  );
}

function ReferenceTile({
  attachmentName,
  icon: Icon,
  label,
  onClick,
}: {
  attachmentName?: string;
  icon: typeof UserRound;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={Boolean(attachmentName)}
      aria-label={attachmentName ? `${label}: ${attachmentName}` : label}
      onClick={onClick}
      className={`group relative flex min-w-0 flex-1 flex-col items-start justify-between overflow-hidden rounded-xl border p-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39c3ef] ${
        attachmentName
          ? 'border-[#d1fe17]/65 bg-[#32410c]'
          : 'border-white/10 bg-gradient-to-b from-[#202020] to-[#504f4f] hover:border-white/25'
      }`}
    >
      <span className="grid size-5 place-items-center rounded-full border border-white/25 bg-white/8 text-white shadow-[inset_0_0_5px_rgba(255,255,255,0.22)]">
        {attachmentName ? (
          <Check className="size-3" aria-hidden="true" />
        ) : (
          <Plus className="size-3" aria-hidden="true" />
        )}
      </span>
      <span className="relative min-w-0 text-[11px] font-bold tracking-[0.04em] text-white uppercase">
        <span className="block">{label}</span>
        {attachmentName ? (
          <span className="mt-0.5 block max-w-full truncate text-[9px] font-medium tracking-normal text-[#d1fe17] normal-case">
            {attachmentName}
          </span>
        ) : null}
      </span>
      <Icon
        className="absolute -right-4 -bottom-5 size-20 text-white/8 transition-transform duration-300 group-hover:scale-110"
        aria-hidden="true"
      />
    </button>
  );
}
