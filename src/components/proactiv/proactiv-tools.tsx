import { useEffect, useId, useRef, useState } from 'react';
import { Mail, Share2, Terminal, Wrench, type LucideIcon } from 'lucide-react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';

import { cn } from '@/lib/utils';

const BACKDROP_STEPS = ['#08090a', '#171717', '#111827', '#08090a'] as const;

const TOOL_ICONS: LucideIcon[] = [Mail, Share2, Terminal, Terminal];

export type ProactivTool = {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
};

export type ProactivToolsHeading = {
  title: string;
  description: string;
};

export interface ProactivToolsProps {
  heading: ProactivToolsHeading;
  tools: readonly ProactivTool[];
  className?: string;
}

function useDesktopLayout() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const updateMatch = () => setIsDesktop(query.matches);

    updateMatch();
    query.addEventListener('change', updateMatch);

    return () => query.removeEventListener('change', updateMatch);
  }, []);

  return isDesktop;
}

function ToolRow({
  index,
  tool,
  total,
  scrollYProgress,
  animateOnScroll,
}: {
  index: number;
  tool: ProactivTool;
  total: number;
  scrollYProgress: MotionValue<number>;
  animateOnScroll: boolean;
}) {
  const Icon = TOOL_ICONS[index % TOOL_ICONS.length] ?? Terminal;
  const start = index / total;
  const end = (index + 1) / total;
  const middle = start + (end - start) / 2;
  const imageFadeStart = start + (end - start) * 0.2;
  const imageFadeEnd = start + (end - start) * 0.8;

  const copyY = useTransform(scrollYProgress, [start, end], [0, 250]);
  const copyOpacity = useTransform(
    scrollYProgress,
    [start, imageFadeStart, middle, imageFadeEnd, end],
    [0, 1, 1, 0, 0]
  );
  const visualY = useTransform(scrollYProgress, [start, end], [0, -200]);
  const firstVisualOpacity = useTransform(
    scrollYProgress,
    [start, imageFadeStart, middle, imageFadeEnd, end],
    [0, 0, 1, 1, 0]
  );

  const copyStyle = animateOnScroll
    ? { y: copyY, opacity: copyOpacity }
    : undefined;
  const visualStyle = animateOnScroll
    ? { y: visualY, opacity: index === 0 ? firstVisualOpacity : 1 }
    : undefined;

  return (
    <article className="grid min-w-0 gap-10 lg:my-40 lg:grid-cols-3 lg:gap-8">
      <div className="min-w-0">
        <motion.div style={copyStyle}>
          <Icon
            aria-hidden="true"
            className="mb-3 size-8 text-cyan-400"
            strokeWidth={1.8}
          />
          <h3 className="text-2xl font-bold tracking-tight text-white lg:text-4xl">
            {tool.title}
          </h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed font-bold text-neutral-500 md:text-base lg:text-lg">
            {tool.description}
          </p>
        </motion.div>
      </div>

      <motion.div
        className="min-w-0 self-start lg:col-span-2"
        style={visualStyle}
      >
        <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-2xl shadow-black/60">
          <img
            alt={tool.imageAlt ?? `${tool.title} product interface`}
            className="block h-auto w-full rounded-lg"
            src={tool.imageSrc}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-px w-40 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
          />
        </div>
      </motion.div>
    </article>
  );
}

export function ProactivTools({
  heading,
  tools,
  className,
}: ProactivToolsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingId = useId();
  const isDesktop = useDesktopLayout();
  const prefersReducedMotion = useReducedMotion();
  const [backdrop, setBackdrop] = useState<(typeof BACKDROP_STEPS)[number]>(
    BACKDROP_STEPS[0]
  );
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const animateOnScroll = isDesktop && !prefersReducedMotion;

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const nextIndex = Math.min(
      BACKDROP_STEPS.length - 1,
      Math.round(progress * (BACKDROP_STEPS.length - 1))
    );
    const nextBackdrop = BACKDROP_STEPS[nextIndex] ?? BACKDROP_STEPS[0];

    setBackdrop((currentBackdrop) =>
      currentBackdrop === nextBackdrop ? currentBackdrop : nextBackdrop
    );
  });

  return (
    <motion.section
      ref={sectionRef}
      aria-labelledby={headingId}
      animate={{ backgroundColor: backdrop }}
      className={cn(
        'overflow-hidden bg-[#08090a] py-20 text-white md:py-40',
        className
      )}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
    >
      <header className="mx-auto max-w-3xl px-6 text-center lg:px-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400 shadow-[0_0_32px_rgba(34,211,238,0.12)]">
          <Wrench aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </div>
        <h2
          id={headingId}
          className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          {heading.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg">
          {heading.description}
        </p>
      </header>

      <div className="mx-auto mt-10 grid max-w-7xl gap-10 px-6 lg:mt-0 lg:max-w-[1280px] lg:gap-0 lg:px-10">
        {tools.map((tool, index) => (
          <ToolRow
            key={`${tool.title}-${index}`}
            animateOnScroll={animateOnScroll}
            index={index}
            scrollYProgress={scrollYProgress}
            tool={tool}
            total={tools.length}
          />
        ))}
      </div>
    </motion.section>
  );
}
