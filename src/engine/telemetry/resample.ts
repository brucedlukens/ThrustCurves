import type { ColumnMapping, ParsedTable, TelemetryRun, TelemetrySample } from '@/types/telemetry'
import { numericColumn } from './csv'

const G = 9.80665

/** Default distance grid step (m) */
export const DEFAULT_STEP_M = 1

/** Smoothing window in seconds applied to speed before differentiating */
const SPEED_SMOOTH_S = 0.3

export function speedToMs(v: number, unit: ColumnMapping['speedUnit']): number {
  switch (unit) {
    case 'mph':
      return v * 0.44704
    case 'kmh':
      return v / 3.6
    default:
      return v
  }
}

export function distanceToM(d: number, unit: ColumnMapping['distanceUnit']): number {
  switch (unit) {
    case 'ft':
      return d * 0.3048
    case 'km':
      return d * 1000
    case 'mi':
      return d * 1609.344
    default:
      return d
  }
}

export function accelToMs2(a: number, unit: ColumnMapping['accelUnit']): number {
  return unit === 'g' ? a * G : a
}

/** Centered moving average; window is forced odd and >= 1. NaNs are skipped. */
export function movingAverage(values: number[], window: number): number[] {
  const w = Math.max(1, window | 1)
  if (w === 1) return [...values]
  const half = (w - 1) / 2
  const out = new Array<number>(values.length)
  for (let i = 0; i < values.length; i++) {
    let sum = 0
    let n = 0
    for (let j = Math.max(0, i - half); j <= Math.min(values.length - 1, i + half); j++) {
      const v = values[j]
      if (Number.isFinite(v)) {
        sum += v
        n++
      }
    }
    out[i] = n > 0 ? sum / n : NaN
  }
  return out
}

/** Central-difference derivative dy/dx on an irregular grid. */
export function derivative(ys: number[], xs: number[]): number[] {
  const n = ys.length
  const out = new Array<number>(n).fill(0)
  if (n < 2) return out
  for (let i = 0; i < n; i++) {
    const i0 = Math.max(0, i - 1)
    const i1 = Math.min(n - 1, i + 1)
    const dx = xs[i1] - xs[i0]
    out[i] = dx > 0 ? (ys[i1] - ys[i0]) / dx : 0
  }
  return out
}

function median(values: number[]): number {
  const s = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (s.length === 0) return NaN
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** Heading (radians) between two lat/lon points. */
function bearingRad(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return Math.atan2(y, x)
}

/** Unwrap an angle difference into (-π, π]. */
function wrapAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI
  while (a <= -Math.PI) a += 2 * Math.PI
  return a
}

/**
 * Linear interpolation of ys(xs) at each point of grid. xs must be strictly increasing.
 * Values outside [xs[0], xs[n-1]] clamp to the end values.
 */
export function interpolateOnGrid(xs: number[], ys: number[], grid: number[]): number[] {
  const out = new Array<number>(grid.length)
  let j = 0
  for (let k = 0; k < grid.length; k++) {
    const x = grid[k]
    while (j < xs.length - 2 && xs[j + 1] < x) j++
    if (x <= xs[0]) {
      out[k] = ys[0]
    } else if (x >= xs[xs.length - 1]) {
      out[k] = ys[ys.length - 1]
    } else {
      const t = (x - xs[j]) / (xs[j + 1] - xs[j])
      out[k] = ys[j] + t * (ys[j + 1] - ys[j])
    }
  }
  return out
}

export interface BuildRunOptions {
  stepM?: number
  sourceName?: string
}

/**
 * Turn a parsed table + column mapping into a run resampled on a uniform
 * distance grid. Derives distance, longitudinal accel and lateral accel from
 * what the log provides when the direct channels are missing.
 */
