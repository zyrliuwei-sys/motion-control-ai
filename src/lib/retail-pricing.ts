/**
 * Public credit conversion for Kling 3.0 Motion Control usage.
 *
 * The 720p retail rate is $0.605 for 40.824 credits: both figures are the
 * $0.121 / 8.1648-credit upstream rate marked up by 5×. Keeping this
 * calculation shared ensures that displayed plan allowances match checkout.
 */
export const RETAIL_CREDITS_PER_USD = 40.824 / 0.605;

export type MotionControlQuality = '720p' | '1080p';
export type MotionControlOrientation = 'image' | 'video';

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
