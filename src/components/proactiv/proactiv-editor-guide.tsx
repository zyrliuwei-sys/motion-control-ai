import {
  Aperture,
  Download,
  ImagePlus,
  Megaphone,
  Palette,
  PanelsTopLeft,
  ScanLine,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

export type ProactivEditorGuideItem = {
  description: string;
  title: string;
};

export interface ProactivEditorGuideProps {
  comparison: string;
  comparisonTitle: string;
  definition: string;
  definitionLinkLabel: string;
  features: readonly ProactivEditorGuideItem[];
  featuresTitle: string;
  howItWorksLinkLabel: string;
  howItWorksTitle: string;
  steps: readonly ProactivEditorGuideItem[];
  title: string;
  useCases: readonly ProactivEditorGuideItem[];
  useCasesTitle: string;
}

/** Server-rendered editorial guidance for people evaluating the image editor. */
export function ProactivEditorGuide({
  comparison,
  comparisonTitle,
  definition,
  definitionLinkLabel,
  features,
  featuresTitle,
  howItWorksLinkLabel,
  howItWorksTitle,
  steps,
  title,
  useCases,
  useCasesTitle,
}: ProactivEditorGuideProps) {
  const galleryItems: readonly GalleryItem[] = [
    ...features.map((item) => ({ ...item, variant: 'feature' as const })),
    ...useCases.map((item) => ({ ...item, variant: 'use-case' as const })),
  ];

  return (
    <section
      aria-labelledby="editor-guide-heading"
      className="border-y border-zinc-200 bg-zinc-50 py-16 text-[#18181b] sm:py-20"
    >
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7 lg:px-8">
        <header className="max-w-3xl">
          <h2
            id="editor-guide-heading"
            className="text-3xl leading-[1.02] font-semibold tracking-[-0.055em] sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-4 text-base leading-7 text-[#52525b]">
            {definition}
          </p>
          <a
            href="/text-to-image"
            className="mt-4 inline-flex text-sm font-semibold text-[#18181b] underline decoration-[#18181b]/35 underline-offset-4 transition-colors hover:text-[#52525b] hover:decoration-[#18181b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18181b]"
          >
            {definitionLinkLabel}
          </a>
        </header>

        <GuideList title={howItWorksTitle} items={steps} />
        <a
          href="/text-to-image"
          className="mt-5 inline-flex text-sm font-semibold text-[#18181b] underline decoration-[#18181b]/35 underline-offset-4 transition-colors hover:text-[#52525b] hover:decoration-[#18181b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18181b]"
        >
          {howItWorksLinkLabel}
        </a>

        <FeatureGallery
          title={featuresTitle}
          supplementaryTitle={useCasesTitle}
          items={galleryItems}
        />

        <section
          className="mt-14 max-w-3xl"
          aria-labelledby="comparison-heading"
        >
          <h2
            id="comparison-heading"
            className="text-2xl font-semibold tracking-[-0.045em] sm:text-3xl"
          >
            {comparisonTitle}
          </h2>
          <p className="mt-4 text-base leading-7 text-[#52525b]">
            {comparison}
          </p>
        </section>
      </div>
    </section>
  );
}

type GalleryVariant = 'feature' | 'use-case';

type GalleryItem = ProactivEditorGuideItem & {
  variant: GalleryVariant;
};

type GalleryVisual = {
  accent: string;
  icon: LucideIcon;
  surface: string;
};

const featureVisuals: readonly GalleryVisual[] = [
  {
    accent: 'text-violet-700',
    icon: WandSparkles,
    surface:
      'bg-[radial-gradient(circle_at_68%_28%,rgba(196,181,253,.88),transparent_24%),linear-gradient(145deg,#f8f7ff_0%,#e8e5ff_100%)]',
  },
  {
    accent: 'text-fuchsia-700',
    icon: ImagePlus,
    surface:
      'bg-[radial-gradient(circle_at_22%_72%,rgba(251,207,232,.9),transparent_29%),linear-gradient(145deg,#fff8fc_0%,#f6e2f0_100%)]',
  },
  {
    accent: 'text-sky-700',
    icon: SlidersHorizontal,
    surface:
      'bg-[radial-gradient(circle_at_76%_24%,rgba(186,230,253,.95),transparent_26%),linear-gradient(145deg,#f4fbff_0%,#dcedf7_100%)]',
  },
  {
    accent: 'text-emerald-700',
    icon: ScanLine,
    surface:
      'bg-[radial-gradient(circle_at_28%_36%,rgba(167,243,208,.95),transparent_27%),linear-gradient(145deg,#f6fffb_0%,#dff6ec_100%)]',
  },
  {
    accent: 'text-amber-700',
    icon: Download,
    surface:
      'bg-[radial-gradient(circle_at_72%_28%,rgba(253,230,138,.93),transparent_26%),linear-gradient(145deg,#fffdf6_0%,#f8efd3_100%)]',
  },
  {
    accent: 'text-rose-700',
    icon: Sparkles,
    surface:
      'bg-[radial-gradient(circle_at_25%_32%,rgba(254,205,211,.96),transparent_27%),linear-gradient(145deg,#fff8f9_0%,#f8e3e8_100%)]',
  },
];

const useCaseVisuals: readonly GalleryVisual[] = [
  {
    accent: 'text-orange-700',
    icon: Palette,
    surface:
      'bg-[radial-gradient(circle_at_72%_28%,rgba(254,215,170,.96),transparent_26%),linear-gradient(145deg,#fffaf5_0%,#f7e6d8_100%)]',
  },
  {
    accent: 'text-blue-700',
    icon: Megaphone,
    surface:
      'bg-[radial-gradient(circle_at_24%_28%,rgba(191,219,254,.95),transparent_28%),linear-gradient(145deg,#f6faff_0%,#e1ebf9_100%)]',
  },
  {
    accent: 'text-purple-700',
    icon: Aperture,
    surface:
      'bg-[radial-gradient(circle_at_72%_34%,rgba(221,214,254,.98),transparent_28%),linear-gradient(145deg,#faf8ff_0%,#ebe5f7_100%)]',
  },
  {
    accent: 'text-teal-700',
    icon: PanelsTopLeft,
    surface:
      'bg-[radial-gradient(circle_at_28%_30%,rgba(153,246,228,.86),transparent_27%),linear-gradient(145deg,#f4fffc_0%,#dcefe9_100%)]',
  },
];

function FeatureGallery({
  items,
  supplementaryTitle,
  title,
}: {
  items: readonly GalleryItem[];
  supplementaryTitle: string;
  title: string;
}) {
  const titleId = 'editor-guide-gallery-heading';

  return (
    <section
      className="relative left-1/2 mt-16 w-screen -translate-x-1/2"
      aria-labelledby={titleId}
    >
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7 lg:px-8">
        <div className="flex max-w-3xl items-end justify-between gap-6">
          <h2
            id={titleId}
            className="text-3xl leading-[1.04] font-semibold tracking-[-0.055em] sm:text-4xl"
          >
            {title}
          </h2>
          <span className="sr-only">{supplementaryTitle}</span>
          <span
            aria-hidden="true"
            className="mb-1 hidden h-px min-w-20 flex-1 bg-zinc-200 sm:block"
          />
        </div>
      </div>

      <div className="mt-7 w-full overflow-x-auto pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul
          className="flex w-max snap-x snap-mandatory gap-4 px-5 sm:gap-5 sm:px-7 lg:mx-auto lg:px-8"
          role="list"
        >
          {items.map((item, index) => {
            const visualIndex = items
              .slice(0, index)
              .filter(
                (previousItem) => previousItem.variant === item.variant
              ).length;
            const visuals =
              item.variant === 'feature' ? featureVisuals : useCaseVisuals;

            return (
              <li
                key={item.title}
                className="w-[min(84vw,390px)] shrink-0 snap-start sm:w-[410px] lg:w-64"
              >
                <GalleryCard
                  item={item}
                  visual={visuals[visualIndex % visuals.length]}
                  visualIndex={visualIndex}
                  variant={item.variant}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function GalleryCard({
  item,
  variant,
  visual,
  visualIndex,
}: {
  item: ProactivEditorGuideItem;
  variant: GalleryVariant;
  visual: GalleryVisual;
  visualIndex: number;
}) {
  const Icon = visual.icon;

  return (
    <article className="group relative flex h-[430px] overflow-hidden rounded-[30px] border border-zinc-200 bg-white shadow-[0_1px_1px_rgba(24,24,27,.02)] transition duration-500 ease-out hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_24px_60px_rgba(24,24,27,.12)] sm:h-[458px] lg:h-[272px] lg:rounded-2xl">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pt-7 sm:px-8 sm:pt-8 lg:px-4 lg:pt-4">
        <span
          aria-hidden="true"
          className={cn(
            'grid size-10 place-items-center rounded-full bg-zinc-950/[.045] lg:size-7',
            visual.accent
          )}
        >
          <Icon className="size-[19px] stroke-[1.8] lg:size-3.5" />
        </span>
        <h3 className="mt-5 text-[22px] leading-tight font-semibold tracking-[-0.04em] text-[#18181b] lg:mt-3 lg:text-sm">
          {item.title}
        </h3>
        <p className="mt-3 max-w-[31rem] text-base leading-7 text-[#52525b] lg:mt-1.5 lg:text-[11px] lg:leading-4">
          {item.description}
        </p>

        <GalleryVisualPanel
          visualIndex={visualIndex}
          surface={visual.surface}
          variant={variant}
        />
      </div>
    </article>
  );
}

function GalleryVisualPanel({
  surface,
  variant,
  visualIndex,
}: {
  surface: string;
  variant: GalleryVariant;
  visualIndex: number;
}) {
  const layout = (visualIndex + (variant === 'feature' ? 0 : 1)) % 4;

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative mt-7 min-h-0 flex-1 overflow-hidden rounded-t-[24px] border border-b-0 border-white/75 transition-transform duration-700 ease-out group-hover:scale-[1.025] lg:mt-4 lg:rounded-t-[15px]',
        surface
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.46),transparent_47%)]" />
      {layout === 0 && <PromptCanvas />}
      {layout === 1 && <ReferenceCanvas />}
      {layout === 2 && <ControlCanvas />}
      {layout === 3 && <ImageCanvas />}
    </div>
  );
}

function PromptCanvas() {
  return (
    <div className="absolute inset-x-7 top-7 bottom-0 rounded-t-[19px] border border-zinc-950/10 bg-white/80 p-4 shadow-[0_-10px_35px_rgba(63,45,110,.08)] backdrop-blur-sm sm:inset-x-9 sm:p-5">
      <div className="h-2.5 w-20 rounded-full bg-zinc-950/12" />
      <div className="mt-4 rounded-xl border border-zinc-950/8 bg-white p-3">
        <div className="h-2 w-4/5 rounded-full bg-violet-500/28" />
        <div className="mt-2 h-2 w-3/5 rounded-full bg-zinc-950/10" />
      </div>
      <div className="absolute right-5 bottom-5 grid size-11 place-items-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-600/25">
        <WandSparkles className="size-5 text-white" />
      </div>
    </div>
  );
}

function ReferenceCanvas() {
  return (
    <div className="absolute inset-x-7 top-7 bottom-0 sm:inset-x-9">
      <div className="absolute bottom-0 left-0 h-[72%] w-[66%] rotate-[-7deg] overflow-hidden rounded-t-[20px] border border-white/80 bg-[linear-gradient(135deg,#fcd7e5_0%,#b9b6fa_45%,#fee3bd_100%)] shadow-[0_-12px_35px_rgba(99,69,104,.13)]">
        <div className="absolute -right-8 -bottom-9 size-36 rounded-full bg-white/45 blur-md" />
        <div className="absolute top-6 left-6 size-12 rounded-full bg-white/65" />
      </div>
      <div className="absolute right-0 bottom-0 h-[79%] w-[67%] rotate-[8deg] overflow-hidden rounded-t-[20px] border border-white/80 bg-[linear-gradient(145deg,#bddfff_0%,#f7d0ee_54%,#ffe7b9_100%)] shadow-[0_-12px_35px_rgba(63,45,110,.12)]">
        <div className="absolute -top-10 left-6 size-36 rounded-full bg-white/50 blur-xl" />
        <div className="absolute right-7 bottom-7 h-12 w-20 rounded-full bg-white/55" />
      </div>
    </div>
  );
}

function ControlCanvas() {
  return (
    <div className="absolute inset-x-7 top-7 bottom-0 rounded-t-[19px] border border-zinc-950/10 bg-white/80 p-5 shadow-[0_-10px_35px_rgba(41,86,120,.09)] backdrop-blur-sm sm:inset-x-9">
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-24 rounded-full bg-zinc-950/12" />
        <div className="size-5 rounded-full border-2 border-sky-500/70 bg-sky-100" />
      </div>
      <div className="mt-6 space-y-5">
        {[0.7, 0.48, 0.84].map((width, index) => (
          <div key={index}>
            <div className="flex items-center justify-between">
              <div className="h-2 w-12 rounded-full bg-zinc-950/10" />
              <div className="h-2 w-7 rounded-full bg-zinc-950/8" />
            </div>
            <div className="relative mt-2 h-1.5 rounded-full bg-zinc-950/8">
              <div
                className="h-full rounded-full bg-sky-500/70"
                style={{ width: `${width * 100}%` }}
              />
              <span
                className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-white bg-sky-600 shadow-sm"
                style={{ left: `calc(${width * 100}% - 6px)` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageCanvas() {
  return (
    <div className="absolute inset-x-7 top-7 bottom-0 overflow-hidden rounded-t-[20px] border border-white/80 bg-zinc-950 shadow-[0_-10px_35px_rgba(24,24,27,.16)] sm:inset-x-9">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(255,255,255,.55),transparent_7%),radial-gradient(circle_at_29%_71%,rgba(255,221,159,.85),transparent_13%),linear-gradient(135deg,#30207b_0%,#d65b9c_48%,#ffcf86_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(140deg,transparent_12%,rgba(21,17,42,.2)_13%_28%,transparent_29%_42%,rgba(20,18,36,.27)_43%)]" />
      <div className="absolute right-5 bottom-5 flex items-center gap-2 rounded-full border border-white/30 bg-white/18 px-3 py-1.5 text-[10px] font-semibold tracking-[.08em] text-white backdrop-blur-sm">
        <Download className="size-3" />
        <span>PNG</span>
      </div>
    </div>
  );
}

function GuideList({
  items,
  title,
}: {
  items: readonly ProactivEditorGuideItem[];
  title: string;
}) {
  return (
    <section className="mt-14" aria-label={title}>
      <h2 className="text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">
        {title}
      </h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <li
            key={item.title}
            className="rounded-2xl border border-zinc-200 bg-white p-5"
          >
            <h3 className="text-base font-semibold tracking-[-0.02em]">
              {`${index + 1}. ${item.title}`}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#52525b]">
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
