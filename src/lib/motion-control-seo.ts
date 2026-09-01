export const SITE_URL = 'https://www.uncensoredaieditor.com';

export const DEFAULT_SOCIAL_IMAGE_URL = `${SITE_URL}/proactiv/showcase-videos/neon-dancer.jpg`;
export const TEXT_TO_IMAGE_SOCIAL_IMAGE_URL = `${SITE_URL}/imgs/image/meigen-2010358364048597154.jpg`;

export const siteSeo = {
  home: {
    title: 'Uncensored AI - Free Uncensored AI Image Tools',
    description:
      'Explore free uncensored AI image tools for image generation, editing, and creative direction. Start creating in your browser with no sign-up required.',
    path: '/',
  },
  textToImage: {
    title: 'Uncensored AI Image Editor - Free Text to Image Generator',
    description:
      'Uncensored AI image editor: turn text into images without filters or restrictions. Free to use, no signup, full creative direction. Try it now.',
    path: '/text-to-image',
  },
} as const;
