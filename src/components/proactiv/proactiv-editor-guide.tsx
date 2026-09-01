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

        <GuideList title={howItWorksTitle} items={steps} ordered />
        <a
          href="/text-to-image"
          className="mt-5 inline-flex text-sm font-semibold text-[#18181b] underline decoration-[#18181b]/35 underline-offset-4 transition-colors hover:text-[#52525b] hover:decoration-[#18181b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18181b]"
        >
          {howItWorksLinkLabel}
        </a>

        <GuideList title={featuresTitle} items={features} />
        <GuideList title={useCasesTitle} items={useCases} />

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

function GuideList({
  items,
  ordered = false,
  title,
}: {
  items: readonly ProactivEditorGuideItem[];
  ordered?: boolean;
  title: string;
}) {
  const List = ordered ? 'ol' : 'ul';

  return (
    <section className="mt-14" aria-label={title}>
      <h2 className="text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">
        {title}
      </h2>
      <List className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <li
            key={item.title}
            className="rounded-2xl border border-zinc-200 bg-white p-5"
          >
            <h3 className="text-base font-semibold tracking-[-0.02em]">
              {ordered ? `${index + 1}. ${item.title}` : item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#52525b]">
              {item.description}
            </p>
          </li>
        ))}
      </List>
    </section>
  );
}
