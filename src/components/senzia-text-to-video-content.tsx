import { Link } from '@/core/i18n/navigation';
import { BuiltWithMotionControlAi } from '@/components/built-with-motion-control-ai';

export interface SenziaTextToVideoCard {
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
}

export interface SenziaTextToVideoStep {
  number: string;
  title: string;
  description: string;
}

export interface SenziaTextToVideoFaq {
  question: string;
  answer: string;
}

export interface SenziaTextToVideoContentProps {
  introTitle: string;
  introDescription: string;
  introCtaLabel: string;
  introCtaHref: string;
  aboutTitle: string;
  aboutDescription: string;
  howTitle: string;
  steps: SenziaTextToVideoStep[];
  abilitiesTitle: string;
  abilities: SenziaTextToVideoCard[];
  audienceTitle: string;
  audience: SenziaTextToVideoCard[];
  whyTitle: string;
  reasons: SenziaTextToVideoCard[];
  reviewsTitle: string;
  reviewQuote: string;
  reviewName: string;
  faqTitle: string;
  faqs: SenziaTextToVideoFaq[];
  footerBrand: string;
  footerDescription: string;
  footerCopyright: string;
}

const sectionClassName = 'border-t border-[#252b34] py-14 md:py-[88px]';
const sectionInnerClassName = 'mx-auto w-full max-w-[1120px] px-5 sm:px-7';
const headingClassName =
  'text-3xl font-semibold tracking-[-0.035em] text-[#f4f7fa] sm:text-4xl';
const cardClassName =
  'rounded-[10px] border border-[#2d3743] bg-[#141a21] transition-[border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-[#596879] focus-within:-translate-y-0.5 focus-within:border-[#596879]';

/**
 * Prop-driven marketing continuation for the standalone text-to-video route.
 * The workspace itself is rendered above this component by the owning block.
 */
