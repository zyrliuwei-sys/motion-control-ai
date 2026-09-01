import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Autoplay, EffectFade } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/effect-fade';

import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

export type HomeHeroLandingImage = {
  alt: string;
  src: string;
};

export interface HomeHeroLandingScrollAnimationProps {
  /** A short label shown above the initial art direction. */
  eyebrow?: string;
  /** Optional crawlable destination rendered beneath the description. */
  ctaLabel?: string;
  /** The accessible headline shown before the cards become type. */
  title: string;
  description: string;
  /** The headline assembled by the final scroll state. */
  motionStatement?: readonly string[];
  images: readonly HomeHeroLandingImage[];
  className?: string;
}

type TextSegmentRef = {
  element: HTMLSpanElement;
  originalIndex: number;
};

const defaultMotionStatement = [
  'Direct',
  'every',
  'movement.',
  'Make',
  'it yours.',
] as const;

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

function shuffledSegments(segments: TextSegmentRef[]) {
  const result = [...segments];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [
      result[randomIndex]!,
      result[index]!,
    ];
  }
  return result;
}

/**
 * A pinned hero that turns a visual reference strip into an editorial motion
 * statement. It is intentionally self-contained so marketing pages can supply
 * their own copy and licensed images without coupling to page data.
 */
export function HomeHeroLandingScrollAnimation({
  eyebrow,
  ctaLabel,
  title,
  description,
  motionStatement = defaultMotionStatement,
  images,
  className,
}: HomeHeroLandingScrollAnimationProps) {
  const heroRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRailRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const slotRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const textRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const duplicateCardsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const hero = heroRef.current;
    const header = headerRef.current;
    const rail = cardRailRef.current;
    if (!hero || !header || !rail || images.length === 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;

    const clearDuplicates = () => {
      duplicateCardsRef.current.forEach((card) => card.remove());
      duplicateCardsRef.current = [];
    };

    const visibleSegments = textRefs.current.flatMap((element, originalIndex) =>
      element ? [{ element, originalIndex }] : []
    );
    const segmentOrder = shuffledSegments(visibleSegments);
    const context = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: () => `+=${window.innerHeight * 5}`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onLeave: clearDuplicates,
        onLeaveBack: clearDuplicates,
        onUpdate: (self) => {
          const progress = self.progress;
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          const isCompact = viewportWidth < 768;
          const headerCardSize = isCompact ? 30 : 56;
          const railCardSize =
            cardRefs.current[0]?.getBoundingClientRect().width ?? 1;
          const cardScale = headerCardSize / railCardSize;

          textRefs.current.forEach((segment) => {
            if (segment) gsap.set(segment, { opacity: 0 });
          });
          slotRefs.current.forEach((slot) => {
            if (slot) gsap.set(slot, { opacity: 0 });
          });

          if (progress < 0.28) {
            const movement = progress / 0.28;
            clearDuplicates();
            gsap.set(header, {
              opacity: 1 - clampProgress(progress / 0.13),
              y: -48 * clampProgress(progress / 0.13),
            });
            gsap.set(rail, {
              opacity: 1,
              x: 0,
              y: -viewportHeight * 0.22 * movement,
              scale: 1,
            });
            cardRefs.current.forEach((card, index) => {
              if (!card) return;
              const stagger = clampProgress((movement - index * 0.07) / 0.44);
              gsap.set(card, { x: 0, y: viewportHeight * 0.18 * (1 - stagger) });
            });
            return;
          }

          if (progress < 0.6) {
            const scaleProgress = (progress - 0.28) / 0.32;
            clearDuplicates();
            gsap.set(header, { opacity: 0, y: -48 });
            gsap.set(rail, {
              opacity: 1,
              x: 0,
              y: -viewportHeight * 0.22,
              scale: 1 + (cardScale - 1) * scaleProgress,
            });
            cardRefs.current.forEach((card) => card && gsap.set(card, { x: 0, y: 0 }));
            return;
          }

          if (progress < 0.77) {
            const travel = (progress - 0.6) / 0.17;
            gsap.set(header, { opacity: 0, y: -48 });
            gsap.set(rail, {
              opacity: 0,
              x: 0,
              y: -viewportHeight * 0.22,
              scale: cardScale,
            });

            if (duplicateCardsRef.current.length === 0) {
              duplicateCardsRef.current = cardRefs.current.flatMap((card) => {
                if (!card) return [];
                const duplicate = card.cloneNode(true) as HTMLElement;
                duplicate.setAttribute('aria-hidden', 'true');
                Object.assign(duplicate.style, {
                  borderRadius: '0.375rem',
                  boxShadow: '0 14px 34px rgba(19, 42, 56, 0.18)',
                  display: 'block',
                  height: `${headerCardSize}px`,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                  position: 'fixed',
                  width: `${headerCardSize}px`,
                  zIndex: '70',
                });
                document.body.appendChild(duplicate);
                return [duplicate];
              });
            }

            duplicateCardsRef.current.forEach((duplicate, index) => {
              const card = cardRefs.current[index];
              const slot = slotRefs.current[index];
              if (!card || !slot) return;

              const start = card.getBoundingClientRect();
              const target = slot.getBoundingClientRect();
              const startX = start.left + start.width / 2;
              const startY = start.top + start.height / 2;
              const targetX = target.left + target.width / 2;
              const targetY = target.top + target.height / 2;
              const verticalProgress = clampProgress(travel * 2);
              const horizontalProgress = clampProgress((travel - 0.5) * 2);
              const currentY = startY + (targetY - startY) * verticalProgress;
              const currentX = startX + (targetX - startX) * horizontalProgress;

              Object.assign(duplicate.style, {
                display: 'block',
                left: `${currentX - headerCardSize / 2}px`,
                opacity: '1',
                top: `${currentY - headerCardSize / 2}px`,
              });
            });
            return;
          }

          gsap.set(header, { opacity: 0, y: -72 });
          gsap.set(rail, { opacity: 0 });
          slotRefs.current.forEach((slot) => {
            if (slot) gsap.set(slot, { opacity: 1 });
          });
          duplicateCardsRef.current.forEach((duplicate, index) => {
            const slot = slotRefs.current[index];
            if (!slot) return;
            const target = slot.getBoundingClientRect();
            Object.assign(duplicate.style, {
              display: 'block',
              left: `${target.left + target.width / 2 - headerCardSize / 2}px`,
              opacity: '1',
              top: `${target.top + target.height / 2 - headerCardSize / 2}px`,
            });
          });

          segmentOrder.forEach((segment, order) => {
            const start = 0.77 + order * 0.035;
            const reveal = clampProgress((progress - start) / 0.018);
            gsap.set(segment.element, { opacity: reveal });
          });
        },
      });

      return () => trigger.kill();
    }, hero);

    return () => {
      context.revert();
      clearDuplicates();
    };
  }, [images]);

  const activeImages = images.slice(0, Math.max(1, motionStatement.length));

  return (
    <section
      ref={heroRef}
      className={cn(
        'relative isolate flex h-[100dvh] min-h-[680px] w-full items-center justify-center overflow-hidden bg-white text-[#18181b]',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.76)_0%,rgba(250,250,250,0.32)_46%,rgba(244,244,245,0.72)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(24,24,27,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.045)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div
        ref={headerRef}
        className="absolute inset-0 z-0 will-change-transform"
      >
        <div className="absolute inset-0 overflow-hidden">
          <Swiper
            modules={[Autoplay, EffectFade]}
            effect="fade"
            autoplay={{ delay: 4200, disableOnInteraction: false }}
            loop={images.length > 1}
            speed={1_400}
            className="size-full"
          >
            {images.map((image, index) => (
              <SwiperSlide key={`${image.src}-${index}`} className="size-full">
                <img
                  src={image.src}
                  alt=""
                  aria-hidden="true"
                  className="size-full object-cover"
                  loading="eager"
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.38)_0%,rgba(255,255,255,0.14)_44%,rgba(255,255,255,0.92)_100%)]" />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.78)_39%,rgba(244,244,245,0.2)_73%)]"
        />

        <div className="relative z-10 mx-auto flex size-full max-w-5xl flex-col items-center justify-center px-5 pb-[16%] text-center sm:px-8">
          {eyebrow ? (
            <p className="mb-4 text-[11px] font-semibold tracking-[0.22em] text-[#18181b] uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-serif text-4xl leading-[0.96] font-bold tracking-[-0.06em] text-[#18181b] drop-shadow-[0_8px_20px_rgba(255,255,255,0.8)] sm:text-6xl lg:text-8xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl px-4 py-2 text-base leading-relaxed text-[#3f3f46] drop-shadow-[0_2px_10px_rgba(255,255,255,0.75)] sm:text-lg">
            {description}
          </p>
          {ctaLabel ? (
            <a
              href="/text-to-image"
              className="mt-1 inline-flex text-sm font-semibold text-[#18181b] underline decoration-[#18181b]/35 underline-offset-4 transition-colors hover:text-[#52525b] hover:decoration-[#18181b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18181b]"
            >
              {ctaLabel}
            </a>
          ) : null}
        </div>
      </div>

      <div
        ref={cardRailRef}
        aria-hidden="true"
        className="absolute right-0 bottom-[13%] left-0 z-20 mx-auto flex w-[82%] max-w-[1240px] items-center gap-1.5 will-change-transform sm:gap-2"
      >
        {activeImages.map((image, index) => (
          <div
            key={`${image.src}-${index}`}
            ref={(element) => {
              cardRefs.current[index] = element;
            }}
            className="aspect-[4/5] min-w-0 flex-1 overflow-hidden rounded-md border border-white/60 bg-[#f4f4f5] shadow-[0_14px_36px_rgba(24,24,27,0.12)] will-change-transform"
          >
            <img
              src={image.src}
              alt=""
              className="size-full object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
        ))}
      </div>

      <div className="relative z-30 max-w-[1180px] px-5 text-center sm:px-8">
        <p className="mb-5 text-[10px] font-semibold tracking-[0.24em] text-[#18181b] uppercase opacity-0 motion-reduce:opacity-100">
          Motion control, made personal
        </p>
        <h2 className="font-serif text-[clamp(2.65rem,7.4vw,7.5rem)] leading-[0.92] font-bold tracking-[-0.075em] text-[#18181b]">
          {motionStatement.map((segment, index) => (
            <span key={`${segment}-${index}`} className="inline whitespace-nowrap">
              <span
                ref={(element) => {
                  textRefs.current[index] = element;
                }}
                className="opacity-0 motion-reduce:opacity-100"
              >
                {segment}
              </span>
              <span
                ref={(element) => {
                  slotRefs.current[index] = element;
                }}
                aria-hidden="true"
                className="mx-[0.08em] inline-block size-[0.55em] overflow-hidden rounded-[0.08em] align-[0.05em] opacity-0 shadow-[0_0.12em_0_rgba(24,24,27,0.16)] motion-reduce:opacity-100"
              >
                <img
                  src={activeImages[index]?.src}
                  alt=""
                  className="size-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </span>
            </span>
          ))}
        </h2>
      </div>

    </section>
  );
}

export default HomeHeroLandingScrollAnimation;
