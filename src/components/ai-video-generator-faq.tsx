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
import { getLocale } from '@/paraglide/runtime.js';

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

function faqSections(locale: 'en' | 'zh'): FaqSection[] {
  if (locale === 'zh') {
    return [
      {
        items: [
          {
            question: '这是无过滤的 AI 视频生成器吗？',
            answer:
              '我们不会改写或弱化你的动作提示词，也不会因为成人、黑暗或非传统主题直接拒绝。生成成人内容必须年满 18 岁，你需要遵守所在地法律以及发布平台规则。',
          },
          {
            question: '应该选择哪种生成模式？',
            answer:
              '想生成新场景选择文字生视频；想让静态图片动起来选择图片生视频；需要保持视觉方向时选择参考生视频。',
          },
          {
            question: '生成一条视频需要多久？',
            answer:
              '生成任务是异步的，完成时间取决于服务商队列。工作区会显示排队和完成状态，目前没有承诺固定完成时间。',
          },
          {
            question: '手机上可以使用吗？',
            answer:
              '可以。工作区支持手机和平板浏览器，9:16 预设适合竖屏视频；批量处理在桌面端更方便。',
          },
        ],
      },
      {
        items: [
          {
            question: '需要登录或免费额度吗？',
            answer:
              '当前流程需要登录，并且账户需要先有付费积分才可以生成视频，不支持免登录生成。',
          },
          {
            question: '视频有水印吗？可以商用吗？',
            answer:
              '当前流程不会额外添加产品水印，但服务商规则和套餐条款可能适用。商用前请确认你拥有上传素材的合法权利，并查看最新价格和服务条款。',
          },
          {
            question: '会保留我的提示词和上传内容吗？',
            answer: (
              <>
                提示词和上传内容会用于执行生成任务，并按照{' '}
                <Link
                  href="/privacy-policy"
                  className="font-medium text-[#0aa8a7] underline underline-offset-4"
                >
                  隐私政策
                </Link>{' '}
                处理和保存。请不要上传你无权处理的素材。
              </>
            ),
          },
          {
            question: '如何从图片开始制作视频？',
            answer: (
              <>
                你可以先在{' '}
                <Link
                  href="/text-to-image"
                  className="font-medium text-[#0aa8a7] underline underline-offset-4"
                >
                  AI 图片编辑器
                </Link>{' '}
                中制作图片，再回到这里使用图片生视频或参考生视频。
              </>
            ),
          },
        ],
      },
    ];
  }

  return [
    {
      items: [
        {
          question: 'Is this AI video generator really unfiltered?',
          answer:
            'We do not rewrite or soften your motion prompts, and we do not directly refuse adult, dark, or unconventional themes. You must be 18 or older to generate adult content and must follow the laws of your country and the rules of the platform where you publish it.',
        },
        {
          question: 'Which mode should I choose?',
          answer:
            'Use Text to Video for a new scene, Image to Video to animate a still, or Reference to Video when a visual direction matters.',
        },
        {
          question: 'How long does one video take to generate?',
          answer:
            'Generation is asynchronous and depends on the provider queue. The workspace shows queued and ready states instead of promising a fixed completion time.',
        },
        {
          question: 'Does it work on mobile?',
          answer:
            'Yes. The studio runs in phone and tablet browsers, and the 9:16 preset is designed for vertical output. Batch work is still faster on desktop.',
        },
      ],
    },
    {
      items: [
        {
          question: 'Do I need an account or a free balance?',
          answer:
            'You must be signed in and have a paid credit grant before video generation. Guest generation is not enabled in the current flow.',
        },
        {
          question: 'Are there watermarks or commercial-use rights?',
          answer:
            'The current flow does not add a product watermark, but provider output rules and plan terms may apply. Confirm that you own the rights to uploaded material before commercial use.',
        },
        {
          question: 'Do you keep my prompts and uploads?',
          answer: (
            <>
              Prompts and uploads are processed to run the requested generation
              and handled according to the{' '}
              <Link
                href="/privacy-policy"
                className="font-medium text-[#0aa8a7] underline underline-offset-4"
              >
                privacy policy
              </Link>
              . Do not upload material you are not authorized to process.
            </>
          ),
        },
        {
          question: 'How do I make a video from an image?',
          answer: (
            <>
              Make a still in the{' '}
              <Link
                href="/text-to-image"
                className="font-medium text-[#0aa8a7] underline underline-offset-4"
              >
                AI image editor
              </Link>{' '}
              first, then return here and choose Image to Video or Reference to
              Video.
            </>
          ),
        },
      ],
    },
  ];
}

export function AiVideoGeneratorFaq() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const idPrefix = useId().replace(/[^a-zA-Z0-9]/g, '');
  const locale = getLocale() === 'zh' ? 'zh' : 'en';
  const items = faqSections(locale).flatMap((section) => section.items);
  const copy =
    locale === 'zh'
      ? {
          eyebrow: '快速解答',
          title: '常见问题',
          description: '关于提示词、积分、输出和工作区数据处理的实用说明。',
        }
      : {
          eyebrow: 'Quick answers',
          title: 'FAQ',
          description:
            'Practical details about prompts, credits, output, and keeping your work in the studio.',
        };

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
            {copy.eyebrow}
          </p>
          <h2
            id={`${idPrefix}-heading`}
            className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#354144] sm:text-4xl"
          >
            {copy.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#718083] sm:text-base">
            {copy.description}
          </p>
        </header>

        <div
          ref={containerRef}
          className="mt-12 flex flex-col gap-3 sm:mt-14 sm:px-8"
        >
          {items.map((faq, index) => {
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
