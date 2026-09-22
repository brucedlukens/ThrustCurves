import type {
  AccelUnit,
  ColumnMapping,
  DistanceUnit,
  ParsedTable,
  SpeedUnit,
  TelemetryChannel,
  ThrottleUnit,
  TimeUnit,
} from '@/types/telemetry'
import { numericColumn } from './csv'

/**
 * Split a logger header into a name and an optional unit hint.
 * Handles "Speed (mph)", "Speed [km/h]", "GPS Speed|mph", "Speed_mph".
 */
export function splitHeader(header: string): { name: string; unit: string } {
  const h = header.trim()
  const paren = h.match(/^(.*?)\s*[([{]\s*([^)\]}]*)\s*[)\]}]\s*$/)
  if (paren) return { name: paren[1].trim(), unit: paren[2].trim().toLowerCase() }
  const pipe = h.split('|')
  if (pipe.length >= 2) return { name: pipe[0].trim(), unit: pipe[1].trim().toLowerCase() }
  const us = h.match(/^(.*)_(mph|kph|kmh|km\/h|ms|m\/s|g|s|sec|ms|ft|m|pct|%)$/i)
  if (us) return { name: us[1].trim(), unit: us[2].toLowerCase() }
  return { name: h, unit: '' }
}

const PATTERNS: Record<TelemetryChannel, RegExp[]> = {
  time: [
    /^(gps[_ ]?time|time|timestamp|elapsed|interval|session[_ ]?time|utc[_ ]?time|elapsed[_ ]?time|t)$/i,
    /gps.?time/i,
    /elapsed.?time/i,
    /^time/i,
    /time$/i,
    /elapsed/i,
    /^interval/i,
  ],
  speed: [
    /^(gps[_ ]?speed|speed|velocity|vehicle[_ ]?speed|ground[_ ]?speed|spd)$/i,
    /corrected.?speed/i,
    /gps.*speed/i,
    /speed/i,
    /velocity/i,
  ],
  distance: [
    /^(distance|dist|lap[_ ]?distance|odometer)$/i,
    /(elapsed|total|cumulative|cum|lap).?dist/i,
    /distance/i,
    /^dist/i,
  ],
  longAccel: [
    /calc.?accel.?y/i,
    /^(long?(itudinal)?[_ ]?(accel|acc|g)|g[_ ]?long?|accel[_ ]?y|accely|acc[_ ]?y|inline[_ ]?g|acceleration)$/i,
    /long?(itudinal)?.?(acc|g)/i,
    /accel.?y/i,
    /g.?long?/i,
  ],
  latAccel: [
    /calc.?accel.?x/i,
    /^(lat(eral)?[_ ]?(accel|acc|g)|g[_ ]?lat|accel[_ ]?x|accelx|acc[_ ]?x|lateral[_ ]?g)$/i,
    /lat(eral)?.?(acc|g)/i,
    /accel.?x/i,
    /g.?lat/i,
  ],
  throttle: [/^(throttle|tps|throttle[_ ]?pos(ition)?|accelerator|pedal|throttlepos)$/i, /throttle/i, /^tps/i, /pedal/i],
  rpm: [/^(rpm|engine[_ ]?rpm|engine[_ ]?speed|enginespeed)$/i, /rpm/i, /engine.?speed/i],
  lat: [/^(lat|latitude|gps[_ ]?lat(itude)?)$/i, /^latitude/i, /gps.?lat/i],
  lon: [/^(lon|lng|long|longitude|gps[_ ]?lon(gitude)?|gps[_ ]?long)$/i, /^longitude/i, /gps.?lon/i],
  elevation: [/^(elev(ation)?|alt(itude)?|gps[_ ]?alt(itude)?|height)$/i, /elev/i, /^alt/i],
}

/** Header names that are a GPS position, never an acceleration, whatever the pattern says. */
const POSITION_NAME = /^(gps[_ ]?)?(lat|lon|lng|long|latitude|longitude)$/i

/** Per-sample / derived columns that must not be picked for the cumulative channels. */
const DERIVED_NAME = /(prev|delta|diff|differential|normalized|std|quality|ratio|lap[_ ]?number|sector|system|device)/i

function scoreHeader(name: string, patterns: RegExp[]): number {
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i].test(name)) return patterns.length - i
  }
  return 0
}

function unitFromHint<T extends string>(hint: string, table: Record<string, T>): T | undefined {
  const key = hint.replace(/\s+/g, '').toLowerCase()
  return table[key]
}

const SPEED_UNITS: Record<string, SpeedUnit> = { mph: 'mph', 'mi/h': 'mph', kph: 'kmh', kmh: 'kmh', 'km/h': 'kmh', 'm/s': 'ms', ms: 'ms', mps: 'ms' }
const TIME_UNITS: Record<string, TimeUnit> = { s: 's', sec: 's', secs: 's', seconds: 's', ms: 'ms', msec: 'ms', milliseconds: 'ms' }
const DIST_UNITS: Record<string, DistanceUnit> = { m: 'm', meters: 'm', metres: 'm', ft: 'ft', feet: 'ft', km: 'km', mi: 'mi', miles: 'mi' }
const ACCEL_UNITS: Record<string, AccelUnit> = { g: 'g', gs: 'g', 'm/s2': 'ms2', 'm/s^2': 'ms2', 'm/s²': 'ms2', ms2: 'ms2' }
const THROTTLE_UNITS: Record<string, ThrottleUnit> = { '%': 'pct', pct: 'pct', percent: 'pct', frac: 'fraction', fraction: 'fraction' }

