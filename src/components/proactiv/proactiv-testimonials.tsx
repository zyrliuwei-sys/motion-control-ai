import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

const AVATAR_TRANSITION = {
  duration: 0.7,
  ease: [0.68, -0.3, 0.32, 1] as const,
};

export type ProactivTestimonial = {
  name: string;
  quote: string;
  avatarSrc: string;
  designation?: string;
};

export type ProactivTestimonialsHeading = {
  title: string;
  description: string;
};

export interface ProactivTestimonialsProps {
  heading: ProactivTestimonialsHeading;
  testimonials: ProactivTestimonial[];
  className?: string;
}

function TestimonialWall({
  testimonials,
}: {
  testimonials: ProactivTestimonial[];
}) {
  const columns = Array.from({ length: 4 }, (_, columnIndex) =>
    testimonials.filter(
      (_, testimonialIndex) => testimonialIndex % 4 === columnIndex
    )
  );

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden [mask-image:radial-gradient(circle_at_center,transparent_10%,black_90%)] opacity-30"
    >
      <div className="absolute left-1/2 grid min-w-[1088px] -translate-x-1/2 grid-cols-4 gap-4 px-4">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="grid content-start gap-4">
            {column.map((testimonial, testimonialIndex) => (
              <article
                key={`${testimonial.name}-${testimonialIndex}`}
                className="flex min-h-[242px] flex-col rounded-xl border border-white/10 bg-[rgba(40,40,40,0.30)] p-8 shadow-[2px_4px_16px_0_rgba(248,248,248,0.06)_inset]"
              >
                <p className="text-base leading-relaxed font-semibold text-white">
                  {testimonial.quote}
                </p>
                <div className="mt-auto flex items-center gap-3 pt-8">
                  <img
                    alt={testimonial.name}
                    className="size-10 rounded-full object-cover"
                    loading="lazy"
                    src={testimonial.avatarSrc}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-300">
                      {testimonial.name}
                    </p>
                    {testimonial.designation ? (
                      <p className="truncate text-sm text-neutral-500">
                        {testimonial.designation}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProactivTestimonials({
  heading,
  testimonials,
  className,
}: ProactivTestimonialsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const activeTestimonial = testimonials[activeIndex];

  useEffect(() => {
    if (activeIndex < testimonials.length) return;
    setActiveIndex(0);
  }, [activeIndex, testimonials.length]);

  useEffect(() => {
    if (prefersReducedMotion || !isAutoRotating || testimonials.length < 2) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) =>
        currentIndex + 1 === testimonials.length ? 0 : currentIndex + 1
      );
    }, 7000);

    return () => window.clearInterval(interval);
  }, [isAutoRotating, prefersReducedMotion, testimonials.length]);

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-[#08090a] text-white',
        className
      )}
    >
      <header className="mx-auto max-w-3xl px-6 pt-20 text-center md:pt-32">
        <div className="mx-auto flex size-14 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400 shadow-[0_0_32px_rgba(34,211,238,0.12)]">
          <svg
            aria-hidden="true"
            className="size-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m13 2-9 12h7l-1 8 10-13h-7V2Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {heading.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-400">
          {heading.description}
        </p>
      </header>

      <div className="relative py-60">
        <TestimonialWall testimonials={testimonials} />

        <div className="relative z-10 mx-auto h-80 max-w-[768px] px-6 text-center sm:px-8">
          {activeTestimonial ? (
            <>
              <div className="relative h-40 [mask-image:linear-gradient(0deg,transparent,#fff_30%,#fff)] md:[mask-image:linear-gradient(0deg,transparent,#fff_40%,#fff)]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-1/2 size-[480px] -translate-x-1/2 rounded-full border border-neutral-400/20 bg-[radial-gradient(circle_at_50%_0%,rgba(163,163,163,0.20),transparent_45%)] shadow-[inset_0_0_0_1px_rgba(23,23,23,1)]"
                />
                {prefersReducedMotion ? (
                  <img
                    alt={activeTestimonial.name}
                    className="absolute top-11 left-1/2 size-14 -translate-x-1/2 rounded-full object-cover shadow-lg shadow-black/30"
                    loading="lazy"
                    src={activeTestimonial.avatarSrc}
                  />
                ) : (
                  <AnimatePresence initial={false} mode="wait">
                    <motion.img
                      key={activeTestimonial.name}
                      alt={activeTestimonial.name}
                      animate={{ opacity: 1, rotate: 0 }}
                      className="absolute top-11 left-1/2 size-14 -translate-x-1/2 rounded-full object-cover shadow-lg shadow-black/30"
                      exit={{ opacity: 0, rotate: 60 }}
                      initial={{ opacity: 0, rotate: -60 }}
                      loading="lazy"
                      src={activeTestimonial.avatarSrc}
                      transition={AVATAR_TRANSITION}
                    />
                  </AnimatePresence>
                )}
              </div>

              <div className="mb-10 px-2 sm:px-6">
                {prefersReducedMotion ? (
                  <blockquote className="text-lg leading-relaxed font-bold text-neutral-100 sm:text-xl">
                    {activeTestimonial.quote}
                  </blockquote>
                ) : (
                  <AnimatePresence initial={false} mode="wait">
                    <motion.blockquote
                      key={activeTestimonial.name}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-lg leading-relaxed font-bold text-neutral-100 sm:text-xl"
                      exit={{
                        opacity: 0,
                        x: 16,
                        transition: {
                          duration: 0.3,
                          delay: 0.3,
                          ease: 'easeOut',
                        },
                      }}
                      initial={{ opacity: 0, x: -16 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.2,
                        ease: 'easeInOut',
                      }}
                    >
                      {activeTestimonial.quote}
                    </motion.blockquote>
                  </AnimatePresence>
                )}
              </div>
            </>
          ) : null}

          <div className="-m-1.5 flex flex-wrap justify-center px-2 sm:px-6">
            {testimonials.map((testimonial, index) => (
              <button
                key={`${testimonial.name}-${index}`}
                aria-pressed={activeIndex === index}
                className={cn(
                  'm-1.5 rounded-full border px-2 py-1 text-xs text-neutral-300 transition-colors duration-150',
                  'bg-[linear-gradient(#171717,#171717)_padding-box,conic-gradient(from_135deg,rgba(163,163,163,.5),rgba(64,64,64,.65)_25%,rgba(64,64,64,.65)_75%,rgba(163,163,163,.5))_border-box]',
                  activeIndex === index
                    ? 'border-cyan-400/70 text-white shadow-[0_0_14px_rgba(34,211,238,0.12)]'
                    : 'border-transparent opacity-70 hover:opacity-100'
                )}
                onClick={() => {
                  setActiveIndex(index);
                  setIsAutoRotating(false);
                }}
                type="button"
              >
                <span className="font-bold text-neutral-50">
                  {testimonial.name}
                </span>
                {testimonial.designation ? (
                  <span className="hidden sm:inline">
                    <span className="mx-1 text-neutral-600">-</span>
                    {testimonial.designation}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#08090a] to-transparent"
      />
    </section>
  );
}
