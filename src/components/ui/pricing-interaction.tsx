import NumberFlow from '@number-flow/react';

export interface PricingInteractionOption {
  id: string;
  price: number;
  planName: string;
  creditsLabel: string;
}

export function PricingInteraction({
  options,
  value,
  onValueChange,
}: {
  options: readonly PricingInteractionOption[];
  value?: string;
  onValueChange?: (id: string) => void;
}) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value)
  );

  if (!options.length) return null;

  return (
    <div
      aria-label="Pricing options"
      className="relative flex w-full flex-col gap-3"
      role="radiogroup"
    >
      {options.map((option, index) => {
        const selected = index === activeIndex;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onValueChange?.(option.id)}
            className="relative z-0 flex h-[88px] w-full items-center justify-between rounded-2xl border-2 border-[#9ca7b3] bg-white p-4 text-left transition-colors duration-300 hover:border-[#64748b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15202b]"
          >
            <span className="flex min-w-0 items-center gap-4">
              <span className="flex shrink-0 items-baseline text-3xl font-semibold tracking-[-0.045em] text-[#111827] tabular-nums">
                $
                <NumberFlow value={option.price} />
              </span>
              <span className="min-w-0 border-l border-[#d8dee5] pl-4 text-left">
                <span className="block truncate text-sm font-semibold text-[#111827]">
                  {option.planName}
                </span>
                <span className="mt-0.5 block truncate text-sm text-[#64748b]">
                  {option.creditsLabel}
                </span>
              </span>
            </span>
            <span
              aria-hidden="true"
              className="flex size-6 items-center justify-center rounded-full border-2 p-1 transition-colors duration-300"
              style={{ borderColor: selected ? '#000000' : '#64748b' }}
            >
              <span
                className="size-3 rounded-full bg-black transition-opacity duration-300"
                style={{ opacity: selected ? 1 : 0 }}
              />
            </span>
          </button>
        );
      })}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[88px] rounded-2xl border-[3px] border-black"
        style={{
          transform: `translateY(${activeIndex * 100}px)`,
          transition: 'transform 0.3s',
        }}
      />
    </div>
  );
}
