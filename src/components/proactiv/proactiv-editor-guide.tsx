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
  const galleryItems = [...features, ...useCases];

  return (
    <section
      aria-labelledby="editor-guide-heading"
      className="border-y border-zinc-200 bg-zinc-50 py-16 text-[#18181b] sm:py-20"
    >
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
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
          className="mx-auto mt-14 max-w-3xl text-center"
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

type GalleryVisual = {
  focalPoint: string;
  src: string;
};

/** Real editor output keeps this compact gallery grounded in the product. */
const galleryVisuals: readonly GalleryVisual[] = [
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/feature-creative-studio-1788346774203.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/hero-rail-dancer-1787885078354.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/hero-rail-supercar-1787885029070.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/showcase-cool-horse-1787886505859.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/showcase-cool-deer-1787886008380.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/showcase-cool-portrait-1787885969684.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/hero-rail-astronaut-1787885033511.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/motion-showcase-tunnel-dancer-1787702154943.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/motion-showcase-vivid-glass-beads.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/motion-showcase-amber-ribbon-1787702209861.png',
  },
];

/** A dedicated sequence prevents the workflow from repeating feature imagery. */
const guideStepVisuals: readonly GalleryVisual[] = [
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/motion-showcase-perfume-sculpture.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/motion-showcase-vivid-jellyfish.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/motion-showcase-crystal-city-1787702329665.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/motion-showcase-electric-eye-1787702067650.png',
  },
  {
    focalPoint: 'object-center',
    src: '/imgs/generated/motion-showcase-vivid-rainbow-dancer.png',
  },
];

function FeatureGallery({
  items,
  supplementaryTitle,
  title,
}: {
  items: readonly ProactivEditorGuideItem[];
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
        <div className="flex max-w-3xl items-end gap-6">
          <h2
            id={titleId}
            className="text-3xl leading-[1.04] font-semibold tracking-[-0.055em] sm:text-4xl"
          >
            {title}
          </h2>
          <span className="sr-only">{supplementaryTitle}</span>
          <span
            aria-hidden="true"
            className="mb-1 hidden h-px min-w-12 flex-1 bg-zinc-200 sm:block"
          />
        </div>
      </div>

      <div className="mt-7 w-full overflow-x-auto pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul
          className="flex w-max snap-x snap-mandatory gap-4 px-5 transition-opacity duration-300 motion-reduce:transition-none sm:gap-5 sm:px-7 lg:px-[max(2rem,calc((100vw-1180px)/2))] lg:[&:has(li:focus-within)>li:not(:focus-within)]:opacity-65 lg:[&:has(li:hover)>li:not(:hover)]:opacity-65"
          role="list"
        >
          {items.map((item, index) => (
            <li
              key={item.title}
              className="w-[min(80vw,330px)] shrink-0 snap-start transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none sm:w-[min(43vw,330px)] lg:w-[320px] lg:hover:-translate-y-1"
            >
              <GalleryCard
                item={item}
                visual={galleryVisuals[index % galleryVisuals.length]!}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function GalleryCard({
  item,
  visual,
}: {
  item: ProactivEditorGuideItem;
  visual: GalleryVisual;
}) {
  return (
    <article className="group h-full overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_1px_1px_rgb(24_24_27/0.03),0_12px_32px_rgb(24_24_27/0.06)] transition-shadow duration-500 ease-out hover:shadow-[0_20px_48px_rgb(24_24_27/0.12)] motion-reduce:transition-none">
      <figure className="relative aspect-[1.18/1] overflow-hidden bg-zinc-100">
        <picture>
          <img
            src={visual.src}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className={`size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transition-none ${visual.focalPoint}`}
          />
        </picture>
      </figure>
      <div className="min-h-[142px] px-5 py-5 sm:min-h-[150px] sm:px-6 sm:py-6">
        <h3 className="text-base leading-tight font-semibold tracking-[-0.035em] text-zinc-950 sm:text-lg">
          {item.title}
        </h3>
        <p className="mt-2.5 text-sm leading-6 text-zinc-600">
          {item.description}
        </p>
      </div>
    </article>
  );
}

function GuideList({
  items,
  title,
}: {
  items: readonly ProactivEditorGuideItem[];
  title: string;
}) {
  const titleId = 'editor-guide-how-it-works-heading';

  return (
    <section className="mt-14" aria-labelledby={titleId}>
      <h2
        id={titleId}
        className="text-2xl font-semibold tracking-[-0.045em] sm:text-3xl"
      >
        {title}
      </h2>

      <div className="relative left-1/2 mt-6 w-screen -translate-x-1/2">
        <div className="w-full overflow-x-auto pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ol className="flex w-max snap-x snap-mandatory gap-4 px-5 transition-opacity duration-300 motion-reduce:transition-none sm:gap-5 sm:px-7 lg:px-[max(2rem,calc((100vw-1180px)/2))] lg:[&:has(li:focus-within)>li:not(:focus-within)]:opacity-65 lg:[&:has(li:hover)>li:not(:hover)]:opacity-65">
            {items.map((item, index) => {
              const visual = guideStepVisuals[index % guideStepVisuals.length]!;

              return (
                <li
                  key={item.title}
                  className="w-[min(80vw,330px)] shrink-0 snap-start transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none sm:w-[min(43vw,330px)] lg:w-[320px] lg:hover:-translate-y-1"
                >
                  <article className="group overflow-hidden rounded-[22px] border border-zinc-200/90 bg-white shadow-[0_1px_1px_rgb(24_24_27/0.03),0_12px_32px_rgb(24_24_27/0.06)] transition-shadow duration-500 ease-out hover:shadow-[0_20px_48px_rgb(24_24_27/0.12)] motion-reduce:transition-none">
                    <figure className="relative aspect-[1.18/1] overflow-hidden bg-zinc-100">
                      <picture>
                        <img
                          src={visual.src}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className={`size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transition-none ${visual.focalPoint}`}
                        />
                      </picture>
                    </figure>
                    <div className="min-h-[142px] px-5 py-5 sm:min-h-[150px] sm:px-6 sm:py-6">
                      <h3 className="text-base leading-tight font-semibold tracking-[-0.035em] text-zinc-950 sm:text-lg">
                        {`${index + 1}. ${item.title}`}
                      </h3>
                      <p className="mt-2.5 text-sm leading-6 text-zinc-600">
                        {item.description}
                      </p>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
