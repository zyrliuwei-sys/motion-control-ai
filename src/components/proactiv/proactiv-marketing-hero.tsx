import { useRouter } from '@/core/i18n/navigation';
import {
  ProactivHeroComposer,
  type ProactivHeroComposerLabels,
} from '@/components/proactiv/proactiv-hero-composer';
import { ProactivHeroStream } from '@/components/proactiv/proactiv-hero-stream';

export interface ProactivMarketingHeroProps {
  eyebrow?: string;
  description?: string;
  motionStatement?: readonly string[];
  openEditorLabel?: string;
  title?: string;
  composerLabels?: ProactivHeroComposerLabels;
}

/** Marketing hero retained for the homepage; the text-to-video workspace lives on its own route. */
export function ProactivMarketingHero({
  eyebrow = 'Motion direction, without the production overhead',
  description = 'Automate Campaigns, Engage Audiences, and Boost Lead Generation with Our All-in-One Marketing Solution',
  motionStatement = ['Direct', 'every', 'movement.', 'Make', 'it yours.'],
  openEditorLabel = 'Open editor',
  title = 'Direct Every Frame with uncensored ai',
  composerLabels = {
    addReference: 'Add reference',
    aspectRatio: 'Aspect ratio',
    avatar: 'Avatar',
    duration: 'Duration',
    durationLoading: 'Checking',
    durationPending: 'Awaiting video',
    durationUnavailable: 'Unavailable',
    durationUnsupported: 'Use a 3-10s video',
    generate: 'Generate',
    generated: 'Ready',
    image: 'Image',
    imageModel: 'Grok Imagine 2.0 · Edit',
    model: 'Grok Imagine Image 2.0',
    placeholder: 'Describe the scene you imagine...',
    product: 'Product',
    removeAttachment: 'Remove attachment',
    resolution: 'Clarity',
    textModel: 'Grok Imagine 2.0 · Text',
    video: 'Video',
    videoModel: 'Motion Studio Video',
  },
}: ProactivMarketingHeroProps) {
  const router = useRouter();

  return (
    <section className="relative bg-[#fff8fa] text-[#15202b]">
      <ProactivHeroStream
        eyebrow={eyebrow}
        className="h-[86dvh] min-h-[600px] [&>div:last-child>h2]:!leading-[1.04]"
        title={title}
        description={description}
        motionStatement={motionStatement}
      />
      <div className="relative bg-[#fff8fa] px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-[1440px] justify-center">
          <ProactivHeroComposer
            allowVideoMode={false}
            compactAction
            labels={{ ...composerLabels, generate: openEditorLabel }}
            requireReferences={false}
            onGenerate={({ prompt }) => {
              router.push(
                `/text-to-image?prompt=${encodeURIComponent(prompt)}`
              );
            }}
          />
        </div>
      </div>
    </section>
  );
}
