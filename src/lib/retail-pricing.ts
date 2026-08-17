/**
 * Public credit conversion for Kling 3.0 Motion Control usage.
 *
 * The 720p retail rate is $0.605 for 40.824 credits: both figures are the
 * $0.121 / 8.1648-credit upstream rate marked up by 5×. Keeping this
 * calculation shared ensures that displayed plan allowances match checkout.
 */
export const RETAIL_CREDITS_PER_USD = 40.824 / 0.605;

export function creditsForPriceInCents(priceInCents: number): number {
  return Math.round((priceInCents * RETAIL_CREDITS_PER_USD) / 100);
}
