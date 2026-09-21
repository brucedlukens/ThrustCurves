import type { GripEnvelope, TelemetrySample } from '@/types/telemetry'

export const G = 9.80665

/** Lateral limit assumed when the log has no lateral source at all */
export const DEFAULT_LAT_G = 1.0

/** Percentile used to reject sensor spikes when reading the g-g edge */
const EDGE_PERCENTILE = 0.98

/**
 * Driven-wheel traction as a fraction of lateral grip. A low-powered car never
 * reaches its traction limit under power, so the observed max accel is the
 * engine's limit, not the tires'. Default assumes a 2WD car on the same tires.
 */
export const ACCEL_TRACTION_RATIO = 0.6

/** Floors so a lazy run can't produce a degenerate friction circle */
const MIN_LAT_G = 0.3
const MIN_ACCEL_G = 0.15
const MIN_BRAKE_G = 0.3

export function percentile(values: number[], p: number): number {
  const s = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (s.length === 0) return NaN
  const pos = Math.min(s.length - 1, Math.max(0, (s.length - 1) * p))
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return s[lo] + (s[hi] - s[lo]) * (pos - lo)
}

/**
 * Read the run's grip limits off the outer edge of its g-g scatter.
 * Uses a high percentile rather than the max so single-sample spikes don't set the limit.
 * Accel traction is the larger of what was observed and ACCEL_TRACTION_RATIO × lateral,
 * since a power-limited car never shows its true traction limit in the log.
 */
export function computeGripEnvelope(
  samples: TelemetrySample[],
  hasLatAccel: boolean,
  overrides: Partial<GripEnvelope> = {},
): GripEnvelope {
  const latGs = samples.map(s => s.latAccelMs2 / G)
  const longGs = samples.map(s => s.longAccelMs2 / G)

  const maxLatG =
    overrides.maxLatG ??
    (hasLatAccel ? Math.max(MIN_LAT_G, percentile(latGs, EDGE_PERCENTILE)) : DEFAULT_LAT_G)
  const observedAccelG = percentile(longGs.filter(g => g > 0), EDGE_PERCENTILE) || 0
  const maxAccelG =
    overrides.maxAccelG ?? Math.max(MIN_ACCEL_G, observedAccelG, ACCEL_TRACTION_RATIO * maxLatG)
  const maxBrakeG =
    overrides.maxBrakeG ??
    Math.max(MIN_BRAKE_G, percentile(longGs.filter(g => g < 0).map(g => -g), EDGE_PERCENTILE) || 0)

  return { maxLatG, maxAccelG, maxBrakeG }
}

/**
 * Longitudinal g available at a given lateral usage (friction ellipse).
 * usage = |latG| / maxLatG
 */
export function longitudinalAvailableG(maxLongG: number, latUsage: number): number {
  const u = Math.min(1, Math.max(0, latUsage))
  return maxLongG * Math.sqrt(1 - u * u)
}
