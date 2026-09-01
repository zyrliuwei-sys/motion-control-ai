import { Link } from '@/core/i18n/navigation';

export type ProactivImagePromptGuideSummaryItem = {
  description: string;
  title: string;
};

export type ProactivImagePromptGuideSummaryFaq = {
  answer: string;
  question: string;
};

export interface ProactivImagePromptGuideSummaryProps {
  definition: readonly string[];
  features: readonly ProactivImagePromptGuideSummaryItem[];
  featuresTitle: string;
  faqTitle: string;
  faqs: readonly ProactivImagePromptGuideSummaryFaq[];
  guideHref: string;
  guideLinkLabel: string;
  howItWorksTitle: string;
  steps: readonly ProactivImagePromptGuideSummaryItem[];
  useCases: readonly ProactivImagePromptGuideSummaryItem[];
  useCasesTitle: string;
  whatIsTitle: string;
}

/**
 * Server-rendered, condensed prompt guide placed above the image composer.
 * All copy is supplied by the page block so this stays a reusable UI component.
 */
export function ProactivImagePromptGuideSummary({
  definition,
  features,
  featuresTitle,
  faqTitle,
  faqs,
  guideHref,
  guideLinkLabel,
  howItWorksTitle,
  steps,
  useCases,
  useCasesTitle,
  whatIsTitle,
}: ProactivImagePromptGuideSummaryProps) {
  return (
    <section
      className="mt-8 border-t border-[#d6e0e7] pt-8"
      aria-labelledby="image-prompt-summary-title"
    >
      <section>
        <h2
          id="image-prompt-summary-title"
          className="text-xl font-semibold tracking-[-0.03em] text-[#15202b] sm:text-2xl"
        >
          {whatIsTitle}
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-6 text-[#627181] sm:text-base sm:leading-7">
          {definition.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <GuideCardGrid title={featuresTitle} items={features} />
      <GuideCardGrid numbered title={howItWorksTitle} items={steps} />
      <GuideCardGrid title={useCasesTitle} items={useCases} />

      <section className="mt-8" aria-labelledby="image-prompt-summary-faq">
        <h2
          id="image-prompt-summary-faq"
          className="text-xl font-semibold tracking-[-0.03em] text-[#15202b] sm:text-2xl"
        >
          {faqTitle}
        </h2>
        <div className="mt-4 divide-y divide-[#d6e0e7] rounded-2xl border border-[#d6e0e7] bg-[#fff8fa]">
          {faqs.map((faq) => (
            <details key={faq.question} className="group px-4 sm:px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-4 text-left text-sm font-semibold text-[#15202b] marker:content-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c92f68] sm:text-base">
                <span>{faq.question}</span>
                <span
                  aria-hidden="true"
                  className="relative size-4 shrink-0 before:absolute before:top-[7px] before:left-0 before:h-px before:w-4 before:bg-[#627181] after:absolute after:top-0 after:left-[7px] after:h-4 after:w-px after:bg-[#627181] group-open:after:hidden"
                />
              </summary>
              <p className="max-w-3xl pb-4 text-sm leading-6 text-[#627181]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <Link
        href={guideHref}
        className="mt-7 inline-flex text-sm font-semibold text-[#15202b] underline decoration-[#d6e0e7] underline-offset-4 transition-colors hover:text-[#8f2348] hover:decoration-[#c92f68] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c92f68]"
      >
        {guideLinkLabel}
      </Link>
    </section>
  );
}

function GuideCardGrid({
  items,
  numbered = false,
  title,
}: {
  items: readonly ProactivImagePromptGuideSummaryItem[];
  numbered?: boolean;
  title: string;
}) {
  return (
    <section className="mt-8" aria-label={title}>
      <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#15202b] sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <article
            key={item.title}
            className="rounded-2xl border border-[#d6e0e7] bg-white p-4 sm:p-5"
          >
            {numbered ? (
              <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8f2348] uppercase">
                {String(index + 1).padStart(2, '0')}
              </p>
            ) : null}
            <h3
              className={`text-sm font-semibold tracking-[-0.02em] text-[#15202b] sm:text-base ${
                numbered ? 'mt-3' : ''
              }`}
            >
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#627181]">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
