/**
 * EvoLink video pricing used by both the generation route and the UI.
 *
 * EvoLink publishes a credit rate per output second. The product charges the
 * published EvoLink credit amount at a 7x multiplier, then rounds the total
 * task price up because account credits are stored as whole numbers.
 */
export const EVOLINK_VIDEO_RETAIL_MULTIPLIER = 7;

export type EvolinkVideoModelFamily = 'seedance-2.5' | 'minimax-h3-max';
export type EvolinkVideoMode =
  | 'text-to-video'
  | 'image-to-video'
  | 'reference-to-video';
export type EvolinkVideoQuality = '480p' | '720p' | '768p' | '1080p';

type EvolinkVideoRate = {
  providerUsdPerSecond: number;
  providerCreditsPerSecond: number;
};

export const EVOLINK_VIDEO_MODEL_IDS: Record<
  EvolinkVideoModelFamily,
  Record<EvolinkVideoMode, string>
> = {
  'seedance-2.5': {
    'text-to-video': 'seedance-2.5-text-to-video',
    'image-to-video': 'seedance-2.5-image-to-video',
    'reference-to-video': 'seedance-2.5-reference-to-video',
  },
  'minimax-h3-max': {
    'text-to-video': 'minimax-h3-max-text-to-video',
    'image-to-video': 'minimax-h3-max-image-to-video',
    'reference-to-video': 'minimax-h3-max-reference-to-video',
  },
};

const RATES: Record<
  EvolinkVideoModelFamily,
  Record<'480p' | '720p' | '768p' | '1080p', EvolinkVideoRate | undefined>
> = {
  'seedance-2.5': {
    '480p': { providerUsdPerSecond: 0.138, providerCreditsPerSecond: 9.3419 },
    '720p': { providerUsdPerSecond: 0.296, providerCreditsPerSecond: 20.09 },
    '768p': undefined,
    '1080p': { providerUsdPerSecond: 0.739, providerCreditsPerSecond: 50.225 },
  },
  'minimax-h3-max': {
    '480p': { providerUsdPerSecond: 0.048, providerCreditsPerSecond: 3.23 },
    '720p': undefined,
    '768p': { providerUsdPerSecond: 0.076, providerCreditsPerSecond: 5.168 },
    '1080p': undefined,
  },
};

export const EVOLINK_VIDEO_QUALITY_OPTIONS: Record<
  EvolinkVideoModelFamily,
  EvolinkVideoQuality[]
> = {
  'seedance-2.5': ['480p', '720p', '1080p'],
  'minimax-h3-max': ['480p', '768p'],
};

export const EVOLINK_VIDEO_DURATION_LIMITS: Record<
  EvolinkVideoModelFamily,
  { min: number; max: number }
> = {
  'seedance-2.5': { min: 4, max: 30 },
  'minimax-h3-max': { min: 5, max: 15 },
};

export function getEvolinkVideoModelFamily(
  modelId: string
): EvolinkVideoModelFamily | undefined {
  if (modelId.startsWith('seedance-2.5-')) return 'seedance-2.5';
  if (modelId.startsWith('minimax-h3-max-')) return 'minimax-h3-max';
  return undefined;
}

export function getEvolinkVideoRate(params: {
  model: EvolinkVideoModelFamily;
  quality: EvolinkVideoQuality;
}): EvolinkVideoRate {
  const rate = RATES[params.model][params.quality];
  if (!rate) {
    throw new Error(
      `Quality ${params.quality} is not available for ${params.model}`
    );
  }
  return rate;
}

/** Exact whole-credit charge for one output task. */
export function evolinkVideoCreditsForSeconds(params: {
  model: EvolinkVideoModelFamily;
  quality: EvolinkVideoQuality;
  durationSeconds: number;
}): number {
  const seconds = Math.max(1, Math.ceil(params.durationSeconds));
  const rate = getEvolinkVideoRate(params);
  return Math.ceil(
    rate.providerCreditsPerSecond * seconds * EVOLINK_VIDEO_RETAIL_MULTIPLIER
  );
}

export function evolinkVideoPriceSummary(params: {
  model: EvolinkVideoModelFamily;
  quality: EvolinkVideoQuality;
  durationSeconds: number;
}) {
  const rate = getEvolinkVideoRate(params);
  return {
    ...rate,
    retailCreditsPerSecond:
      rate.providerCreditsPerSecond * EVOLINK_VIDEO_RETAIL_MULTIPLIER,
    retailCredits: evolinkVideoCreditsForSeconds(params),
  };
}
