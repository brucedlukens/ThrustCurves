/**
 * Wheel rate from spring rate and motion ratio.
 * k_wheel = k_spring × MR²
 *
 * @param springRateNPerM Spring rate in N/m
 * @param motionRatio Ratio of spring travel to wheel travel (dimensionless)
 * @returns Wheel rate in N/m
 */
export function wheelRateNPerM(springRateNPerM: number, motionRatio: number): number {
  return springRateNPerM * motionRatio * motionRatio
}

/**
 * Natural frequency of a spring-mass suspension corner.
 * f = (1 / 2π) × √(wheelRate / sprungMass)
 *
 * @param wheelRateNPerM Wheel rate in N/m
 * @param sprungMassKg Sprung mass at the corner in kg
 * @returns Frequency in Hz, or 0 for invalid inputs
 */
export function suspensionFrequencyHz(wheelRateNPerM: number, sprungMassKg: number): number {
  if (wheelRateNPerM <= 0 || sprungMassKg <= 0) return 0
  return (1 / (2 * Math.PI)) * Math.sqrt(wheelRateNPerM / sprungMassKg)
}

/**
 * Front-to-rear frequency ratio.
 * Flat-ride guideline: rear should be 10–20% higher than front (ratio 1.10–1.20).
 *
 * @returns rear / front ratio, or 0 if front frequency is zero
 */
export function frequencyRatio(frontHz: number, rearHz: number): number {
  if (frontHz <= 0) return 0
  return rearHz / frontHz
}
