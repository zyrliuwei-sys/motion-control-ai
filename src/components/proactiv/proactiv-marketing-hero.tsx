import { useRouter } from '@/core/i18n/navigation';
import {
  ProactivHeroComposer,
  type ProactivHeroComposerLabels,
} from '@/components/proactiv/proactiv-hero-composer';
import { ProactivHeroStage } from '@/components/proactiv/proactiv-hero-stage';

export interface ProactivMarketingHeroProps {
  description?: string;
  title?: string;
  composerLabels?: ProactivHeroComposerLabels;
}

/** Marketing hero retained for the homepage; the text-to-video workspace lives on its own route. */
export function ProactivMarketingHero({
  description = 'Automate Campaigns, Engage Audiences, and Boost Lead Generation with Our All-in-One Marketing Solution',
  title = 'Direct Every Frame with Motion Control AI',
  composerLabels = {
    addReference: 'Add reference',
    aspectRatio: 'Aspect ratio',
    avatar: 'Avatar',
    batch: 'Batch',
    generate: 'Generate',
    generated: 'Ready',
    image: 'Image',
    model: 'Motion Studio',
    placeholder: 'Describe the scene you imagine...',
    product: 'Product',
    removeAttachment: 'Remove attachment',
    style: 'Style',
    video: 'Video',
  },
}: ProactivMarketingHeroProps) {
  const router = useRouter();

  return (
    <section className="relative flex min-h-[calc(100svh-64px)] flex-col justify-center overflow-hidden bg-[#090b0e] pt-28 pb-16 text-white lg:min-h-[calc(100svh-72px)] lg:pt-40 lg:pb-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#39c3ef]/60"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col items-center px-4">
        <ProactivHeroStage />
        <h1 className="mt-10 max-w-[980px] text-center text-3xl leading-[1.1] font-semibold tracking-[-0.055em] text-balance sm:mt-12 sm:text-[46px] lg:mt-16 lg:text-[72px]">
          {title}
        </h1>
        <p className="mt-5 max-w-[720px] text-center text-base leading-relaxed text-[#a3aab3] md:text-xl">
          {description}
        </p>

        <div className="mt-8 flex w-full justify-center">
          <ProactivHeroComposer
            labels={composerLabels}
            onGenerate={({ prompt }) => {
              router.push(
                `/text-to-video?prompt=${encodeURIComponent(prompt)}`
              );
            }}
          />
        </div>
      </div>
    </section>
  );
}
