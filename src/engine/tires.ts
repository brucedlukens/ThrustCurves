import type { TireSize } from '@/types/car'

/**
 * Calculate tire outer radius in meters.
 * Formula: rimRadius + sidewall height
 *   rimRadius = rimDiameterIn * 0.0254 / 2
 *   sidewall = (widthMm * aspectRatio / 100) / 1000
 */
export function tireRadiusM(tireSize: TireSize): number {
  const rimRadiusM = (tireSize.rimDiameterIn * 0.0254) / 2
  const sidewallM = (tireSize.widthMm * tireSize.aspectRatio) / 100 / 1000
  return rimRadiusM + sidewallM
}

/**
 * Rolling resistance force in Newtons.
 * F_rr = Crr * mass * g
 */
export function rollingResistanceN(
  massKg: number,
  crr: number,
  gravityMs2: number,
): number {
  return crr * massKg * gravityMs2
}
