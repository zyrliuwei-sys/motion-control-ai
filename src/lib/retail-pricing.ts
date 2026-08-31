/**
 * Public credit conversion for Kling 3.0 Motion Control usage.
 *
 * The 720p retail rate is $0.605 for 40.824 credits: both figures are the
 * $0.121 / 8.1648-credit upstream rate marked up by 5×. Keeping this
 * calculation shared ensures that displayed plan allowances match checkout.
 */
export const RETAIL_CREDITS_PER_USD = 40.824 / 0.605;

/**
 * Public retail multiplier applied to upstream AI costs. It leaves room for
 * payment processing, storage, retries, and support while matching the
 * existing Kling motion-control price model.
 */
export const RETAIL_AI_COST_MULTIPLIER = 5;

/**
 * Grok Imagine Image 2.0 carries a higher retail markup than motion control.
 * Keep it model-specific so changing this rate cannot alter existing video
 * pricing.
 */
export const GROK_IMAGINE_RETAIL_AI_COST_MULTIPLIER = 7;

export type MotionControlQuality = '720p' | '1080p';
export type MotionControlOrientation = 'image' | 'video';

export type GrokImagineImageQuality = 'low' | 'medium';
export type GrokImagineImageResolution = '1K' | '2K';

/** Retail credit rate for Kling 3.0 Motion Control output. */
export const MOTION_CONTROL_CREDITS_PER_SECOND: Record<
  MotionControlQuality,
  number
> = {
  '720p': 40.824,
  '1080p': 54.46,
};

/** EvoLink limits output to 10 seconds for image orientation and 30 for video. */
export const MOTION_CONTROL_MAX_OUTPUT_SECONDS: Record<
  MotionControlOrientation,
  number
> = {
  image: 10,
  video: 30,
};

export function creditsForPriceInCents(priceInCents: number): number {
  return Math.round((priceInCents * RETAIL_CREDITS_PER_USD) / 100);
}

/**
 * EvoLink's published Grok Imagine Image 2.0 credit rates. Website credits
 * use this same unit for Grok billing; do not convert from USD here.
 */
const GROK_IMAGINE_OUTPUT_CREDITS: Record<
  GrokImagineImageResolution,
  Record<GrokImagineImageQuality, number>
> = {
  '1K': { low: 2.04, medium: 3.06 },
  '2K': { low: 3.06, medium: 4.08 },
};

const GROK_IMAGINE_INPUT_IMAGE_CREDITS = 0.51;

/**
 * Pre-authorize a 7× deterministic retail amount for Grok Imagine Image 2.0.
 * EvoLink bills each output separately and each reference image once per
 * request. User credits stay whole numbers, so the final amount rounds up.
 */
export function grokImagineImageReservationCredits(params: {
  imageCount: number;
  inputImageCount: number;
  quality: GrokImagineImageQuality;
  resolution: GrokImagineImageResolution;
}): number {
  const imageCount = Math.max(1, Math.min(10, Math.floor(params.imageCount)));
  const inputImageCount = Math.max(
    0,
    Math.min(3, Math.floor(params.inputImageCount))
  );
  const platformCredits =
    GROK_IMAGINE_OUTPUT_CREDITS[params.resolution][params.quality] *
      imageCount +
    GROK_IMAGINE_INPUT_IMAGE_CREDITS * inputImageCount;

  return Math.ceil(platformCredits * GROK_IMAGINE_RETAIL_AI_COST_MULTIPLIER);
}

/**
 * Credits are stored as integers. Round the upstream-billed duration to a
 * whole second, then round the resulting retail cost up so a completed task
 * can never be undercharged.
 */
export function motionControlCreditsForSeconds(params: {
  quality: MotionControlQuality;
  outputSeconds: number;
}): number {
  const seconds = Math.max(0, Math.round(params.outputSeconds));
  return Math.ceil(MOTION_CONTROL_CREDITS_PER_SECOND[params.quality] * seconds);
}

/**
 * Reserve the maximum possible cost before an upstream task is submitted.
 * This prevents an API caller from understating the input video duration.
 */
export function motionControlReservationCredits(params: {
  quality: MotionControlQuality;
  characterOrientation: MotionControlOrientation;
}): number {
  return motionControlCreditsForSeconds({
    quality: params.quality,
    outputSeconds:
      MOTION_CONTROL_MAX_OUTPUT_SECONDS[params.characterOrientation],
  });
}
