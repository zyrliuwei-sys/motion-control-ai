import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';

type FaqItem = {
  question: string;
  answer: ReactNode;
};

type FaqSection = {
  items: FaqItem[];
};

type GridLineProps = {
  className?: string;
  offset?: string;
};

function GridLineHorizontal({ className, offset = '88px' }: GridLineProps) {
  return (
    <span
      aria-hidden="true"
      style={{ '--faq-line-offset': offset } as CSSProperties}
      className={cn(
        'pointer-events-none absolute left-[calc(var(--faq-line-offset)/-2)] h-px w-[calc(100%+var(--faq-line-offset))] bg-[linear-gradient(to_right,rgba(10,168,167,0.34),rgba(10,168,167,0.34)_50%,transparent_0,transparent)] [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent)] bg-size-[5px_1px]',
        className
      )}
    />
  );
}

function GridLineVertical({ className, offset = '88px' }: GridLineProps) {
  return (
    <span
      aria-hidden="true"
      style={{ '--faq-line-offset': offset } as CSSProperties}
      className={cn(
        'pointer-events-none absolute top-[calc(var(--faq-line-offset)/-2)] h-[calc(100%+var(--faq-line-offset))] w-px bg-[linear-gradient(to_bottom,rgba(10,168,167,0.34),rgba(10,168,167,0.34)_50%,transparent_0,transparent)] [mask-image:linear-gradient(to_bottom,transparent,black_16%,black_84%,transparent)] bg-size-[1px_5px]',
        className
      )}
    />
  );
}

const faqSections: FaqSection[] = [
  {
    items: [
      {
        question: 'Is this AI video generator really unfiltered?',
        answer:
          'Yes. We do not filter, rewrite or refuse motion prompts, and we do not block adult, dark or unconventional themes. What you write is what the model receives. You must be 18 or older to generate adult content, and you are responsible for complying with the laws of your country and the rules of any platform you publish to.',
      },
      {
        question: 'Can I choose aspect ratio and clip length?',
        answer: (
          <>
            Yes. Choose 9:16, 1:1 or 16:9 before generating, and pick the length
            from the options on the panel. {'{{时长选项}}'} Choosing the ratio
            up front gives a better clip than cropping afterwards, and the
            credit cost updates before you generate.
          </>
        ),
      },
      {
        question: 'How long does one video take to generate?',
        answer: (
          <>
            A short clip normally finishes in{' '}
            {'{{生成耗时，如 under a minute}}'}
            at 1K. Busy periods queue and paid plans are prioritised. You can
            leave the tab — the job keeps running and the clip lands in your
            library.
          </>
        ),
      },
      {
        question: 'Does it work on mobile?',
        answer:
          'Yes, the studio runs in the browser on phones and tablets, and the 9:16 preset is built for vertical output. Batch work is still faster on desktop.',
      },
      {
        question: 'How is this different from other AI video generators?',
        answer:
          'Three things: the prompt is not editorialised, the starting frame can be an image you already approved instead of a fresh guess, and the credit cost is visible before the task runs. If you came here looking for an AI video generator with no restrictions, an unfiltered video tool, or an image to video tool with no filter, it is the same feature.',
      },
    ],
  },
  {
    items: [
      {
        question: 'Do I need an account to generate a video?',
        answer: (
          <>
            You need to be signed in, because credits and your generation
            history are tied to your account.{' '}
            {
              '{{免登录说明：如 You can open the studio and try a prompt without an account, but saving the clip requires sign-in.}}'
            }
            Signing in takes a few seconds.
          </>
        ),
      },
      {
        question: 'How many free credits do I get, and how far do they go?',
        answer: (
          <>
            {
              '{{如 New accounts get N credits on signup. A 1K short clip costs M credits, so the free balance is worth roughly X clips.}}'
            }
            Daily {'{{每日赠送}}'} bonus credits keep the free tier usable after
            that. Nothing is charged until you choose a plan.
          </>
        ),
      },
      {
        question: 'Is there a watermark on the video?',
        answer: (
          <>
            {
              '{{水印政策：如 Clips generated on a paid plan download without a watermark. Free-tier output may carry a small mark.}}'
            }
            Check the pricing page for the current policy before you rely on it
            for client work.
          </>
        ),
      },
      {
        question: 'Can I use the videos commercially?',
        answer: (
          <>
            {
              '{{商用政策：如 Yes — paid-plan output can be used commercially.}}'
            }
            You keep responsibility for the rights to any image you upload, and
            for how the finished clip is used.
          </>
        ),
      },
    ],
  },
  {
    items: [
      {
        question: 'Do you keep my prompts and uploads?',
        answer: (
          <>
            {
              '{{数据政策：如 Uploads and prompts are used only to run your generation and are not used to train models.}}'
            }
            Full detail is in the{' '}
            <a
              href="/privacy"
              className="font-medium text-[#0aa8a7] underline underline-offset-4"
            >
              privacy policy
            </a>{' '}
            — read it before uploading anything sensitive.
          </>
        ),
      },
      {
        question: 'Looking for the still-image side instead?',
        answer: (
          <>
            The same account gives you the{' '}
            <Link
              href="/text-to-image"
              className="font-medium text-[#0aa8a7] underline underline-offset-4"
            >
              AI image editor
            </Link>{' '}
            with credit-based generation — make the frame there, then animate it
            here.
          </>
        ),
      },
    ],
  },
];

const faqItems = faqSections.flatMap((section) => section.items);

export function AiVideoGeneratorFaq() {
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
      className="mt-16 border-t border-[#e5ebeb] pt-14 sm:mt-24 sm:pt-20"
      aria-labelledby={`${idPrefix}-heading`}
    >
      <div className="mx-auto w-full max-w-4xl">
        <header className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#0aa8a7] uppercase">
            Quick answers
          </p>
          <h2
            id={`${idPrefix}-heading`}
            className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#354144] sm:text-4xl"
          >
            FAQ
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#718083] sm:text-base">
            The practical details about prompts, credits, output and keeping
            your work in the studio.
          </p>
        </header>

        <div
          ref={containerRef}
          className="mt-12 flex flex-col gap-3 sm:mt-14 sm:px-8"
        >
          {faqItems.map((faq, index) => {
            const id = `${idPrefix}-faq-${index}`;
            const isActive = activeId === id;
            const answerId = `${id}-answer`;

            return (
              <article
                key={faq.question}
                className={cn(
                  'relative rounded-2xl transition-[background-color,box-shadow,transform] duration-200',
                  isActive
                    ? 'bg-white shadow-[0_14px_36px_rgba(10,91,96,0.09)] ring-1 ring-[#0aa8a7]/20'
                    : 'hover:bg-[#f5fbfb]'
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
                  className="group relative flex w-full items-center justify-between gap-5 rounded-2xl px-5 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0aa8a7] sm:px-7 sm:py-6"
                >
                  <span className="text-sm font-semibold tracking-[-0.012em] text-[#354144] sm:text-base">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isActive ? 45 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-200',
                      isActive
                        ? 'border-[#0aa8a7] bg-[#0aa8a7] text-white'
                        : 'border-[#d7e1e1] bg-white text-[#718083] group-hover:border-[#8bd0ce] group-hover:text-[#0aa8a7]'
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
                    <p className="max-w-3xl px-5 pb-5 text-sm leading-7 text-[#718083] sm:px-7 sm:pb-6 sm:text-base">
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
