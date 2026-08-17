import type { SVGProps } from 'react';

import { cn } from '@/lib/utils';

interface MotionControlMarkProps extends SVGProps<SVGSVGElement> {
  label?: string;
}

/** A neon video viewport with a play cue and a kinetic motion trail. */
export function MotionControlMark({
  className,
  label = 'Motion Control AI',
  ...props
}: MotionControlMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={label}
      className={cn('shrink-0', className)}
      {...props}
    >
      <defs>
        <linearGradient
          id="motion-control-surface"
          x1="6"
          y1="5"
          x2="42"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#18273A" />
          <stop offset="0.52" stopColor="#0B111A" />
          <stop offset="1" stopColor="#23132E" />
        </linearGradient>
        <linearGradient
          id="motion-control-neon"
          x1="9"
          y1="10"
          x2="40"
          y2="37"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#69F5FF" />
          <stop offset="0.48" stopColor="#30BBFF" />
          <stop offset="1" stopColor="#D856FF" />
        </linearGradient>
        <linearGradient
          id="motion-control-play"
          x1="17"
          y1="15"
          x2="32"
          y2="33"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#B8F5FF" />
        </linearGradient>
        <filter
          id="motion-control-glow"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feGaussianBlur stdDeviation="1.25" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect
        width="48"
        height="48"
        rx="14"
        fill="url(#motion-control-surface)"
      />
      <rect
        x="0.75"
        y="0.75"
        width="46.5"
        height="46.5"
        rx="13.25"
        fill="none"
        stroke="rgba(160,225,255,0.22)"
        strokeWidth="1.5"
      />

      <g
        fill="none"
        stroke="url(#motion-control-neon)"
        strokeLinecap="round"
        strokeWidth="2.5"
        filter="url(#motion-control-glow)"
      >
        <path d="M13.4 19v-2.5a3.1 3.1 0 0 1 3.1-3.1H20" />
        <path d="M28 13.4h3.5a3.1 3.1 0 0 1 3.1 3.1V19" />
        <path d="M34.6 29v2.5a3.1 3.1 0 0 1-3.1 3.1H28" />
        <path d="M20 34.6h-3.5a3.1 3.1 0 0 1-3.1-3.1V29" />
        <path
          d="M12.5 27.5c3.2 2.85 6.8 3.96 10.76 3.33 4.11-.66 7.13-3.2 10.24-6.83"
          opacity="0.82"
        />
      </g>

      <path
        d="m20.25 17.35 11.3 6.65-11.3 6.65V17.35Z"
        fill="url(#motion-control-play)"
      />
      <path
        d="m20.25 17.35 11.3 6.65-11.3 6.65V17.35Z"
        fill="none"
        stroke="#FFFFFF"
        strokeLinejoin="round"
        strokeOpacity="0.36"
      />

      <g fill="#72F5FF" filter="url(#motion-control-glow)">
        <rect x="10" y="24.5" width="2.6" height="2.6" rx="0.7" />
        <rect
          x="14.6"
          y="29.2"
          width="2.2"
          height="2.2"
          rx="0.6"
          opacity="0.76"
        />
        <rect
          x="18.55"
          y="32.45"
          width="1.7"
          height="1.7"
          rx="0.5"
          opacity="0.45"
        />
      </g>
      <circle
        cx="36.35"
        cy="21.55"
        r="1.45"
        fill="#DE63FF"
        filter="url(#motion-control-glow)"
      />
    </svg>
  );
}
