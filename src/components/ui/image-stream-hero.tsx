import * as React from 'react';

import { cn } from '@/lib/utils';

export type CorridorPath = {
  /** Strength of the projection. Lower values create a wider, faster rush. */
  perspective?: number;
  cardWidth?: number;
  cardHeight?: number;
  cardRadius?: number;
  /** On-screen card height at the corridor waist. */
  birthHeight?: number;
  /** On-screen card height as the card exits the frame. */
  exitHeight?: number;
  /** A negative value lets new cards cross the axis before separating. */
  railBirth?: number;
  railExit?: number;
  /** How quickly the rails spread apart. */
  fan?: number;
  turnBirth?: number;
  turnExit?: number;
  /** Number of sampled keyframe stops used to trace the path. */
  stops?: number;
};

const PATH: Required<CorridorPath> = {
  perspective: 30,
  cardWidth: 18,
  cardHeight: 25,
  cardRadius: 0.4,
  birthHeight: 2.6,
  exitHeight: 46,
  railBirth: -11,
  railExit: 44,
  fan: 3.3,
  turnBirth: 6,
  turnExit: 28,
  stops: 24,
};

function keyframes(dir: 1 | -1, name: string, path: Required<CorridorPath>) {
  const steps: string[] = [];

  for (let stop = 0; stop <= path.stops; stop++) {
    const progress = stop / path.stops;
    const scale =
      (path.birthHeight / path.cardHeight) *
      Math.pow(path.exitHeight / path.birthHeight, progress);
    const depth = path.perspective * (1 - 1 / scale);
    const rail =
      path.railExit -
      (path.railExit - path.railBirth) * Math.pow(1 - progress, path.fan);
    const turn = path.turnBirth + (path.turnExit - path.turnBirth) * progress;

    steps.push(
      `${(progress * 100).toFixed(2)}%{transform:translate3d(${(
        dir * rail
      ).toFixed(2)}cqw,0,${depth.toFixed(2)}cqw) rotateY(${(
        -dir * turn
      ).toFixed(2)}deg)}`
    );
  }

  return `@keyframes ${name}{${steps.join('')}}`;
}

export type StreamImage = {
  src: string;
  /** Used if the image stream becomes non-decorative in a future placement. */
  alt?: string;
};

export type ImageStreamHeroProps = {
  /** Images are mirrored along both rails. Short arrays repeat automatically. */
  images: StreamImage[];
  /** Number of cards on each rail. */
  cards?: number;
  /** Seconds for one card to traverse the corridor. */
  speed?: number;
  /** Vertical position of the corridor axis, as a percentage of its height. */
  axis?: number;
  /** Override any portion of the default corridor geometry. */
  path?: CorridorPath;
  children?: React.ReactNode;
  className?: string;
};

export function ImageStreamHero({
  images,
  cards = 9,
  speed = 18,
  axis = 55,
  path,
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & ImageStreamHeroProps) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const right = `ish-r-${id}`;
  const left = `ish-l-${id}`;
  const cardClass = `ish-c-${id}`;
  const safeCards = Math.max(1, Math.floor(cards));
  const safeSpeed = Math.max(0.1, speed);
  const corridorPath = React.useMemo(() => ({ ...PATH, ...path }), [path]);

  const css = React.useMemo(
    () =>
      `${keyframes(1, right, corridorPath)}${keyframes(
        -1,
        left,
        corridorPath
      )}` +
      `@media(prefers-reduced-motion:reduce){.${cardClass}{animation-play-state:paused}}`,
    [right, left, cardClass, corridorPath]
  );

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      {...props}
      style={{ containerType: 'inline-size', ...props.style }}
    >
      <style>{css}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          perspective: `${corridorPath.perspective}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {[right, left].map((name) =>
            Array.from({ length: safeCards }, (_, index) => {
              const image = images[index % Math.max(images.length, 1)];

              return (
                <div
                  key={`${name}-${index}`}
                  className={cn(cardClass, 'absolute overflow-hidden')}
                  style={{
                    left: '50%',
                    top: `${axis}%`,
                    width: `${corridorPath.cardWidth}cqw`,
                    height: `${corridorPath.cardHeight}cqw`,
                    marginLeft: `${-corridorPath.cardWidth / 2}cqw`,
                    marginTop: `${-corridorPath.cardHeight / 2}cqw`,
                    borderRadius: `${corridorPath.cardRadius}cqw`,
                    animation: `${name} ${safeSpeed}s linear infinite`,
                    animationDelay: `${-(index * safeSpeed) / safeCards}s`,
                    backfaceVisibility: 'hidden',
                    willChange: 'transform',
                  }}
                >
                  {image ? (
                    <img
                      src={image.src}
                      alt={image.alt ?? ''}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover"
                      draggable={false}
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

export default ImageStreamHero;
