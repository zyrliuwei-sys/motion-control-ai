import { useState } from 'react';
import type { ProactivFaq } from '@/types/proactiv';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

export function ProactivFaq({
  title,
  faqs,
}: {
  title: string;
  faqs: ProactivFaq[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="faq"
      className="scroll-mt-24 bg-[#fff8fa] px-8 py-20 text-[#15202b]"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-4xl leading-tight font-medium tracking-tight md:text-5xl">
          {title}
        </h2>
        <div className="mt-20 grid gap-2.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `proactiv-faq-panel-${index}`;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-xl border border-[#ead7df] bg-white shadow-sm"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 p-4 text-left text-base font-bold text-[#15202b]"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 text-[#627181] transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      id={panelId}
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={
                        reduceMotion
                          ? { display: 'none' }
                          : { height: 0, opacity: 0 }
                      }
                      transition={{
                        duration: reduceMotion ? 0 : 0.2,
                        ease: 'easeOut',
                      }}
                    >
                      <p className="px-4 pb-4 text-base leading-relaxed text-[#627181]">
                        {faq.answer}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
