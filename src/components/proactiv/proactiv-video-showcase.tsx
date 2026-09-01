import { useState } from 'react';

import { ThreeDMarquee } from '@/components/ui/3d-marquee';

export interface ProactivVideoShowcaseCase {
  category: string;
  description: string;
  posterSrc: string;
  showcaseImageSrc?: string;
  src: string;
  title: string;
}

export interface ProactivVideoShowcaseFilter {
  id: string;
  label: string;
}

export interface ProactivVideoShowcaseProps {
  cases: ProactivVideoShowcaseCase[];
  ctaLabel?: string;
  description: string;
  maxCases?: number;
  filters: ProactivVideoShowcaseFilter[];
  showAllCategories?: boolean;
  title: string;
}

/** A restrained reference gallery for motion studies. */
export function ProactivVideoShowcase({
  cases,
  ctaLabel,
  description,
  filters,
  maxCases = 6,
  showAllCategories = false,
  title,
}: ProactivVideoShowcaseProps) {
  const [activeFilter, setActiveFilter] = useState(filters[0]?.id ?? 'all');
  const visibleCases = showAllCategories
    ? cases
    : cases.filter(
        (videoCase) =>
          activeFilter === 'all' || videoCase.category === activeFilter
      );
  const displayedCases = visibleCases.slice(0, maxCases);
  const marqueeImages = displayedCases
    .map((videoCase) => videoCase.showcaseImageSrc ?? videoCase.posterSrc)
    .filter(Boolean);

  if (!cases.length) return null;

  return (
    <section
      id="showcase"
      className="scroll-mt-24 bg-white py-16 text-[#18181b] sm:py-20"
      aria-labelledby="showcase-heading"
    >
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <h2
            id="showcase-heading"
            className="text-3xl leading-[1.02] font-semibold tracking-[-0.055em] sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#627181]">
            {description}
          </p>
          {ctaLabel ? (
            <a
              href="/text-to-image"
              className="mt-4 inline-flex text-sm font-semibold text-[#18181b] underline decoration-[#18181b]/35 underline-offset-4 transition-colors hover:text-[#52525b] hover:decoration-[#18181b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18181b]"
            >
              {ctaLabel}
            </a>
          ) : null}
        </header>

        {!showAllCategories ? (
          <div
            className="mt-7 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label={title}
          >
            {filters.map((filter) => {
              const isActive = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18181b] ${
                    isActive
                      ? 'border-[#18181b] bg-[#18181b] text-white'
                      : 'border-zinc-200 bg-white text-[#52525b] hover:border-zinc-300 hover:text-[#18181b]'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="relative mt-9 overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white/45 p-2 shadow-[0_24px_70px_rgba(24,24,27,0.08)] ring-1 ring-white/70 sm:p-3">
          <ThreeDMarquee images={marqueeImages} />
        </div>
      </div>
    </section>
  );
}
