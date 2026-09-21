import type {
  AccelUnit,
  ColumnMapping,
  DistanceUnit,
  SpeedUnit,
  TelemetryChannel,
  ThrottleUnit,
  TimeUnit,
} from '@/types/telemetry'

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
  time: [/^(time|timestamp|elapsed|interval|session ?time|utc ?time|lap ?time|t)$/i, /^time/i, /elapsed/i, /^interval/i],
  speed: [/^(gps ?speed|speed|velocity|vehicle ?speed|ground ?speed|spd)$/i, /gps.*speed/i, /speed/i, /velocity/i],
  distance: [/^(distance|dist|lap ?distance|odometer)$/i, /distance/i, /^dist/i],
  longAccel: [/^(long(itudinal)? ?(accel|acc|g)|g[_ ]?long|accel ?y|accely|acc[_ ]?y|inline ?g|acceleration)$/i, /long.*(acc|g)/i, /accel.?y/i, /g.?long/i],
  latAccel: [/^(lat(eral)? ?(accel|acc|g)|g[_ ]?lat|accel ?x|accelx|acc[_ ]?x|lateral ?g)$/i, /lat(eral)?.*(acc|g)/i, /accel.?x/i, /g.?lat/i],
  throttle: [/^(throttle|tps|throttle ?pos(ition)?|accelerator|pedal|throttlepos)$/i, /throttle/i, /^tps/i, /pedal/i],
  rpm: [/^(rpm|engine ?rpm|engine ?speed|enginespeed)$/i, /rpm/i, /engine.?speed/i],
  lat: [/^(lat|latitude|gps ?lat(itude)?)$/i, /^latitude/i, /gps.?lat/i],
  lon: [/^(lon|lng|long|longitude|gps ?lon(gitude)?)$/i, /^longitude/i, /gps.?lon/i],
}

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
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const parsed = headers.map(h => ({ header: h, ...splitHeader(h) }))
  const used = new Set<string>()
  const columns: Partial<Record<TelemetryChannel, string>> = {}
  const units: Partial<Record<TelemetryChannel, string>> = {}

  const order: TelemetryChannel[] = ['latAccel', 'longAccel', 'lat', 'lon', 'speed', 'time', 'distance', 'throttle', 'rpm']
  for (const ch of order) {
    let best: { header: string; unit: string } | null = null
    let bestScore = 0
    for (const p of parsed) {
      if (used.has(p.header)) continue
      // "Latitude"/"Longitude" must never match the accel channels
      if ((ch === 'latAccel' || ch === 'longAccel') && /itude/i.test(p.name)) continue
      // Accel/G columns must never match the position channels
      if ((ch === 'lat' || ch === 'lon') && /(acc|\bg\b|gs)/i.test(p.name)) continue
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
  const timeUnit = unitFromHint(units.time ?? '', TIME_UNITS) ?? 's'
  const distanceUnit = unitFromHint(units.distance ?? '', DIST_UNITS) ?? 'm'
  const accelUnit =
    unitFromHint(units.longAccel ?? '', ACCEL_UNITS) ?? unitFromHint(units.latAccel ?? '', ACCEL_UNITS) ?? 'g'
  const throttleUnit = unitFromHint(units.throttle ?? '', THROTTLE_UNITS) ?? 'pct'

  return { columns, speedUnit, timeUnit, distanceUnit, accelUnit, throttleUnit }
}

/** Channels required before a run can be built. */
export function mappingErrors(mapping: ColumnMapping): string[] {
  const errs: string[] = []
  if (!mapping.columns.time) errs.push('A time column is required.')
  if (!mapping.columns.speed) errs.push('A speed column is required.')
  return errs
}
