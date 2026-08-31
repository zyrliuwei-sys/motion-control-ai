import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { GlowingEffect } from '@/components/proactiv/proactiv-glowing-effect';

export type ProactivWorkflowStep = {
  description: string;
  number: string;
  title: string;
};

export interface ProactivWorkflowProps {
  ctaHref: string;
  ctaLabel: string;
  description: string;
  eyebrow: string;
  sideDescription: string;
  sideTitle: string;
  steps: readonly ProactivWorkflowStep[];
  tags: readonly string[];
  title: string;
}

type WorkflowCardProps = {
  area: string;
  children: ReactNode;
  className?: string;
};

function WorkflowCard({ area, children, className }: WorkflowCardProps) {
  return (
    <li className={`min-h-52 list-none ${area}`}>
      <article
        className={`relative h-full overflow-hidden rounded-[1.45rem] border border-[#eed7e0] bg-white p-1.5 shadow-[0_18px_50px_rgba(104,38,64,0.08)] ${className ?? ''}`}
      >
        <GlowingEffect
          disabled={false}
          glow
          inactiveZone={0.01}
          proximity={72}
          spread={44}
        />
        <div className="relative z-10 flex h-full flex-col overflow-hidden rounded-[1.05rem] border border-[#f5e8ed] bg-[linear-gradient(145deg,#ffffff_0%,#fffafb_100%)] p-6 sm:p-7">
          {children}
        </div>
      </article>
    </li>
  );
}

/** An editorial, pointer-reactive creation flow for the landing page. */
export function ProactivWorkflow({
  ctaHref,
  ctaLabel,
  description,
  eyebrow,
  sideDescription,
  sideTitle,
  steps,
  tags,
  title,
}: ProactivWorkflowProps) {
  const [firstStep, secondStep, thirdStep] = steps;

  if (!firstStep || !secondStep || !thirdStep) return null;

  return (
    <section className="relative overflow-hidden border-y border-[#eedee4] bg-[#fffafb] py-18 text-[#15202b] sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(201,47,104,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(201,47,104,0.055)_1px,transparent_1px)] [background-size:32px_32px] opacity-55"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-44 left-[16%] h-96 w-96 rounded-full bg-[#ffd3e2]/50 blur-3xl"
      />
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7 lg:px-8">
        <div className="relative grid items-end gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
          <header className="max-w-3xl">
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#c92f68] uppercase">
              {eyebrow}
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl leading-[1.02] font-semibold tracking-[-0.06em] sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#627181]">
              {description}
            </p>
          </header>

          <Link
            href={ctaHref}
            className="group inline-flex h-11 w-fit items-center gap-2 rounded-full bg-[#c92f68] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(201,47,104,0.22)] transition hover:-translate-y-0.5 hover:bg-[#a62150] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c92f68]"
          >
            {ctaLabel}
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        <ul className="relative mt-12 grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-3 xl:max-h-[34rem] xl:grid-rows-2">
          <WorkflowCard area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]">
            <StepCardContent step={firstStep} />
          </WorkflowCard>

          <WorkflowCard area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]">
            <StepCardContent step={secondStep} />
          </WorkflowCard>

          <WorkflowCard
            area="md:[grid-area:2/1/4/7] xl:[grid-area:1/5/3/9]"
            className="min-h-[25rem]"
          >
            <aside className="flex h-full flex-col">
              <h3 className="max-w-sm text-2xl leading-[1.06] font-semibold tracking-[-0.055em] text-[#15202b]">
                {sideTitle}
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#627181]">
                {sideDescription}
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-8">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#edcfda] bg-white px-3 py-1.5 text-[11px] font-medium text-[#627181] shadow-[0_4px_10px_rgba(104,38,64,0.04)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </aside>
          </WorkflowCard>

          <WorkflowCard area="md:[grid-area:2/7/3/13] xl:[grid-area:1/9/2/13]">
            <StepCardContent step={thirdStep} />
          </WorkflowCard>

          <WorkflowCard area="md:[grid-area:3/7/4/13] xl:[grid-area:2/9/3/13]">
            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-[#c92f68] uppercase">
                  {ctaLabel}
                </p>
                <p className="mt-2 text-lg leading-6 font-semibold tracking-[-0.035em] text-[#15202b]">
                  {description}
                </p>
              </div>
              <Link
                href={ctaHref}
                className="group inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#c92f68] transition hover:text-[#a62150] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c92f68]"
              >
                {ctaLabel}
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </WorkflowCard>
        </ul>
      </div>
    </section>
  );
}

function StepCardContent({ step }: { step: ProactivWorkflowStep }) {
  return (
    <div className="flex h-full flex-col justify-center">
      <h3 className="text-xl leading-tight font-semibold tracking-[-0.045em] text-[#15202b]">
        {step.title}
      </h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#627181]">
        {step.description}
      </p>
    </div>
  );
}