export function SenziaTextToVideoContent({
  introTitle,
  introDescription,
  introCtaLabel,
  introCtaHref,
  aboutTitle,
  aboutDescription,
  howTitle,
  steps,
  abilitiesTitle,
  abilities,
  audienceTitle,
  audience,
  whyTitle,
  reasons,
  reviewsTitle,
  reviewQuote,
  reviewName,
  faqTitle,
  faqs,
  footerBrand,
  footerDescription,
  footerCopyright,
}: SenziaTextToVideoContentProps) {
  return (
    <div className="bg-[#0d1014] text-[#c4ccd5]">
      <section
        className="py-14 md:py-[88px]"
        aria-labelledby="text-to-video-intro-title"
      >
        <div className={`${sectionInnerClassName} text-center`}>
          <h1
            id="text-to-video-intro-title"
            className={`${headingClassName} mx-auto max-w-3xl`}
          >
            {introTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#abb4c0]">
            {introDescription}
          </p>
          <Link
            href={introCtaHref}
            className="mt-7 inline-flex items-center justify-center rounded-[10px] border border-[#e6edf4] bg-[#e6edf4] px-5 py-2.5 text-sm font-semibold text-[#11151a] transition-colors duration-150 ease-out hover:bg-white focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dbe5ee]"
          >
            {introCtaLabel}
          </Link>
        </div>
      </section>

      <section
        className={sectionClassName}
        aria-labelledby="text-to-video-about-title"
      >
        <div className={sectionInnerClassName}>
          <div className="max-w-3xl">
            <h2 id="text-to-video-about-title" className={headingClassName}>
              {aboutTitle}
            </h2>
            <p className="mt-5 text-base leading-7 text-[#abb4c0]">
              {aboutDescription}
            </p>
          </div>
        </div>
      </section>

      <section
        className={sectionClassName}
        aria-labelledby="text-to-video-how-title"
      >
        <div className={sectionInnerClassName}>
          <h2 id="text-to-video-how-title" className={headingClassName}>
            {howTitle}
          </h2>
          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={`${step.number}-${index}`}
                className={`${cardClassName} p-5 sm:p-6`}
              >
                <p className="text-sm font-semibold text-[#e6edf4] tabular-nums">
                  {step.number}
                </p>
                <h3 className="mt-6 text-lg font-semibold tracking-[-0.02em] text-[#f4f7fa]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#abb4c0]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CardSection
        title={abilitiesTitle}
        cards={abilities}
        columns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        headingId="text-to-video-abilities-title"
      />

      <CardSection
        title={audienceTitle}
        cards={audience}
        columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        headingId="text-to-video-audience-title"
      />

      <CardSection
        title={whyTitle}
        cards={reasons}
        columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        headingId="text-to-video-why-title"
      />

      <section
        className={sectionClassName}
        aria-labelledby="text-to-video-reviews-title"
      >
        <div className={sectionInnerClassName}>
          <h2 id="text-to-video-reviews-title" className={headingClassName}>
            {reviewsTitle}
          </h2>
          <figure className="mt-9 max-w-3xl rounded-[10px] border border-[#2d3743] bg-[#141a21] p-6 sm:p-8">
            <blockquote className="text-xl leading-8 tracking-[-0.02em] text-[#e6edf4] sm:text-2xl sm:leading-9">
              {reviewQuote}
            </blockquote>
            <figcaption className="mt-6 text-sm font-medium text-[#abb4c0]">
              {reviewName}
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        className={sectionClassName}
        aria-labelledby="text-to-video-faq-title"
      >
        <div className={sectionInnerClassName}>
          <h2 id="text-to-video-faq-title" className={headingClassName}>
            {faqTitle}
          </h2>
          <div className="mt-9 divide-y divide-[#2d3743] rounded-[10px] border border-[#2d3743] bg-[#141a21]">
            {faqs.map((faq, index) => (
              <details
                key={`${faq.question}-${index}`}
                className="group px-5 sm:px-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left text-base font-medium text-[#e6edf4] marker:content-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#dbe5ee]">
                  <span>{faq.question}</span>
                  <span
                    aria-hidden="true"
                    className="relative size-4 shrink-0 before:absolute before:top-[7px] before:left-0 before:h-px before:w-4 before:bg-[#abb4c0] after:absolute after:top-0 after:left-[7px] after:h-4 after:w-px after:bg-[#abb4c0] group-open:after:hidden"
                  />
                </summary>
                <p className="max-w-3xl pb-5 text-sm leading-6 text-[#abb4c0]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#252b34] py-10 sm:py-12">
        <div
          className={`${sectionInnerClassName} flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between`}
        >
          <div className="max-w-md">
            <p className="text-base font-semibold text-[#f4f7fa]">
              {footerBrand}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#abb4c0]">
              {footerDescription}
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:items-end">
            <BuiltWithMotionControlAi />
            <p className="text-xs text-[#7f8a96]">{footerCopyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CardSection({
  title,
  cards,
  columns,
  headingId,
}: {
  title: string;
  cards: SenziaTextToVideoCard[];
  columns: string;
  headingId: string;
}) {
  return (
    <section className={sectionClassName} aria-labelledby={headingId}>
      <div className={sectionInnerClassName}>
        <h2 id={headingId} className={headingClassName}>
          {title}
        </h2>
        <div className={`mt-9 grid gap-4 ${columns}`}>
          {cards.map((card, index) => (
            <article
              key={`${card.title}-${index}`}
              className={`${cardClassName} overflow-hidden`}
            >
              {isLocalImage(card.imageSrc) ? (
                <img
                  src={card.imageSrc}
                  alt={card.imageAlt ?? ''}
                  className="aspect-[4/3] w-full border-b border-[#2d3743] object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#f4f7fa]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#abb4c0]">
                  {card.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function isLocalImage(src: string | undefined): src is string {
  return Boolean(src?.startsWith('/'));
}
