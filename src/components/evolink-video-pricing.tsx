import {
  evolinkVideoPriceSummary,
  type EvolinkVideoModelFamily,
} from '@/lib/evolink-video-pricing';

export interface EvolinkVideoPricingCopy {
  apiRate: string;
  credits: string;
  fiveSeconds: string;
  note: string;
  perSecond: string;
  retailRate: string;
  subtitle: string;
  title: string;
}

const PRICING_ROWS: Array<{
  model: EvolinkVideoModelFamily;
  name: string;
  qualities: Array<'480p' | '720p' | '768p' | '1080p'>;
}> = [
  {
    model: 'seedance-2.5',
    name: 'Seedance 2.5',
    qualities: ['480p', '720p', '1080p'],
  },
  {
    model: 'minimax-h3-max',
    name: 'MiniMax H3 Max',
    qualities: ['480p', '768p'],
  },
];

function money(value: number) {
  return `$${value.toFixed(3)}`;
}

export function EvolinkVideoPricing({
  copy,
}: {
  copy: EvolinkVideoPricingCopy;
}) {
  return (
    <section
      className="mt-8 rounded-[22px] border border-[#e5e9e9] bg-[#fbfdfd] p-5 shadow-[0_10px_26px_rgba(76,82,88,0.06)] sm:p-6"
      aria-labelledby="evolink-video-pricing-heading"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-[#687078] uppercase">
            7× EvoLink
          </p>
          <h2
            id="evolink-video-pricing-heading"
            className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#354144]"
          >
            {copy.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718083]">
            {copy.subtitle}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {PRICING_ROWS.map((item) => (
          <article
            key={item.model}
            className="overflow-hidden rounded-2xl border border-[#e4e9e9] bg-white"
          >
            <div className="flex items-center justify-between border-b border-[#edf1f1] px-4 py-3">
              <h3 className="text-sm font-semibold text-[#354144]">
                {item.name}
              </h3>
              <span className="rounded-full bg-[#eef6f5] px-2.5 py-1 text-[10px] font-semibold text-[#52706f]">
                5–{item.model === 'seedance-2.5' ? '30' : '15'}s
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead className="bg-[#fbfcfc] text-[#849092]">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Quality</th>
                    <th className="px-4 py-2.5 font-medium">{copy.apiRate}</th>
                    <th className="px-4 py-2.5 font-medium">
                      {copy.retailRate}
                    </th>
                    <th className="px-4 py-2.5 font-medium">
                      {copy.fiveSeconds}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.qualities.map((quality) => {
                    const summary = evolinkVideoPriceSummary({
                      model: item.model,
                      quality,
                      durationSeconds: 5,
                    });
                    return (
                      <tr
                        key={quality}
                        className="border-t border-[#f0f3f3] text-[#59676a]"
                      >
                        <td className="px-4 py-3 font-semibold text-[#354144]">
                          {quality}
                        </td>
                        <td className="px-4 py-3">
                          {money(summary.providerUsdPerSecond)}
                          {copy.perSecond}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#52706f]">
                          {summary.retailCreditsPerSecond.toFixed(2)}{' '}
                          {copy.credits}
                          {copy.perSecond}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#354144]">
                          {summary.retailCredits} {copy.credits}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#879396]">{copy.note}</p>
    </section>
  );
}
