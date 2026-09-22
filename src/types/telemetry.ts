/**
 * Types for the Telemetry What-If feature: import a logged run, find where the
 * car was power-limited vs grip-limited, and re-simulate only the power-limited
 * stretches with a modified powertrain.
 */

/** Logical channels the analysis can consume. Only time + speed are required. */
export type TelemetryChannel =
  | 'time'
  | 'speed'
  | 'distance'
  | 'longAccel'
  | 'latAccel'
  | 'throttle'
  | 'rpm'
  | 'lat'
  | 'lon'
  | 'elevation'

export type SpeedUnit = 'mph' | 'kmh' | 'ms'
export type TimeUnit = 's' | 'ms'
export type DistanceUnit = 'm' | 'ft' | 'km' | 'mi'
export type AccelUnit = 'g' | 'ms2'
export type ThrottleUnit = 'pct' | 'fraction'

/** Which CSV column feeds each channel, plus the unit each column is in. */
export interface ColumnMapping {
  columns: Partial<Record<TelemetryChannel, string>>
  speedUnit: SpeedUnit
  timeUnit: TimeUnit
  distanceUnit: DistanceUnit
  accelUnit: AccelUnit
  throttleUnit: ThrottleUnit
  /** Some loggers log lateral accel with the opposite sign convention. Purely cosmetic for analysis. */
  invertLatAccel?: boolean
}

/** A parsed CSV: header names plus raw string cells. */
export interface ParsedTable {
  headers: string[]
  rows: string[][]
}

/** One resampled sample on a uniform distance grid. SI units throughout. */
export interface TelemetrySample {
  distanceM: number
  timeS: number
  speedMs: number
  /** Longitudinal acceleration (m/s²), positive = accelerating */
  longAccelMs2: number
  /** Absolute lateral acceleration (m/s²). 0 when no lateral source exists. */
  latAccelMs2: number
  /** Throttle 0–1, undefined when the log has no throttle channel */
  throttle?: number
  rpm?: number
}

export interface TelemetryRun {
  sourceName: string
  samples: TelemetrySample[]
  /** Distance grid step (m) */
  stepM: number
  totalDistanceM: number
  totalTimeS: number
  hasThrottle: boolean
  hasRpm: boolean
  hasLatAccel: boolean
  /** Original sample rate estimate (Hz) before resampling */
  sourceRateHz: number
  /** Median GPS elevation (m) when the log has one; drives the altitude suggestion */
  elevationM?: number
}

/** Measured grip limits derived from the run's own g-g scatter. */
export interface GripEnvelope {
  maxLatG: number
  maxAccelG: number
  maxBrakeG: number
}

/**
 * What limited the car at each sample:
 * - power: throttle pinned (or no throttle channel), accelerating, well inside the grip circle
 * - grip: accelerating but at the edge of the grip circle (traction-limited)
 * - cornering: lateral g at the measured limit
 * - braking: decelerating
 * - driver: partial throttle / coasting, not at any limit
 */
export type LimitKind = 'power' | 'grip' | 'cornering' | 'braking' | 'driver'

export interface RunSegment {
  index: number
  kind: LimitKind
  startIdx: number
  /** Exclusive end sample index */
  endIdx: number
  startM: number
  endM: number
  entrySpeedMs: number
  exitSpeedMs: number
  peakSpeedMs: number
  timeS: number
}

/** One [speed, force] point inferred from the log: F = m·a + drag + rolling. */
export interface RoadDynoPoint {
  speedMs: number
  forceN: number
  count: number
}

export interface WhatIfSegmentResult {
  segment: RunSegment
  baselineTimeS: number
  modifiedTimeS: number
  deltaS: number
  baselinePeakMs: number
  modifiedPeakMs: number
  baselineExitMs: number
  modifiedExitMs: number
  /** Distance (m) at which the modified car first became grip-limited, if it did */
  gripLimitedAtM?: number
  /** Distance (m) at which the modified car first hit the braking ceiling into the next fixed section */
  brakingLimitedAtM?: number
  /** Distance (m) at which the modified car first hit the rev limiter (hold-gear mode only) */
  revLimitedAtM?: number
  /** Ceiling speed on the driven line before lateral grip runs out, at the most binding sample (m/s) */
  lineHeadroomCeilingMs: number
  /** ceiling ÷ driven speed at that sample; 1 = already at the lateral limit, Infinity = straight */
  lineHeadroomRatio: number
}

export interface WhatIfResult {
  /** Speed per sample for each trace (aligned with run.samples) */
  measuredSpeedsMs: number[]
  baselineSpeedsMs: number[]
  modifiedSpeedsMs: number[]
  kinds: LimitKind[]
  segments: RunSegment[]
  segmentResults: WhatIfSegmentResult[]
  totalBaselineTimeS: number
  totalModifiedTimeS: number
  totalDeltaS: number
  /** Fraction of run distance classified as power-limited */
  powerLimitedFraction: number
  /** Scalar applied to modeled thrust so the baseline model matches the log (1 = uncalibrated) */
  calibrationFactor: number
  /** RMS speed error (m/s) of the baseline sim vs the measured trace inside power segments */
  baselineFitRmsMs: number
  envelope: GripEnvelope
}

export type GearStrategy = 'optimal' | 'hold'

export interface WhatIfOptions {
  /** Scale modeled thrust so the baseline model matches the measured run. Default true. */
  calibrate: boolean
  /** 'optimal' shifts along the thrust envelope; 'hold' keeps the logged gear (needs rpm). Default 'optimal'. */
  gearStrategy: GearStrategy
  /** Scale the grip envelope with mass change (lighter car = same lateral g). Default false. */
  scaleGripWithMass: boolean
}

export const DEFAULT_WHATIF_OPTIONS: WhatIfOptions = {
  calibrate: true,
  gearStrategy: 'optimal',
  scaleGripWithMass: false,
}
