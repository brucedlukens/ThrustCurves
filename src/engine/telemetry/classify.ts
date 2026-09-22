import type { GripEnvelope, LimitKind, RunSegment, TelemetrySample } from '@/types/telemetry'
import { G } from './envelope'

/** Decel beyond this (g) counts as braking */
export const BRAKE_THRESHOLD_G = 0.1
/** Accel above this (g) counts as accelerating */
export const ACCEL_THRESHOLD_G = 0.03
/** Fraction of the grip circle at which a sample is "at the limit" */
export const LIMIT_FRACTION = 0.85
/** Throttle at or above this is "pinned" */
export const THROTTLE_PINNED = 0.85
/** Segments shorter than this (m) are merged into their predecessor */
export const MIN_SEGMENT_M = 5
/** A run starting below this speed (m/s) is a standing start */
export const STANDING_START_MS = 3
/** The launch lasts until the car reaches this speed (m/s, ≈27 mph)… */
export const LAUNCH_END_MS = 12
/** …or this far from the line, whichever comes first (m) */
export const LAUNCH_MAX_M = 60

export interface ClassifyOptions {
  hasThrottle: boolean
}

/** Classify each sample by what limited it. */
export function classifySamples(
  samples: TelemetrySample[],
  env: GripEnvelope,
  opts: ClassifyOptions,
): LimitKind[] {
  return samples.map(s => {
    const longG = s.longAccelMs2 / G
    const latUse = s.latAccelMs2 / G / env.maxLatG
    if (longG < -BRAKE_THRESHOLD_G) return 'braking'
    if (latUse >= LIMIT_FRACTION) return 'cornering'
    const accelerating = longG > ACCEL_THRESHOLD_G
    const throttleOpen = opts.hasThrottle && (s.throttle ?? 0) >= THROTTLE_PINNED
    if (!accelerating) {
      // Pinned throttle with no acceleration = drag- or rev-limited: still the engine's problem
      return throttleOpen ? 'power' : 'driver'
    }
    const combined = Math.hypot(longG / env.maxAccelG, latUse)
    if (combined >= LIMIT_FRACTION) return 'grip'
    return throttleOpen || !opts.hasThrottle ? 'power' : 'driver'
  })
}

/**
 * Remove runs shorter than MIN_SEGMENT_M by absorbing them into the previous run
 * (or the next one at the very start). Keeps segment boundaries meaningful on noisy data.
 */
/**
 * Mark the standing-start launch. Off the line the car is clutch- and traction-limited
 * whatever the engine makes, so those samples stay at their logged speed.
 */
export function markLaunch(samples: TelemetrySample[], kinds: LimitKind[]): LimitKind[] {
  if (samples.length === 0 || samples[0].speedMs >= STANDING_START_MS) return kinds
  const out = [...kinds]
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]
    if (s.speedMs >= LAUNCH_END_MS || s.distanceM - samples[0].distanceM >= LAUNCH_MAX_M) break
    out[i] = 'launch'
  }
  return out
}

export function smoothKinds(kinds: LimitKind[], stepM: number): LimitKind[] {
  const minLen = Math.max(1, Math.round(MIN_SEGMENT_M / stepM))
  const out = [...kinds]
  let changed = true
  let guard = 0
  while (changed && guard++ < 10) {
    changed = false
    let i = 0
    while (i < out.length) {
      let j = i
      while (j < out.length && out[j] === out[i]) j++
      const len = j - i
      if (len < minLen && out.length > len) {
        const fill = i > 0 ? out[i - 1] : out[j]
        if (fill !== undefined && fill !== out[i]) {
          for (let k = i; k < j; k++) out[k] = fill
          changed = true
        }
      }
      i = j
    }
  }
  return out
}

/** Group consecutive same-kind samples into segments. */
export function segmentRun(samples: TelemetrySample[], kinds: LimitKind[]): RunSegment[] {
  const segs: RunSegment[] = []
  let i = 0
  while (i < kinds.length) {
    let j = i
    while (j < kinds.length && kinds[j] === kinds[i]) j++
    const slice = samples.slice(i, j)
    const last = Math.min(j, samples.length - 1)
    segs.push({
      index: segs.length,
      kind: kinds[i],
      startIdx: i,
      endIdx: j,
      startM: samples[i].distanceM,
      endM: samples[last].distanceM,
      entrySpeedMs: samples[i].speedMs,
      exitSpeedMs: samples[last].speedMs,
      peakSpeedMs: Math.max(...slice.map(s => s.speedMs)),
      timeS: samples[last].timeS - samples[i].timeS,
    })
    i = j
  }
  return segs
}
