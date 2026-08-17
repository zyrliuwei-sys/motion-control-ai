import { useState } from 'react';
import {
  ChevronDown,
  Clapperboard,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

export interface ProactivVideoSample {
  imageAlt: string;
  imageSrc: string;
  prompt: string;
  title: string;
}

export interface ProactivVideoCase {
  description: string;
  posterSrc: string;
  src: string;
  title: string;
}

export interface ProactivTextToVideoProps {
  caseDescription: string;
  caseHeading: string;
  createLabel: string;
  dailyAllowanceLabel: string;
  dailyAllowanceValue: string;
  formatOptions: string[];
  generateWithAiLabel: string;
  modelOptions: string[];
  initialPrompt?: string;
  pageDescription: string;
  pageTitle: string;
  promptCountLabel: (count: number) => string;
  promptPrefix: string;
  promptPlaceholder: string;
  queuedLabel: string;
  sampleLabel: string;
  samples: ProactivVideoSample[];
  textToVideoLabel: string;
  upgradeHref: string;
  upgradeLabel: string;
  videoCases: ProactivVideoCase[];
}

/** The interactive main canvas for the standalone Senzia-style text-to-video page. */
export function ProactivTextToVideo({
  caseDescription,
  caseHeading,
  createLabel,
  dailyAllowanceLabel,
  dailyAllowanceValue,
  formatOptions,
  generateWithAiLabel,
  initialPrompt = '',
  modelOptions,
  pageDescription,
  pageTitle,
  promptCountLabel,
  promptPrefix,
  promptPlaceholder,
  queuedLabel,
  sampleLabel,
  samples,
  textToVideoLabel,
  upgradeHref,
  upgradeLabel,
  videoCases,
}: ProactivTextToVideoProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const [modelIndex, setModelIndex] = useState(0);
  const [formatIndex, setFormatIndex] = useState(0);
  const [assistIndex, setAssistIndex] = useState(0);
  const [queued, setQueued] = useState(false);
  const isReady = prompt.trim().length > 0;

  const fillPrompt = (sample: ProactivVideoSample) => {
    setPrompt(sample.prompt);
    setActiveSample(sample.title);
    setQueued(false);
  };

  const assistPrompt = () => {
    const sample = samples[assistIndex % samples.length];
    if (!sample) return;

    fillPrompt(sample);
    setAssistIndex((index) => index + 1);
  };

  return (
    <main className="min-h-[calc(100dvh-64px)] bg-[#0d1014] px-4 py-8 text-[#f3f6f8] sm:px-7 sm:py-11 lg:px-10 lg:py-12">
      <div className="mx-auto w-full max-w-[1032px]">
        <div className="mb-8 border-b border-[#242b34] pb-6">
          <h1 className="text-2xl leading-none font-semibold tracking-[-0.035em] text-white sm:text-[30px]">
            {pageTitle}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#939eac]">
            {pageDescription}
          </p>
        </div>

        <section aria-label={textToVideoLabel}>
          <div className="overflow-hidden rounded-lg border border-[#2d3641] bg-[#151a20] shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
            <textarea
              value={prompt}
              maxLength={4000}
              onChange={(event) => {
                setPrompt(event.target.value);
                setActiveSample(null);
                setQueued(false);
              }}
              placeholder={promptPlaceholder}
              aria-label={promptPlaceholder}
              className="min-h-40 w-full resize-y border-0 bg-transparent px-4 py-4 text-sm leading-6 text-[#f5f7fa] outline-none placeholder:text-[#768496] sm:min-h-48"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2b3440] px-3 py-3 sm:px-4">
              <button
                type="button"
                onClick={assistPrompt}
                className="inline-flex h-8 items-center gap-2 rounded-md bg-[#222b35] px-2.5 text-xs font-medium text-[#dce5ed] transition-colors hover:bg-[#2d3946] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <WandSparkles className="size-3.5" aria-hidden="true" />
                {generateWithAiLabel}
              </button>
              <span className="text-xs text-[#8190a2] tabular-nums">
                {promptCountLabel(prompt.length)}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <OptionControl
              label={modelOptions[modelIndex] ?? ''}
              options={modelOptions}
              onSelect={(index) => {
                setModelIndex(index);
                setQueued(false);
              }}
            />
            <OptionControl
              label={formatOptions[formatIndex] ?? ''}
              options={formatOptions}
              onSelect={(index) => {
                setFormatIndex(index);
                setQueued(false);
              }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-4 rounded-lg border border-[#2a3440] bg-[#12171d] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[#dde5ec]">
                {dailyAllowanceLabel}
              </p>
              <p aria-live="polite" className="mt-1 text-xs text-[#8492a2]">
                {queued ? queuedLabel : dailyAllowanceValue}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={upgradeHref}
                className="h-9 rounded-md border border-[#3a4653] px-3 text-sm text-[#cad4df] transition-colors hover:bg-[#1d2630] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {upgradeLabel}
              </Link>
              <button
                type="button"
                disabled={!isReady}
                onClick={() => setQueued(true)}
                className="inline-flex h-9 min-w-24 items-center justify-center gap-2 rounded-md bg-[#f0f3f6] px-3 text-sm font-semibold text-[#10151b] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-[#2b3440] disabled:text-[#7c8998]"
              >
                <Clapperboard className="size-3.5" aria-hidden="true" />
                {createLabel}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="video-samples-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="video-samples-heading"
              className="text-sm font-semibold text-[#edf2f6]"
            >
              {sampleLabel}
            </h2>
            <Sparkles className="size-4 text-[#708092]" aria-hidden="true" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {samples.map((sample) => {
              const selected = activeSample === sample.title;
              return (
                <button
                  key={sample.title}
                  type="button"
                  onClick={() => fillPrompt(sample)}
                  aria-pressed={selected}
                  className={`group overflow-hidden rounded-lg border bg-[#141a21] text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    selected
                      ? 'border-[#e3ebf3]'
                      : 'border-[#2d3743] hover:border-[#667384]'
                  }`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#1a222c]">
                    <img
                      src={sample.imageSrc}
                      alt={sample.imageAlt}
                      className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-100"
                    />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs leading-5 text-[#8f9cac]">
                      <span className="font-medium text-[#ccd5de]">
                        {promptPrefix}
                      </span>{' '}
                      {sample.prompt}
                    </p>
                    <span className="mt-3 inline-flex h-7 items-center rounded-md border border-[#384350] px-2.5 text-xs font-medium text-[#dce5ed] transition-colors group-hover:bg-[#202832]">
                      {createLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <VideoCaseGallery
          heading={caseHeading}
          description={caseDescription}
          cases={videoCases}
        />
      </div>
    </main>
  );
}

function OptionControl({
  label,
  onSelect,
  options,
}: {
  label: string;
  onSelect: (index: number) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-[#37414e] bg-[#151b22] px-3 text-xs font-medium text-[#cbd5df] transition-colors hover:bg-[#202832] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {label}
        <ChevronDown
          className={`size-3.5 text-[#8794a5] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label={label}
          className="absolute top-11 left-0 z-20 min-w-40 overflow-hidden rounded-md border border-[#37414e] bg-[#151b22] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
        >
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === label}
              onClick={() => {
                onSelect(index);
                setOpen(false);
              }}
              className="flex w-full rounded px-2.5 py-2 text-left text-xs text-[#cbd5df] transition-colors hover:bg-[#28333f] focus-visible:bg-[#28333f] focus-visible:outline-none"
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function VideoCaseGallery({
  cases,
  description,
  heading,
}: {
  cases: ProactivVideoCase[];
  description: string;
  heading: string;
}) {
  if (cases.length === 0) return null;

  return (
    <section
      id="video-cases"
      className="mt-12 scroll-mt-24"
      aria-labelledby="video-cases-heading"
    >
      <div className="max-w-2xl">
        <h2
          id="video-cases-heading"
          className="text-xl font-semibold tracking-[-0.025em] text-[#edf2f6] sm:text-2xl"
        >
          {heading}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#8f9cac]">{description}</p>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {cases.map((videoCase) => (
          <article
            key={videoCase.src}
            className="overflow-hidden rounded-lg border border-[#2d3743] bg-[#141a21] shadow-[0_10px_26px_rgba(0,0,0,0.12)]"
          >
            <video
              controls
              playsInline
              preload="metadata"
              poster={videoCase.posterSrc}
              className="aspect-video w-full bg-[#090d11] object-cover"
              aria-label={videoCase.title}
            >
              <source src={videoCase.src} type="video/mp4" />
            </video>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[#edf2f6]">
                {videoCase.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-[#8f9cac]">
                {videoCase.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
