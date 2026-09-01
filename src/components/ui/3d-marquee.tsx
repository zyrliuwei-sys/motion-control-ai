import { useId } from 'react';

import { cn } from '@/lib/utils';

export interface ThreeDMarqueeProps {
  className?: string;
  images: readonly string[];
}

const columnCount = 5;

function makeColumns(images: readonly string[]) {
  return Array.from({ length: columnCount }, (_, columnIndex) =>
    images.filter((_, imageIndex) => imageIndex % columnCount === columnIndex)
  );
}

/**
 * A CSS-only moving image wall. Duplicating each column lets the wall loop
 * continuously without relying on a client animation library.
 */
export function ThreeDMarquee({ className, images }: ThreeDMarqueeProps) {
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const columns = makeColumns(images);
  const moveUp = `three-d-marquee-up-${instanceId}`;
  const moveDown = `three-d-marquee-down-${instanceId}`;

  if (!images.length) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative h-[29rem] overflow-hidden [perspective:1200px] sm:h-[37rem] lg:h-[45rem]',
        className
      )}
    >
      <style>{`
        @keyframes ${moveUp} {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(0, -50%, 0); }
        }
        @keyframes ${moveDown} {
          from { transform: translate3d(0, -50%, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${instanceId}-column { animation-play-state: paused !important; }
        }
      `}</style>

      <div className="absolute top-[-10%] left-[-8%] flex w-[126%] gap-2.5 [transform:rotateX(51deg)_rotateY(-24deg)_rotateZ(12deg)_scale(1.13)] [transform-origin:top_center] sm:gap-3.5 lg:left-[-4%] lg:w-[120%]">
        {columns.map((column, columnIndex) => {
          const animation = columnIndex % 2 === 0 ? moveUp : moveDown;
          const sequence = [...column, ...column];

          return (
            <div
              key={columnIndex}
              className={cn(
                `${instanceId}-column flex min-w-0 flex-1 flex-col gap-2.5 will-change-transform sm:gap-3.5`,
                columnIndex === 1 && 'mt-10',
                columnIndex === 2 && 'mt-4',
                columnIndex === 3 && 'mt-14',
                columnIndex === 4 && 'mt-7'
              )}
              style={{
                animation: `${animation} ${25 + columnIndex * 3}s linear infinite`,
              }}
            >
              {sequence.map((src, imageIndex) => (
                <div
                  key={`${src}-${imageIndex}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/25 bg-zinc-100 shadow-[0_18px_36px_rgba(24,24,27,0.14)]"
                >
                  <img
                    src={src}
                    alt=""
                    className="size-full object-cover"
                    decoding="async"
                    loading={imageIndex < 2 ? 'eager' : 'lazy'}
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_48%,rgba(24,24,27,0.12))]" />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white via-white/75 to-transparent sm:h-28" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/85 to-transparent sm:h-32" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent sm:w-24" />
    </div>
  );
}