/**
 * Guess a column mapping from header names. Every guess is overridable in the UI.
 * The 'lat' channel must not steal 'latAccel' headers (and vice versa), so we
 * assign channels in a fixed priority order, each header used at most once.
 */
export function autoDetectMapping(headers: string[], table?: ParsedTable): ColumnMapping {
  const parsed = headers.map(h => ({ header: h, ...splitHeader(h) }))
  const used = new Set<string>()
  const columns: Partial<Record<TelemetryChannel, string>> = {}
  const units: Partial<Record<TelemetryChannel, string>> = {}

  const order: TelemetryChannel[] = ['latAccel', 'longAccel', 'lat', 'lon', 'speed', 'time', 'distance', 'throttle', 'rpm', 'elevation']
  for (const ch of order) {
    let best: { header: string; unit: string } | null = null
    let bestScore = 0
    for (const p of parsed) {
      if (used.has(p.header)) continue
      // "Latitude"/"Longitude"/"LONG (deg)" must never match the accel channels
      if ((ch === 'latAccel' || ch === 'longAccel') && (POSITION_NAME.test(p.name) || /itude/i.test(p.name) || /^deg/i.test(p.unit))) continue
      // Accel/G columns must never match the position channels
      if ((ch === 'lat' || ch === 'lon') && /(acc|\bg\b|gs)/i.test(p.name)) continue
      // Per-sample deltas, lap/sector timers and device clocks are not the run's time/distance
      if ((ch === 'time' || ch === 'distance') && DERIVED_NAME.test(p.name)) continue
      const s = scoreHeader(p.name, PATTERNS[ch])
      if (s > bestScore) {
        bestScore = s
        best = p
      }
    }
    if (best) {
      columns[ch] = best.header
      units[ch] = best.unit
      used.add(best.header)
    }
  }

  const speedUnit = unitFromHint(units.speed ?? '', SPEED_UNITS) ?? 'mph'
  let timeUnit = unitFromHint(units.time ?? '', TIME_UNITS)
  const distanceUnit = unitFromHint(units.distance ?? '', DIST_UNITS) ?? 'm'
  let accelUnit = unitFromHint(units.longAccel ?? '', ACCEL_UNITS) ?? unitFromHint(units.latAccel ?? '', ACCEL_UNITS)
  const throttleUnit = unitFromHint(units.throttle ?? '', THROTTLE_UNITS) ?? 'pct'

  // Data-driven fallbacks when the header carries no unit hint
  if (table && columns.time) {
    const inferred = inferTimeUnit(numericColumn(table, columns.time))
    if (timeUnit === undefined || inferred !== undefined) timeUnit = inferred ?? timeUnit
  }
  if (table && accelUnit === undefined) {
    const col = columns.longAccel ?? columns.latAccel
    if (col) accelUnit = inferAccelUnit(numericColumn(table, col))
  }

  return { columns, speedUnit, timeUnit: timeUnit ?? 's', distanceUnit, accelUnit: accelUnit ?? 'g', throttleUnit, deriveLongAccelFromSpeed: true }
}

/**
 * A logger samples somewhere between 1 Hz and 1 kHz: a median step above 5 is
 * milliseconds, a median step below 0.05 would have to be seconds at ≤ 20 Hz… ms.
 * Returns undefined when the column is unusable.
 */
export function inferTimeUnit(values: number[]): TimeUnit | undefined {
  const steps: number[] = []
  for (let i = 1; i < values.length && steps.length < 500; i++) {
    const d = values[i] - values[i - 1]
    if (Number.isFinite(d) && d > 0) steps.push(d)
  }
  if (steps.length < 3) return undefined
  steps.sort((a, b) => a - b)
  const med = steps[Math.floor(steps.length / 2)]
  return med >= 5 ? 'ms' : 's'
}

/** Accel columns in m/s² routinely exceed 3; in g they essentially never do. */
export function inferAccelUnit(values: number[]): AccelUnit | undefined {
  const abs = values.filter(Number.isFinite).map(Math.abs).sort((a, b) => a - b)
  if (abs.length < 10) return undefined
  const p95 = abs[Math.floor(abs.length * 0.95)]
  return p95 > 3 ? 'ms2' : 'g'
}

/** Channels required before a run can be built. */
export function mappingErrors(mapping: ColumnMapping): string[] {
  const errs: string[] = []
  if (!mapping.columns.time) errs.push('A time column is required.')
  if (!mapping.columns.speed) errs.push('A speed column is required.')
  return errs
}
