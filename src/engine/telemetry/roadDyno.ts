import type { LimitKind, RoadDynoPoint, TelemetrySample } from '@/types/telemetry'
import { dragForceN } from '../aerodynamics'
import { rollingResistanceN } from '../tires'

export interface RoadLoadParams {
  massKg: number
  cd: number
  frontalAreaM2: number
  airDensityKgM3: number
  crr: number
  gravityMs2: number
}

/** Tractive force implied by a sample: F = m·a + drag + rolling resistance. */
export function impliedTractiveForceN(s: TelemetrySample, p: RoadLoadParams): number {
  return (
    p.massKg * s.longAccelMs2 +
    dragForceN(p.cd, p.frontalAreaM2, p.airDensityKgM3, s.speedMs) +
    rollingResistanceN(p.massKg, p.crr, p.gravityMs2)
  )
}

/**
 * "Road dyno": bin the power-limited samples by speed and take the median
 * implied tractive force in each bin. This is what the car actually delivered
 * at the wheels that day, to compare against the modeled thrust envelope.
 */
export function inferRoadDyno(
  samples: TelemetrySample[],
  kinds: LimitKind[],
  p: RoadLoadParams,
  binMs = 1,
  minSpeedMs = 3,
): RoadDynoPoint[] {
  const bins = new Map<number, number[]>()
  samples.forEach((s, i) => {
    if (kinds[i] !== 'power' || s.speedMs < minSpeedMs) return
    const key = Math.round(s.speedMs / binMs)
    const arr = bins.get(key) ?? []
    arr.push(impliedTractiveForceN(s, p))
    bins.set(key, arr)
  })
  return [...bins.entries()]
    .map(([key, forces]) => {
      const sorted = [...forces].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      const med = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
      return { speedMs: key * binMs, forceN: med, count: forces.length }
    })
    .sort((a, b) => a.speedMs - b.speedMs)
}
