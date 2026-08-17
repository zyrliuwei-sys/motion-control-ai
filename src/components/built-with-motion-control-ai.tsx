import { cn } from '@/lib/utils';

const motionControlAiHref =
  'https://sim.3ue.co/#/digitalsuite/acquisition/keyword/organic/search/999/28d/keywordAnalysis_2?keyword=motion%20control%20ai&mtd=false&webSource=Total&selectedPageTab=Total';

export function BuiltWithMotionControlAi({
  className,
}: {
  className?: string;
}) {
  return (
    <a
      href={motionControlAiHref}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-neutral-100 transition-colors hover:border-neutral-500 hover:bg-neutral-800',
        className
      )}
    >
      <span>motion control ai</span>
    </a>
  );
}
