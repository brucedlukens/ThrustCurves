import { describe, it, expect } from 'vitest'
import { autoDetectMapping, mappingErrors, splitHeader } from './mapping'

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
    expect(m.columns).toEqual({ time: 'time', distance: 'dist', speed: 'speed', lat: 'lat', lon: 'lon', latAccel: 'accx', longAccel: 'accy', rpm: 'rpm', throttle: 'tps' })
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
