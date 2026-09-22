import { describe, it, expect } from 'vitest'
import { autoDetectMapping, mappingErrors, splitHeader, inferTimeUnit, inferAccelUnit } from './mapping'
import { SOLOSTORM_HEADERS } from '@/test/fixtures/solostormHeaders'

describe('splitHeader', () => {
  it('extracts units in parens, brackets, pipes and suffixes', () => {
    expect(splitHeader('Speed (mph)')).toEqual({ name: 'Speed', unit: 'mph' })
    expect(splitHeader('Speed [km/h]')).toEqual({ name: 'Speed', unit: 'km/h' })
    expect(splitHeader('GPS Speed|kph')).toEqual({ name: 'GPS Speed', unit: 'kph' })
    expect(splitHeader('Speed_mph')).toEqual({ name: 'Speed', unit: 'mph' })
    expect(splitHeader('RPM')).toEqual({ name: 'RPM', unit: '' })
  })
})

describe('autoDetectMapping', () => {
  it('maps a RaceCapture-style header set with units', () => {
    const m = autoDetectMapping([
      'Interval|ms',
      'GPS Speed|mph',
      'Distance|mi',
      'AccelX|G',
      'AccelY|G',
      'Throttle|%',
      'RPM|rpm',
      'Latitude|Degrees',
      'Longitude|Degrees',
    ])
    expect(m.columns.time).toBe('Interval|ms')
    expect(m.timeUnit).toBe('ms')
    expect(m.columns.speed).toBe('GPS Speed|mph')
    expect(m.speedUnit).toBe('mph')
    expect(m.columns.distance).toBe('Distance|mi')
    expect(m.distanceUnit).toBe('mi')
    expect(m.columns.latAccel).toBe('AccelX|G')
    expect(m.columns.longAccel).toBe('AccelY|G')
    expect(m.accelUnit).toBe('g')
    expect(m.columns.throttle).toBe('Throttle|%')
    expect(m.columns.rpm).toBe('RPM|rpm')
    expect(m.columns.lat).toBe('Latitude|Degrees')
    expect(m.columns.lon).toBe('Longitude|Degrees')
  })

  it('does not confuse Latitude with lateral accel', () => {
    const m = autoDetectMapping(['Time (s)', 'Speed (km/h)', 'Latitude', 'Longitude', 'Lateral G'])
    expect(m.columns.latAccel).toBe('Lateral G')
    expect(m.columns.lat).toBe('Latitude')
    expect(m.columns.lon).toBe('Longitude')
    expect(m.speedUnit).toBe('kmh')
  })

  it('maps abbreviated Solostorm-style accel headers and GPS_ prefixes', () => {
    const m = autoDetectMapping(['Time (sec)', 'Speed (km/h)', 'LatAcc (G)', 'LonAcc (G)', 'GPS_Lat', 'GPS_Lon', 'Engine RPM', 'Throttle Pos (%)'])
    expect(m.columns.latAccel).toBe('LatAcc (G)')
    expect(m.columns.longAccel).toBe('LonAcc (G)')
    expect(m.columns.lat).toBe('GPS_Lat')
    expect(m.columns.lon).toBe('GPS_Lon')
    expect(m.columns.rpm).toBe('Engine RPM')
    expect(m.columns.throttle).toBe('Throttle Pos (%)')
    expect(m.speedUnit).toBe('kmh')
  })

  it('maps short lowercase headers (accx/accy/tps/dist)', () => {
    const m = autoDetectMapping(['time', 'lap', 'dist', 'speed', 'lat', 'lon', 'alt', 'accx', 'accy', 'accz', 'gyrz', 'rpm', 'tps'])
    expect(m.columns).toEqual({ time: 'time', distance: 'dist', speed: 'speed', lat: 'lat', lon: 'lon', latAccel: 'accx', longAccel: 'accy', rpm: 'rpm', throttle: 'tps', elevation: 'alt' })
  })

  it('falls back to defaults when no unit hints exist', () => {
    const m = autoDetectMapping(['time', 'speed'])
    expect(m.speedUnit).toBe('mph')
    expect(m.timeUnit).toBe('s')
    expect(m.accelUnit).toBe('g')
  })

  it('leaves unmatched channels undefined', () => {
    const m = autoDetectMapping(['time', 'speed'])
    expect(m.columns.rpm).toBeUndefined()
    expect(m.columns.throttle).toBeUndefined()
  })

  it('mappingErrors reports the required channels', () => {
    expect(mappingErrors(autoDetectMapping(['foo', 'bar']))).toHaveLength(2)
    expect(mappingErrors(autoDetectMapping(['time', 'speed']))).toHaveLength(0)
  })
})

describe('autoDetectMapping on a real Solostorm export', () => {
  it('picks GPS time, corrected speed, cumulative distance, calc accel axes, throttle and rpm', () => {
    const m = autoDetectMapping(SOLOSTORM_HEADERS)
    expect(m.columns.time).toBe('GPS_TIME (ms)')
    expect(m.timeUnit).toBe('ms')
    expect(m.columns.speed).toBe('SPEED (m/s)')
    expect(m.speedUnit).toBe('ms')
    expect(m.columns.distance).toBe('MATH_ELAPSED_DISTANCE')
    expect(m.columns.latAccel).toBe('MATH_CALC_ACCEL_X')
    expect(m.columns.longAccel).toBe('MATH_CALC_ACCEL_Y')
    expect(m.columns.lat).toBe('LAT (deg)')
    expect(m.columns.lon).toBe('LONG (deg)')
    expect(m.columns.throttle).toBe('THROTTLE (%)')
    expect(m.columns.rpm).toBe('RPM')
  })

  it('never maps LONG (deg) or LAT (deg) to an accel channel', () => {
    const m = autoDetectMapping(['GPS_TIME (ms)', 'LONG (deg)', 'LAT (deg)', 'SPEED (m/s)'])
    expect(m.columns.longAccel).toBeUndefined()
    expect(m.columns.latAccel).toBeUndefined()
    expect(m.columns.lon).toBe('LONG (deg)')
    expect(m.columns.lat).toBe('LAT (deg)')
  })

  it('infers ms time and m/s² accel from the data when headers carry no unit', () => {
    const headers = ['MATH_ELAPSED_TIME', 'SPEED (m/s)', 'MATH_CALC_ACCEL_X', 'MATH_CALC_ACCEL_Y']
    const rows = Array.from({ length: 30 }, (_, i) => [String(i * 100), String(i), String(8 * Math.sin(i)), String(5)])
    const m = autoDetectMapping(headers, { headers, rows })
    expect(m.columns.time).toBe('MATH_ELAPSED_TIME')
    expect(m.timeUnit).toBe('ms')
    expect(m.accelUnit).toBe('ms2')
    const rowsG = rows.map(r => [String(Number(r[0]) / 1000), r[1], String(Number(r[2]) / 9.8), '0.5'])
    const mg = autoDetectMapping(headers, { headers, rows: rowsG })
    expect(mg.timeUnit).toBe('s')
    expect(mg.accelUnit).toBe('g')
  })

  it('inferTimeUnit / inferAccelUnit give up on unusable columns', () => {
    expect(inferTimeUnit([1, 1, 1])).toBeUndefined()
    expect(inferTimeUnit([NaN, NaN])).toBeUndefined()
    expect(inferAccelUnit([1, 2])).toBeUndefined()
  })
})
