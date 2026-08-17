export interface VideoModelRate {
  price: string;
  credits: string;
}

export interface VideoModelRateRow {
  model: string;
  mode: string;
  quality: string;
  rate: VideoModelRate;
}

export interface MiniMaxH3PricingProps {
  billingRules: string[];
  billingRulesLabel: string;
  columns: {
    credits: string;
    mode: string;
    model: string;
    price: string;
    quality: string;
  };
  description: string;
  eyebrow: string;
  fallbackLabel: string;
  fallbackNote: string;
  rates: VideoModelRateRow[];
  title: string;
}

/**
 * A compact, rate-card-style presentation for video generation pricing.
 * Copy and monetary values are deliberately provided by the owning block.
 */
export function MiniMaxH3Pricing({
  billingRules,
  billingRulesLabel,
  columns,
  description,
  eyebrow,
  fallbackLabel,
  fallbackNote,
  rates,
  title,
}: MiniMaxH3PricingProps) {
  return (
    <section className="bg-[#0c0f0e] px-4 py-20 text-[#f5f5ef] sm:px-6 sm:py-28">
      <div className="mx-auto max-w-[1120px]">
        <header className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#c8b86e] uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#aeb3aa]">
            {description}
          </p>
        </header>

        <div className="mt-10 overflow-hidden rounded-2xl border border-[#343a35] bg-[#151917]">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-[#1b201d] text-[11px] font-semibold tracking-[0.12em] text-[#aeb3aa] uppercase">
                <tr>
                  <th className="w-[28%] px-6 py-4">{columns.model}</th>
                  <th className="w-[22%] px-5 py-4">{columns.mode}</th>
                  <th className="w-[18%] px-5 py-4">{columns.quality}</th>
                  <th className="px-6 py-4">{columns.price}</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr
                    key={`${rate.model}-${rate.quality}`}
                    className="border-t border-[#2c322e] transition-colors hover:bg-white/[0.025]"
                  >
                    <td className="px-6 py-5 font-medium text-[#f5f5ef]">
                      {rate.model}
                    </td>
                    <td className="px-5 py-5 text-sm text-[#c5c9c1]">
                      {rate.mode}
                    </td>
                    <td className="px-5 py-5 text-sm text-[#c5c9c1]">
                      {rate.quality}
                    </td>
                    <RateCell rate={rate.rate} creditsLabel={columns.credits} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[#2c322e] md:hidden">
            {rates.map((rate) => (
              <article key={`${rate.model}-${rate.quality}`} className="p-5">
                <p className="font-medium text-[#f5f5ef]">{rate.model}</p>
                <p className="mt-1 text-sm text-[#8f978e]">{rate.mode}</p>
                <div className="mt-4 rounded-xl border border-[#343a35] bg-[#1b201d] p-3 tabular-nums">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-[#aeb3aa] uppercase">
                    {rate.quality}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#f5f5ef]">
                    {rate.rate.price}
                  </p>
                  <p className="mt-1 text-xs text-[#aeb3aa]">
                    {rate.rate.credits}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-[#343a35] bg-[#121513] p-5 sm:p-6">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#c8b86e] uppercase">
              {billingRulesLabel}
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#c5c9c1]">
              {billingRules.map((rule) => (
                <li key={rule} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-[#c8b86e]"
                  />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#534a2b] bg-[#1b1a14] p-5 sm:p-6">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#d5c77d] uppercase">
              {fallbackLabel}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#d8d5c6]">
              {fallbackNote}
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}

function RateCell({
  creditsLabel,
  rate,
}: {
  creditsLabel: string;
  rate: VideoModelRate;
}) {
  return (
    <td className="px-6 py-5 align-top tabular-nums">
      <p className="font-semibold text-[#f5f5ef]">{rate.price}</p>
      <p className="mt-1 text-sm text-[#aeb3aa]">
        {rate.credits} {creditsLabel}
      </p>
    </td>
  );
}