export function buildRun(table: ParsedTable, mapping: ColumnMapping, opts: BuildRunOptions = {}): TelemetryRun {
  const stepM = opts.stepM ?? DEFAULT_STEP_M
  const sourceName = opts.sourceName ?? 'log'
  const col = (ch: keyof ColumnMapping['columns']) => {
    const h = mapping.columns[ch]
    return h ? numericColumn(table, h) : undefined
  }

  const rawTime = col('time')
  const rawSpeed = col('speed')
  if (!rawTime || !rawSpeed) throw new Error('Time and speed columns are required')

  // Keep rows with finite time + speed and strictly increasing time
  const keep: number[] = []
  let lastT = -Infinity
  for (let i = 0; i < rawTime.length; i++) {
    const t = mapping.timeUnit === 'ms' ? rawTime[i] / 1000 : rawTime[i]
    if (!Number.isFinite(t) || !Number.isFinite(rawSpeed[i])) continue
    if (t <= lastT) continue
    keep.push(i)
    lastT = t
  }
  if (keep.length < 5) throw new Error('Not enough valid rows (need at least 5 with time and speed)')

  const pick = (arr: number[] | undefined) => (arr ? keep.map(i => arr[i]) : undefined)
  const t0raw = mapping.timeUnit === 'ms' ? rawTime[keep[0]] / 1000 : rawTime[keep[0]]
  const timeS = keep.map(i => (mapping.timeUnit === 'ms' ? rawTime[i] / 1000 : rawTime[i]) - t0raw)
  const speedRaw = keep.map(i => Math.max(0, speedToMs(rawSpeed[i], mapping.speedUnit)))

  const dts = timeS.slice(1).map((t, i) => t - timeS[i])
  const medianDt = median(dts)
  const sourceRateHz = medianDt > 0 ? 1 / medianDt : 10
  const smoothWindow = Math.max(1, Math.round(SPEED_SMOOTH_S * sourceRateHz))
  const speedMs = movingAverage(speedRaw, smoothWindow)

  // Distance: logged column (made monotonic) or integrated speed
  let distanceM: number[]
  const rawDist = pick(col('distance'))
  if (rawDist && rawDist.filter(Number.isFinite).length === rawDist.length) {
    const d0 = distanceToM(rawDist[0], mapping.distanceUnit)
    distanceM = rawDist.map(d => distanceToM(d, mapping.distanceUnit) - d0)
    for (let i = 1; i < distanceM.length; i++) {
      if (distanceM[i] < distanceM[i - 1]) distanceM[i] = distanceM[i - 1]
    }
  } else {
    distanceM = new Array<number>(timeS.length).fill(0)
    for (let i = 1; i < timeS.length; i++) {
      distanceM[i] = distanceM[i - 1] + ((speedMs[i - 1] + speedMs[i]) / 2) * (timeS[i] - timeS[i - 1])
    }
  }

  // Longitudinal accel: channel or derivative of smoothed speed
  const rawLong = pick(col('longAccel'))
  let longAccelMs2: number[]
  if (rawLong && rawLong.some(Number.isFinite)) {
    longAccelMs2 = movingAverage(
      rawLong.map(a => (Number.isFinite(a) ? accelToMs2(a, mapping.accelUnit) : NaN)),
      smoothWindow,
    ).map(a => (Number.isFinite(a) ? a : 0))
  } else {
    longAccelMs2 = derivative(speedMs, timeS)
  }

  // Lateral accel: channel, or yaw-rate × speed from GPS heading, or none
  const rawLat = pick(col('latAccel'))
  const rawLatitude = pick(col('lat'))
  const rawLongitude = pick(col('lon'))
  let latAccelMs2: number[]
  let hasLatAccel = false
  if (rawLat && rawLat.some(Number.isFinite)) {
    hasLatAccel = true
    latAccelMs2 = movingAverage(
      rawLat.map(a => (Number.isFinite(a) ? Math.abs(accelToMs2(a, mapping.accelUnit)) : NaN)),
      smoothWindow,
    ).map(a => (Number.isFinite(a) ? a : 0))
  } else if (rawLatitude && rawLongitude && rawLatitude.every(Number.isFinite) && rawLongitude.every(Number.isFinite)) {
    hasLatAccel = true
    const heading = new Array<number>(timeS.length).fill(0)
    for (let i = 1; i < timeS.length; i++) {
      const moved =
        Math.abs(rawLatitude[i] - rawLatitude[i - 1]) + Math.abs(rawLongitude[i] - rawLongitude[i - 1]) > 1e-7
      heading[i] = moved
        ? bearingRad(rawLatitude[i - 1], rawLongitude[i - 1], rawLatitude[i], rawLongitude[i])
        : heading[i - 1]
    }
    heading[0] = heading[1] ?? 0
    const yawRate = new Array<number>(timeS.length).fill(0)
    for (let i = 1; i < timeS.length - 1; i++) {
      const dt = timeS[i + 1] - timeS[i - 1]
      yawRate[i] = dt > 0 ? wrapAngle(heading[i + 1] - heading[i - 1]) / dt : 0
    }
    latAccelMs2 = movingAverage(
      yawRate.map((r, i) => Math.abs(r * speedMs[i])),
      Math.max(smoothWindow, 3),
    )
  } else {
    latAccelMs2 = new Array<number>(timeS.length).fill(0)
  }

  const rawThrottle = pick(col('throttle'))
  const hasThrottle = !!rawThrottle && rawThrottle.some(Number.isFinite)
  const throttle = hasThrottle
    ? rawThrottle!.map(v => {
        if (!Number.isFinite(v)) return NaN
        const f = mapping.throttleUnit === 'pct' ? v / 100 : v
        return Math.min(1, Math.max(0, f))
      })
    : undefined

  const rawRpm = pick(col('rpm'))
  const hasRpm = !!rawRpm && rawRpm.some(Number.isFinite)

  // Collapse duplicate distances (stationary periods) keeping the LAST row for each,
  // so the launch instant is what lands at distance 0.
  const xs: number[] = []
  const idx: number[] = []
  for (let i = 0; i < distanceM.length; i++) {
    if (xs.length > 0 && distanceM[i] - xs[xs.length - 1] < 1e-6) {
      idx[idx.length - 1] = i
    } else {
      xs.push(distanceM[i])
      idx.push(i)
    }
  }
  if (xs.length < 2) throw new Error('The log has no movement (distance never increases)')

  const totalDistanceM = xs[xs.length - 1]
  const gridN = Math.floor(totalDistanceM / stepM) + 1
  const grid = Array.from({ length: gridN }, (_, k) => k * stepM)
  const gather = (arr: number[]) => idx.map(i => arr[i])

  const gTime = interpolateOnGrid(xs, gather(timeS), grid)
  const gSpeed = interpolateOnGrid(xs, gather(speedMs), grid)
  const gLong = interpolateOnGrid(xs, gather(longAccelMs2), grid)
  const gLat = interpolateOnGrid(xs, gather(latAccelMs2), grid)
  const gThrottle = throttle ? interpolateOnGrid(xs, gather(throttle.map(v => (Number.isFinite(v) ? v : 1))), grid) : undefined
  const gRpm = hasRpm ? interpolateOnGrid(xs, gather(rawRpm!.map(v => (Number.isFinite(v) ? v : 0))), grid) : undefined

  const samples: TelemetrySample[] = grid.map((d, k) => ({
    distanceM: d,
    timeS: gTime[k],
    speedMs: gSpeed[k],
    longAccelMs2: gLong[k],
    latAccelMs2: gLat[k],
    ...(gThrottle ? { throttle: gThrottle[k] } : {}),
    ...(gRpm ? { rpm: gRpm[k] } : {}),
  }))

  return {
    sourceName,
    samples,
    stepM,
    totalDistanceM,
    totalTimeS: timeS[timeS.length - 1],
    hasThrottle,
    hasRpm,
    hasLatAccel,
    sourceRateHz,
  }
}
