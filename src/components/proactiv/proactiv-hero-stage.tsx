import { useState } from 'react';
import {
  Box,
  Clapperboard,
  ImageIcon,
  Megaphone,
  PanelsTopLeft,
  ShoppingBag,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

type HeroStageItem = {
  artwork: string;
  icon: LucideIcon;
  id: string;
  label: string;
  video: string;
};

const heroBannerBaseUrl =
  'https://higgsfield.ai/marketing-studio/hero-banners/marketing-studio-slider-poster-';

const items: HeroStageItem[] = [
  {
    id: 'ugc',
    label: 'UGC',
    artwork: '/proactiv/second.png',
    icon: UserRound,
    video: `${heroBannerBaseUrl}UGC.mp4`,
  },
  {
    id: 'product-shot',
    label: 'Product shot',
    artwork: '/proactiv/third.png',
    icon: Box,
    video: `${heroBannerBaseUrl}Product.mp4`,
  },
  {
    id: 'motion',
    label: 'Motion',
    artwork: '/proactiv/dashboard-x.png',
    icon: Clapperboard,
    video: `${heroBannerBaseUrl}Motion.mp4`,
  },
  {
    id: 'ads',
    label: 'Ads',
    artwork: '/proactiv/fourth-backup.png',
    icon: Megaphone,
    video: `${heroBannerBaseUrl}Ads.mp4`,
  },
  {
    id: 'posters',
    label: 'Posters',
    artwork: '/proactiv/first.png',
    icon: ImageIcon,
    video: `${heroBannerBaseUrl}poster.mp4`,
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    artwork: '/proactiv/dashboard.png',
    icon: ShoppingBag,
    video: `${heroBannerBaseUrl}Marketplace.mp4`,
  },
];

const slots = [
  { depth: 30, height: 83.2, left: 37.8, opacity: 1, top: 15.7, width: 24.8 },
  {
    depth: 20,
    height: 65.7,
    left: 60.6,
    opacity: 0.92,
    top: 25.2,
    width: 16.5,
  },
  {
    depth: 10,
    height: 54.7,
    left: 75.4,
    opacity: 0.76,
    top: 30.7,
    width: 14.3,
  },
  { depth: 0, height: 47.4, left: -7, opacity: 0, top: 34.3, width: 12.6 },
  {
    depth: 10,
    height: 54.7,
    left: 10.4,
    opacity: 0.76,
    top: 30.7,
    width: 14.3,
  },
  { depth: 20, height: 65.7, left: 23, opacity: 0.92, top: 25.2, width: 16.5 },
];

/** A layered, selectable media deck that gives the hero a sense of an active creative workspace. */
export function ProactivHeroStage() {
  const [activeIndex, setActiveIndex] = useState(items.length - 1);
  const activeItem = items[activeIndex] ?? items[0];

  return (
    <section
      aria-label="Creative tools"
      className="relative isolate w-full max-w-[1176px] touch-pan-y select-none"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[10%_24%] -z-10 overflow-hidden rounded-[2rem] opacity-70 blur-3xl"
      >
        <video
          key={activeItem.id}
          aria-hidden="true"
          autoPlay
          loop
          muted
          playsInline
          poster={activeItem.artwork}
          preload="metadata"
          src={activeItem.video}
          className="size-full scale-110 object-cover"
        />
      </div>

      <div
        className="relative h-[168px] w-full [perspective:900px] sm:h-[226px] lg:h-[274px]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {items.map((item, index) => {
          const offset = (index - activeIndex + items.length) % items.length;
          const slot = slots[offset] ?? slots[0];
          const isActive = index === activeIndex;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-pressed={isActive}
              aria-hidden={slot.opacity === 0}
              tabIndex={slot.opacity === 0 ? -1 : 0}
              onClick={() => setActiveIndex(index)}
              className="group absolute overflow-hidden border border-white/15 bg-[#141a21] text-left shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out outline-none focus-visible:ring-2 focus-visible:ring-[#d1fe17] focus-visible:ring-offset-4 focus-visible:ring-offset-[#090b0e]"
              style={{
                height: `${slot.height}%`,
                left: `${slot.left}%`,
                opacity: slot.opacity,
                pointerEvents: slot.opacity === 0 ? 'none' : 'auto',
                top: `${slot.top}%`,
                transform: `translate3d(0, 0, ${slot.depth}px) scale(${isActive ? 1 : 0.98})`,
                transformStyle: 'preserve-3d',
                width: `${slot.width}%`,
                zIndex: slot.depth,
              }}
            >
              <video
                aria-hidden="true"
                autoPlay
                loop
                muted
                playsInline
                poster={item.artwork}
                preload="metadata"
                src={item.video}
                className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
              <span
                className={`absolute bottom-[7%] left-[5%] inline-flex h-[18%] items-center gap-1 rounded-full border border-white/20 bg-black/25 px-[6%] text-[clamp(7px,0.85vw,12px)] font-medium whitespace-nowrap text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] backdrop-blur-md transition-opacity ${
                  isActive
                    ? 'opacity-100'
                    : 'opacity-75 group-hover:opacity-100'
                }`}
              >
                <Icon
                  className="size-[0.9em] shrink-0"
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
                {item.label}
              </span>
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 border-2 transition-colors ${
                  isActive ? 'border-white/35' : 'border-white/10'
                }`}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
