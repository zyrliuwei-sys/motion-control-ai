export const SITE_URL = 'https://www.uncensoredaieditor.com';

export const DEFAULT_SOCIAL_IMAGE_URL = `${SITE_URL}/proactiv/showcase-videos/neon-dancer.jpg`;
export const TEXT_TO_IMAGE_SOCIAL_IMAGE_URL = `${SITE_URL}/imgs/image/meigen-2010358364048597154.jpg`;

export const siteSeo = {
  home: {
    title: 'Uncensored AI - AI Image & Motion Studio',
    description:
      'Create AI images and motion-controlled videos with clear credit pricing. Choose a monthly or annual subscription, or purchase a one-time credit pack.',
    path: '/',
  },
  textToImage: {
    title: 'AI Image Editor - Credit-Based Text to Image',
    description:
      'Create and edit AI images from text prompts and reference images. Sign in, review the credit cost before generation, and choose a subscription or one-time credit pack.',
    path: '/text-to-image',
  },
} as const;
