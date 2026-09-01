import {
  HomeHeroLandingScrollAnimation,
  type HomeHeroLandingImage,
} from '@/components/ui/home-hero-landing-scroll-animation';

const streamImages: readonly HomeHeroLandingImage[] = [
  {
    src: '/imgs/generated/hero-rail-android-1787884980625.png',
    alt: 'Neon-lit android portrait in purple light',
    width: 686,
    height: 858,
  },
  {
    src: '/imgs/generated/hero-rail-runner-1787884984136.png',
    alt: 'Runner sprinting through ember sparks',
    width: 686,
    height: 858,
  },
  {
    src: '/imgs/generated/hero-rail-supercar-1787885029070.png',
    alt: 'Neon-lit supercar on rainy cyberpunk street',
    width: 686,
    height: 858,
  },
  {
    src: '/imgs/generated/hero-rail-astronaut-1787885033511.png',
    alt: 'Astronaut beneath a glowing purple nebula',
    width: 686,
    height: 858,
  },
  {
    src: '/imgs/generated/hero-rail-dancer-1787885078354.png',
    alt: 'Dancer wrapped in electric light ribbons',
    width: 686,
    height: 858,
  },
];

export interface ProactivHeroStreamProps {
  eyebrow?: string;
  className?: string;
  ctaLabel?: string;
  title: string;
  description: string;
  motionStatement?: readonly string[];
}

export function ProactivHeroStream({
  eyebrow,
  className,
  ctaLabel,
  title,
  description,
  motionStatement,
}: ProactivHeroStreamProps) {
  return (
    <HomeHeroLandingScrollAnimation
      eyebrow={eyebrow}
      ctaLabel={ctaLabel}
      title={title}
      description={description}
      motionStatement={motionStatement}
      images={streamImages}
      className={className}
    />
  );
}
