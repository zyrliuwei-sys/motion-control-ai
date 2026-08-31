import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { cn } from '@/lib/utils';

export interface GlowingEffectProps {
  className?: string;
  disabled?: boolean;
  glow?: boolean;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
}

type PointerPosition = {
  active: boolean;
  x: number;
  y: number;
};

/**
 * A pointer-aware rim light. Render it inside a relatively positioned card;
 * it uses the parent card as the interaction surface.
 */
export function GlowingEffect({
  className,
  disabled = false,
  glow = true,
  inactiveZone = 0.01,
  proximity = 64,
  spread = 40,
}: GlowingEffectProps) {
  const effectRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState<PointerPosition>({
    active: false,
    x: 50,
    y: 50,
  });

  useEffect(() => {
    const target = effectRef.current?.parentElement;
    if (!target || disabled) return;

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = target.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / bounds.height) * 100;
      const distanceFromCenter = Math.hypot(x - 50, y - 50) / 70.71;

      setPointer({
        active: distanceFromCenter >= inactiveZone,
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    };

    const handlePointerLeave = () =>
      setPointer((current) => ({ ...current, active: false }));

    target.addEventListener('pointermove', handlePointerMove);
    target.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      target.removeEventListener('pointermove', handlePointerMove);
      target.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [disabled, inactiveZone]);

  const size = Math.max(90, proximity + spread * 3);
  const spotlight = `radial-gradient(${size}% circle at ${pointer.x}% ${pointer.y}%, rgba(255, 255, 255, 0.98) 0%, rgba(255, 161, 197, 0.9) 15%, rgba(201, 47, 104, 0.88) 33%, rgba(201, 47, 104, 0) 66%)`;
  const maskStyle: CSSProperties = {
    WebkitMask:
      'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
  };

  return (
    <div
      ref={effectRef}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute -inset-px z-20 rounded-[inherit]',
        className
      )}
    >
      {glow ? (
        <div
          className="absolute -inset-5 rounded-[inherit] blur-xl transition-opacity duration-300"
          style={{
            background: spotlight,
            opacity: pointer.active && !disabled ? 0.4 : 0,
          }}
        />
      ) : null}
      <div
        className="absolute inset-0 rounded-[inherit] p-px transition-opacity duration-300"
        style={{
          ...maskStyle,
          background: spotlight,
          opacity: pointer.active && !disabled ? 1 : 0,
        }}
      />
    </div>
  );
}
