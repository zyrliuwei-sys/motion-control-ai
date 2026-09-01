import { useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';

export type ProactivCtaAvatar = {
  src: string;
  alt: string;
  /** Shown only on hover-capable devices. */
  name?: string;
};

export interface ProactivCtaProps {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  avatars: readonly ProactivCtaAvatar[];
  trustCaption: string;
  dashboardSrc?: string;
  dashboardAlt?: string;
}

/** A prop-driven closing call-to-action for the Proactiv landing page. */
export function ProactivCta({
  title,
  description,
  ctaLabel,
  ctaHref,
  avatars,
  trustCaption,
  dashboardSrc = '/proactiv/dashboard.png',
  dashboardAlt = 'Proactiv dashboard preview',
}: ProactivCtaProps) {
  return (
    <section className="relative overflow-hidden bg-[#08090a] py-20 text-white md:py-28">
      <CtaStyles />
      <AmbientShafts />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-8">
        <div className="flex flex-col items-center justify-between gap-10 md:flex-row md:items-center md:gap-12">
          <div className="flex max-w-xl flex-col items-center md:items-start">
            <h2 className="text-center text-xl leading-tight font-bold tracking-[-0.035em] text-white md:text-left md:text-[30px]">
              {title}
            </h2>
            <p className="mt-8 max-w-md text-center text-sm leading-6 text-neutral-400 md:text-left md:text-base md:leading-7">
              {description}
            </p>
            <TrustRow avatars={avatars} trustCaption={trustCaption} />
          </div>

          <Link
            href={ctaHref}
            className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[6px] bg-[#18181b] px-5 py-3 text-base font-medium text-white transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18181b] active:scale-[0.98]"
          >
            {ctaLabel}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>

        <CssMacbook alt={dashboardAlt} imageSrc={dashboardSrc} />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40 bg-gradient-to-t from-[#08090a] via-[#08090a]/95 to-transparent"
      />
    </section>
  );
}

function TrustRow({
  avatars,
  trustCaption,
}: {
  avatars: readonly ProactivCtaAvatar[];
  trustCaption: string;
}) {
  return (
    <div className="mt-9 flex flex-col items-center gap-3 md:items-start">
      <div className="flex items-center pl-4" aria-label={trustCaption}>
        {avatars.slice(0, 6).map((avatar, index) => (
          <div
            key={`${avatar.src}-${avatar.name ?? avatar.alt}-${index}`}
            className="proactiv-cta-avatar group/avatar relative -ml-4 first:ml-0"
          >
            <img
              alt={avatar.alt}
              className="size-14 rounded-2xl border-2 border-neutral-700 object-cover"
              height={56}
              src={avatar.src}
              width={56}
            />
            {avatar.name ? (
              <span className="proactiv-cta-tooltip pointer-events-none absolute -top-9 left-1/2 z-30 -translate-x-1/2 rounded bg-white px-2 py-1 text-xs font-medium whitespace-nowrap text-black shadow-lg">
                {avatar.name}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1 md:items-start">
        <div className="flex gap-0.5" aria-label="5 out of 5 stars">
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              aria-hidden="true"
              className="size-4 fill-[#f8d24b] text-[#f8d24b]"
            />
          ))}
        </div>
        <p className="text-center text-sm text-neutral-400 md:text-left">
          {trustCaption}
        </p>
      </div>
    </div>
  );
}

function AmbientShafts() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="proactiv-cta-shaft proactiv-cta-shaft-one" />
      <div className="proactiv-cta-shaft proactiv-cta-shaft-two" />
      <div className="proactiv-cta-shaft proactiv-cta-shaft-three" />
    </div>
  );
}

function CssMacbook({ alt, imageSrc }: { alt: string; imageSrc: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative mx-auto mt-2 h-[252px] w-full max-w-[512px] [perspective:800px] sm:h-[380px] md:mt-8 md:h-[544px]">
      <button
        aria-label="Reveal Proactiv dashboard preview"
        aria-pressed={isOpen}
        className="proactiv-cta-laptop absolute top-0 left-1/2 h-[544px] w-[512px] origin-top -translate-x-1/2 scale-[0.45] cursor-pointer appearance-none border-0 bg-transparent p-0 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18181b] sm:scale-[0.7] md:scale-100"
        data-open={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <div className="proactiv-cta-lid relative z-10 h-48 w-[512px] origin-bottom [transform-style:preserve-3d]">
          <div className="absolute inset-0 overflow-hidden rounded-2xl border-[8px] border-[#171717] bg-[#010101] shadow-[0_2px_0_2px_rgba(64,64,64,0.72)_inset]">
            <img
              alt={alt}
              className="proactiv-cta-dashboard absolute inset-0 h-full w-full object-cover object-left-top"
              src={imageSrc}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent"
            />
          </div>
        </div>
        <MacbookBase />
      </button>
    </div>
  );
}

function MacbookBase() {
  return (
    <div
      aria-hidden="true"
      className="relative -mt-1 h-[353px] w-[512px] overflow-hidden rounded-b-2xl bg-[#272729] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_35px_rgba(0,0,0,0.42)]"
    >
      <div className="relative h-10 w-full">
        <span className="absolute inset-x-0 top-0 mx-auto h-4 w-4/5 bg-[#080808]" />
      </div>
      <div className="flex px-4">
        <SpeakerGrid />
        <Keyboard />
        <SpeakerGrid />
      </div>
      <div className="mx-auto mt-2 h-28 w-2/5 rounded-xl border border-black/20 shadow-[inset_0_0_1px_1px_rgba(0,0,0,0.14)]" />
      <span className="absolute inset-x-0 bottom-0 mx-auto h-2 w-20 rounded-t-3xl bg-gradient-to-t from-[#272729] to-[#050505]" />
    </div>
  );
}

function SpeakerGrid() {
  return (
    <div className="mt-1 grid h-44 w-[10%] grid-cols-3 content-start gap-1 px-1">
      {Array.from({ length: 54 }, (_, index) => (
        <span key={index} className="size-1 rounded-full bg-black/50" />
      ))}
    </div>
  );
}

function Keyboard() {
  const rows = [14, 14, 14, 13, 12, 8];

  return (
    <div className="mx-1 h-44 w-4/5 rounded-md bg-[#080808] p-1.5">
      <div className="flex h-full flex-col gap-1">
        {rows.map((count, rowIndex) => (
          <div key={rowIndex} className="grid flex-1 grid-cols-14 gap-1">
            {Array.from({ length: count }, (_, keyIndex) => (
              <span
                key={keyIndex}
                className={`rounded-[3px] bg-gradient-to-b from-[#29292b] to-[#151517] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${
                  keyIndex === count - 1 && rowIndex > 2 ? 'col-span-2' : ''
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaStyles() {
  return (
    <style>{`
      .proactiv-cta-shaft {
        position: absolute;
        left: -7rem;
        top: -29rem;
        height: 86rem;
        transform: rotate(-45deg);
        transform-origin: top left;
      }
      .proactiv-cta-shaft-one {
        width: 35rem;
        background: radial-gradient(68% 69% at 55% 31%, rgba(217,217,217,0.08) 0%, rgba(140,140,140,0.02) 50%, transparent 80%);
      }
      .proactiv-cta-shaft-two {
        left: 5rem;
        width: 15rem;
        background: radial-gradient(50% 50% at 50% 50%, rgba(217,217,217,0.06) 0%, rgba(120,120,120,0.015) 80%, transparent 100%);
      }
      .proactiv-cta-shaft-three {
        left: -21rem;
        width: 15rem;
        border-radius: 20px;
        background: radial-gradient(50% 50% at 50% 50%, rgba(217,217,217,0.04) 0%, rgba(120,120,120,0.015) 80%, transparent 100%);
      }
      .proactiv-cta-tooltip {
        opacity: 0;
        transform: translate(-50%, 4px);
        transition: opacity 150ms ease-out, transform 150ms ease-out;
      }
      .proactiv-cta-lid {
        transform: rotateX(-65deg) translateZ(0);
        transition: transform 600ms ease-in-out;
      }
      .proactiv-cta-dashboard {
        opacity: 0.2;
        transition: opacity 600ms ease-in-out;
      }
      .proactiv-cta-laptop:hover .proactiv-cta-lid,
      .proactiv-cta-laptop:active .proactiv-cta-lid,
      .proactiv-cta-laptop:focus-visible .proactiv-cta-lid,
      .proactiv-cta-laptop[data-open='true'] .proactiv-cta-lid {
        transform: rotateX(-35deg) translateZ(0);
      }
      .proactiv-cta-laptop:hover .proactiv-cta-dashboard,
      .proactiv-cta-laptop:active .proactiv-cta-dashboard,
      .proactiv-cta-laptop:focus-visible .proactiv-cta-dashboard,
      .proactiv-cta-laptop[data-open='true'] .proactiv-cta-dashboard {
        opacity: 1;
      }
      @media (hover: hover) and (pointer: fine) {
        .proactiv-cta-avatar:hover {
          z-index: 10;
          transform: scale(1.06);
        }
        .proactiv-cta-avatar:hover .proactiv-cta-tooltip {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .proactiv-cta-tooltip,
        .proactiv-cta-lid,
        .proactiv-cta-dashboard,
        .proactiv-cta-avatar {
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  );
}
