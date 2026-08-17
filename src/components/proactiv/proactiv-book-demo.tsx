import { ArrowLeft, ArrowRight, type LucideIcon } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { MotionControlMark } from '@/components/motion-control-mark';

export type ProactivDemoFocus = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export interface ProactivBookDemoProps {
  brand: string;
  backLabel: string;
  title: string;
  description: string;
  focusTitle: string;
  focusItems: readonly ProactivDemoFocus[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  previewSrc: string;
  previewAlt: string;
}

/**
 * Dedicated demo-intent page. Content comes from the page block so this
 * component remains usable for any localized marketing surface.
 */
export function ProactivBookDemo({
  brand,
  backLabel,
  title,
  description,
  focusTitle,
  focusItems,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  previewSrc,
  previewAlt,
}: ProactivBookDemoProps) {
  return (
    <main className="proactiv-site min-h-[100dvh] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-[1280px] flex-col rounded-xl border border-white/10 bg-[#0d0f12] p-5 sm:min-h-[calc(100dvh-3rem)] sm:p-8 lg:p-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-[6px] py-2 text-sm text-[#d4d4d4] transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#39c3ef]"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:-translate-x-1"
            />
            {backLabel}
          </Link>
          <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-white">
            <MotionControlMark aria-hidden="true" className="size-7" />
            <span>{brand}</span>
          </div>
        </div>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-14">
          <section className="max-w-xl">
            <h1 className="max-w-lg text-4xl leading-[1.03] font-semibold tracking-[-0.055em] text-balance sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#a3a3a3] sm:text-lg">
              {description}
            </p>

            <Link
              href={primaryHref}
              className="group mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] bg-[#39c3ef] px-5 py-3 text-sm font-medium text-[#061014] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#39c3ef] active:scale-[0.98]"
            >
              {primaryLabel}
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/"
              className="ml-4 inline-flex min-h-11 items-center text-sm text-[#a3a3a3] transition-colors duration-200 hover:text-white focus-visible:rounded-[6px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#39c3ef]"
            >
              {secondaryLabel}
            </Link>

            <div className="mt-12 border-t border-white/10 pt-6">
              <h2 className="text-sm font-medium text-white">{focusTitle}</h2>
              <ul className="mt-5 space-y-5">
                {focusItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex gap-4">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[6px] border border-[#39c3ef]/25 bg-[#39c3ef]/10 text-[#39c3ef]">
                        <Icon
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={1.8}
                        />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-white">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-[#a3a3a3]">
                          {item.description}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-xl border border-white/10 bg-[#17191c] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.24)]">
            <img
              src={previewSrc}
              alt={previewAlt}
              className="aspect-[1.32] w-full rounded-lg object-cover object-left-top"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
