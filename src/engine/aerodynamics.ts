/**
 * Aerodynamic drag force in Newtons.
 * F_drag = 0.5 * Cd * frontalArea * airDensity * speed²
 */
export function dragForceN(
  cd: number,
  frontalAreaM2: number,
  airDensityKgM3: number,
  speedMs: number,
): number {
  return 0.5 * cd * frontalAreaM2 * airDensityKgM3 * speedMs * speedMs
}
