import type { ProactivFaq } from '@/types/proactiv';

export function ProactivFaq({
  title,
  faqs,
}: {
  title: string;
  faqs: ProactivFaq[];
}) {
  return (
    <section
      id="faq"
      className="scroll-mt-24 bg-white px-5 py-16 text-[#18181b] sm:px-8 sm:py-20"
    >
      <div className="mx-auto w-full max-w-[1920px]">
        <h2 className="text-4xl leading-[1.02] font-semibold tracking-[-0.055em] sm:text-5xl">
          {title}
        </h2>
        <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-2">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-3xl border border-zinc-200 bg-white px-6 py-7 sm:px-9 sm:py-9"
            >
              <h3 className="text-xl font-semibold tracking-[-0.035em] sm:text-2xl">
                {faq.question}
              </h3>
              <p className="mt-4 text-base leading-7 text-[#52525b] sm:text-lg sm:leading-8">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
