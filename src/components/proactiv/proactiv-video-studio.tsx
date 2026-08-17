import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  CircleCheckBig,
  Layers3,
  Play,
  Radio,
} from 'lucide-react';

import {
  ProactivHeroComposer,
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

/** A full-bleed template feed with the landing composer docked above it. */
export function ProactivVideoStudio({
  cases,
  composerLabels,
  copy,
  initialPrompt = '',
}: ProactivVideoStudioProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedCase, setSelectedCase] =
    useState<ProactivVideoShowcaseCase | null>(null);
  const [isQueued, setIsQueued] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
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
              key={videoCase.src}
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
                  {isQueued ? copy.readyLabel : copy.composerLabel}
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
              <ProactivHeroComposer
                labels={composerLabels}
                promptValue={prompt}
                onPromptChange={(nextPrompt) => {
                  setPrompt(nextPrompt);
                  setIsQueued(false);
                }}
                onGenerate={() => setIsQueued(true)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
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
