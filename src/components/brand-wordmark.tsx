import { cn } from '@/lib/utils';

export function BrandWordmark({
  brand = 'uncensored ai',
  className,
}: {
  brand?: string;
  className?: string;
}) {
  const normalizedBrand = brand.trim() || 'uncensored ai';
  const separator = normalizedBrand.lastIndexOf(' ');
  const name =
    separator > 0 ? normalizedBrand.slice(0, separator) : normalizedBrand;
  const suffix = separator > 0 ? normalizedBrand.slice(separator + 1) : '';

  return (
    <span
      className={cn(
        'inline-flex items-center font-sans leading-none whitespace-nowrap text-current',
        className
      )}
    >
      <span className="font-[780] tracking-[-0.075em]">{name}</span>
      {suffix ? (
        <span className="ml-[0.34em] inline-flex items-center rounded-[0.24em] border-[0.09em] border-current px-[0.34em] py-[0.1em] text-[0.66em] leading-none font-[680] tracking-[0.03em]">
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
