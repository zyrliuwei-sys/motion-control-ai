import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Clapperboard,
  Grid2X2,
  Image,
  LayoutGrid,
  MonitorPlay,
  Pause,
  Play,
  Sparkles,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface ProactivVideoShowcaseCase {
  category: string;
  description: string;
  posterSrc: string;
  src: string;
  title: string;
}

export interface ProactivVideoShowcaseFilter {
  id: string;
  label: string;
}

export interface ProactivVideoShowcaseProps {
  cases: ProactivVideoShowcaseCase[];
  description: string;
  filters: ProactivVideoShowcaseFilter[];
  muteLabel: string;
  pauseLabel: string;
  playLabel: string;
  showAllCategories?: boolean;
  title: string;
  unmuteLabel: string;
}

const uniformGalleryLayout = 'aspect-[3/4] object-center';

const filterIcons = {
  ads: MonitorPlay,
  all: Grid2X2,
  marketplace: LayoutGrid,
  motion: Clapperboard,
  posters: Image,
  product: Box,
  ugc: UserRound,
} as const;

/** A dense, filterable media wall inspired by an AI-template library. */
export function ProactivVideoShowcase({
  cases,
  description,
  filters,
  muteLabel,
  pauseLabel,
  playLabel,
  showAllCategories = false,
  title,
  unmuteLabel,
}: ProactivVideoShowcaseProps) {
  const [activeFilter, setActiveFilter] = useState(filters[0]?.id ?? 'all');
  const galleryCases = useMemo(() => {
    if (!cases.length) return [];

    return cases.map((videoCase) => ({
      // Every video belongs to the complete "All" collection as well as its
      // specific category, so no case can disappear from the default view.
      categories: ['all', videoCase.category],
      layout: uniformGalleryLayout,
      videoCase,
    }));
  }, [cases]);
  const visibleCases = galleryCases.filter((item) =>
    item.categories.includes(activeFilter)
  );
  if (!cases.length) return null;

  return (
    <section
      id="showcase"
      className="relative overflow-hidden bg-[#101113] py-5 text-white sm:py-6"
      aria-labelledby="showcase-heading"
      aria-describedby="showcase-description"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_1.5px)] bg-[size:32px_32px] opacity-50"
        aria-hidden="true"
      />
      <div className="relative">
        <div className="px-2 sm:px-3">
          <h2
            id="showcase-heading"
            className="text-[25px] leading-none font-semibold tracking-[-0.065em] text-white sm:text-[34px]"
          >
            {title}
          </h2>
          <p
            id="showcase-description"
            className={
              showAllCategories
                ? 'mt-2 max-w-xl text-sm leading-6 text-white/55'
                : 'sr-only'
            }
          >
            {description}
          </p>
          {!showAllCategories && (
            <div
              className="mt-5 flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label={title}
            >
              {filters.map((filter) => {
                const Icon =
                  filterIcons[filter.id as keyof typeof filterIcons] ??
                  Sparkles;
                const isActive = activeFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1fe17] ${
                      isActive
                        ? 'border-white/10 bg-[#3a3b3f] text-white'
                        : 'border-white/5 bg-[#242529] text-white/55 hover:border-white/15 hover:bg-[#303136] hover:text-white'
                    }`}
                  >
                    <Icon
                      className="size-4"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-[3px] px-[3px] sm:mt-7 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {(showAllCategories ? galleryCases : visibleCases).map(
            (item, index) => (
              <VideoCaseCard
                key={`${item.videoCase.src}-${index}`}
                aspectRatio={item.layout}
                videoCase={item.videoCase}
                muteLabel={muteLabel}
                pauseLabel={pauseLabel}
                playLabel={playLabel}
                unmuteLabel={unmuteLabel}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}

function VideoCaseCard({
  aspectRatio,
  muteLabel,
  pauseLabel,
  playLabel,
  unmuteLabel,
  videoCase,
}: {
  aspectRatio: string;
  muteLabel: string;
  pauseLabel: string;
  playLabel: string;
  unmuteLabel: string;
  videoCase: ProactivVideoShowcaseCase;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

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
      { rootMargin: '240px 0px' }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  const toggleMuted = () => {
    const video = videoRef.current;
    if (!video) return;

    setIsMuted((muted) => !muted);
    video.muted = !video.muted;
  };

  return (
    <article className="group relative w-full overflow-hidden bg-[#17191c]">
      <div className={`relative overflow-hidden ${aspectRatio}`}>
        <video
          ref={videoRef}
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          poster={videoCase.posterSrc}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          className="h-full w-full object-cover transition duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
          aria-label={videoCase.title}
        >
          <source src={videoCase.src} type="video/mp4" />
        </video>
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_46%,rgba(0,0,0,0.75)_100%)] opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100"
          aria-hidden="true"
        />
        <div className="absolute right-2 bottom-2 left-2 flex translate-y-2 items-end justify-between gap-2 opacity-0 transition-all duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold tracking-[-0.03em] text-white">
              {videoCase.title}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-white/70">
              {videoCase.description}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={toggleMuted}
              aria-label={isMuted ? unmuteLabel : muteLabel}
              className="grid size-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1fe17]"
            >
              {isMuted ? (
                <VolumeX className="size-3.5" aria-hidden="true" />
              ) : (
                <Volume2 className="size-3.5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={isPlaying ? pauseLabel : playLabel}
              className="grid size-8 place-items-center rounded-full bg-white text-[#111214] transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1fe17]"
            >
              {isPlaying ? (
                <Pause className="size-3.5" aria-hidden="true" />
              ) : (
                <Play className="ml-0.5 size-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
