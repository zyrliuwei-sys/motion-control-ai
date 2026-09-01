import { useEffect, useId, useRef, useState } from 'react';
import type { ProactivFaq as ProactivFaqItem } from '@/types/proactiv';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

type GridLineProps = {
  className?: string;
  offset?: string;
};

function GridLineHorizontal({ className, offset = '88px' }: GridLineProps) {
  return (
    <span
      aria-hidden="true"
      style={{ '--faq-line-offset': offset } as React.CSSProperties}
      className={cn(
        'pointer-events-none absolute left-[calc(var(--faq-line-offset)/-2)] h-px w-[calc(100%+var(--faq-line-offset))] bg-[linear-gradient(to_right,rgba(201,47,104,0.34),rgba(201,47,104,0.34)_50%,transparent_0,transparent)] [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent)] bg-size-[5px_1px]',
        className
      )}
    />
  );
}

function GridLineVertical({ className, offset = '88px' }: GridLineProps) {
  return (
    <span
      aria-hidden="true"
      style={{ '--faq-line-offset': offset } as React.CSSProperties}
      className={cn(
        'pointer-events-none absolute top-[calc(var(--faq-line-offset)/-2)] h-[calc(100%+var(--faq-line-offset))] w-px bg-[linear-gradient(to_bottom,rgba(201,47,104,0.34),rgba(201,47,104,0.34)_50%,transparent_0,transparent)] [mask-image:linear-gradient(to_bottom,transparent,black_16%,black_84%,transparent)] bg-size-[1px_5px]',
        className
      )}
    />
  );
}

export function ProactivFaq({
  title,
  faqs,
}: {
  title: string;
  faqs: ProactivFaqItem[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const idPrefix = useId().replace(/[^a-zA-Z0-9]/g, '');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setActiveId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <section
      id="faq"
      className="scroll-mt-24 bg-white px-5 py-16 text-[#18181b] sm:px-8 sm:py-20 lg:py-28"
      aria-labelledby={`${idPrefix}-heading`}
    >
      <div className="mx-auto w-full max-w-4xl">
        <header className="text-center">
          <h2
            id={`${idPrefix}-heading`}
            className="text-4xl leading-[1.02] font-semibold tracking-[-0.055em] sm:text-5xl"
          >
            {title}
          </h2>
        </header>

        <div
          ref={containerRef}
          className="relative mt-10 flex flex-col gap-3 sm:mt-14 sm:px-8"
        >
          {faqs.map((faq, index) => {
            const id = `${idPrefix}-faq-${index}`;
            const isActive = activeId === id;
            const answerId = `${id}-answer`;

            return (
              <article
                key={faq.question}
                className={cn(
                  'relative rounded-2xl transition-[background-color,box-shadow,transform] duration-200',
                  isActive
                    ? 'bg-white shadow-[0_14px_36px_rgba(21,32,43,0.08)] ring-1 ring-[#c92f68]/20'
                    : 'hover:bg-[#fff8fa]'
                )}
              >
                {isActive ? (
                  <div
                    className="pointer-events-none absolute inset-0"
                    aria-hidden="true"
                  >
                    <GridLineHorizontal className="-top-px" />
                    <GridLineHorizontal className="-bottom-px" />
                    <GridLineVertical className="-left-px" />
                    <GridLineVertical className="-right-px" />
                  </div>
                ) : null}

                <button
                  type="button"
                  aria-expanded={isActive}
                  aria-controls={answerId}
                  onClick={() => setActiveId(isActive ? null : id)}
                  className="group relative flex w-full items-center justify-between gap-5 rounded-2xl px-5 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c92f68] sm:px-7 sm:py-6"
                >
                  <span className="text-base font-semibold tracking-[-0.015em] text-[#15202b] sm:text-lg">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isActive ? 45 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-200',
                      isActive
                        ? 'border-[#c92f68] bg-[#c92f68] text-white'
                        : 'border-[#d6e0e7] bg-white text-[#627181] group-hover:border-[#efb0c4] group-hover:text-[#c92f68]'
                    )}
                  >
                    <Plus
                      className="size-4"
                      aria-hidden="true"
                      strokeWidth={2}
                    />
                  </motion.span>
                </button>

                <motion.div
                  id={answerId}
                  role="region"
                  aria-label={faq.question}
                  aria-hidden={!isActive}
                  initial={false}
                  animate={{
                    gridTemplateRows: isActive ? '1fr' : '0fr',
                    opacity: isActive ? 1 : 0,
                  }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  className="relative grid"
                >
                  <div className="overflow-hidden">
                    <p className="max-w-3xl px-5 pb-5 text-sm leading-7 text-[#627181] sm:px-7 sm:pb-6 sm:text-base">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
