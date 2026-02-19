import { SEA_LEVEL_AIR_DENSITY } from '@/data/presets'

/**
 * Air density in kg/m³ at a given altitude in meters.
 * Uses the International Standard Atmosphere (ISA) troposphere model.
 * Formula: ρ = 1.225 * (1 - 2.25577e-5 * h)^5.25588
 */
export function airDensityAtAltitude(altitudeM: number): number {
  return SEA_LEVEL_AIR_DENSITY * Math.pow(1 - 2.25577e-5 * altitudeM, 5.25588)
}

/**
 * Power correction factor for naturally aspirated engines.
 * Power is proportional to air density (~-3% per 1000 ft / ~-10% per 1000 m).
 */
export function naPowerCorrection(altitudeM: number): number {
  return airDensityAtAltitude(altitudeM) / SEA_LEVEL_AIR_DENSITY
}

/**
 * Power correction factor for turbocharged/supercharged engines.
 * Boost partially compensates for lower air density (~-1% per 1000 ft).
 * Approx: 1/3 the sensitivity of naturally aspirated.
 */
export function turboPowerCorrection(altitudeM: number): number {
  const naCorrection = naPowerCorrection(altitudeM)
  return 1 - (1 - naCorrection) / 3
}
