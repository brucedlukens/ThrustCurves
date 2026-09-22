import { describe, it, expect, beforeEach } from 'vitest'
import { useTelemetryStore } from './telemetryStore'
import { getTestCar, rowsToCsv, synthesizeRun, SAMPLE_COURSE } from '@/test/telemetryFixtures'

const csv = rowsToCsv(synthesizeRun(getTestCar(), SAMPLE_COURSE, { rateHz: 10 }))

describe('telemetryStore', () => {
  beforeEach(() => useTelemetryStore.getState().clear())

  it('loads CSV text, auto-maps and builds a run', () => {
    useTelemetryStore.getState().loadCsvText(csv, 'run.csv')
    const s = useTelemetryStore.getState()
    expect(s.fileName).toBe('run.csv')
    expect(s.table?.rows.length).toBeGreaterThan(100)
    expect(s.mapping?.columns.speed).toBe('Speed (mph)')
    expect(s.run?.hasThrottle).toBe(true)
    expect(s.error).toBeNull()
  })

  it('defaults the gear strategy from the rpm channel', () => {
    useTelemetryStore.getState().loadCsvText(csv, 'run.csv')
    expect(useTelemetryStore.getState().options.gearStrategy).toBe('hold')
    const noRpm = rowsToCsv(synthesizeRun(getTestCar(), SAMPLE_COURSE, { rateHz: 10 }), { withRpm: false })
    useTelemetryStore.getState().loadCsvText(noRpm, 'norpm.csv')
    expect(useTelemetryStore.getState().options.gearStrategy).toBe('optimal')
  })

  it('reports an error when the file has no numeric rows', () => {
    useTelemetryStore.getState().loadCsvText('hello\nworld\n', 'x.csv')
    expect(useTelemetryStore.getState().run).toBeNull()
    expect(useTelemetryStore.getState().error).toMatch(/No numeric rows/)
  })

  it('setMapping rebuilds the run and surfaces mapping errors', () => {
    useTelemetryStore.getState().loadCsvText(csv, 'run.csv')
    const mapping = useTelemetryStore.getState().mapping!
    useTelemetryStore.getState().setMapping({ ...mapping, columns: { ...mapping.columns, speed: undefined } })
    expect(useTelemetryStore.getState().run).toBeNull()
    expect(useTelemetryStore.getState().error).toMatch(/speed column/i)
    useTelemetryStore.getState().setMapping(mapping)
    expect(useTelemetryStore.getState().run).not.toBeNull()
  })

  it('setMapping is a no-op without a table', () => {
    useTelemetryStore.getState().setMapping({ columns: {}, speedUnit: 'mph', timeUnit: 's', distanceUnit: 'm', accelUnit: 'g', throttleUnit: 'pct' })
    expect(useTelemetryStore.getState().mapping).toBeNull()
  })

  it('options and envelope overrides update and clear', () => {
    const s = useTelemetryStore.getState()
    s.setOptions({ gearStrategy: 'hold' })
    expect(useTelemetryStore.getState().options.gearStrategy).toBe('hold')
    s.setEnvelopeOverride('maxLatG', 1.3)
    expect(useTelemetryStore.getState().envelopeOverrides.maxLatG).toBe(1.3)
    s.setEnvelopeOverride('maxLatG', undefined)
    expect(useTelemetryStore.getState().envelopeOverrides.maxLatG).toBeUndefined()
    s.setEnvelopeOverride('maxBrakeG', -1)
    expect(useTelemetryStore.getState().envelopeOverrides.maxBrakeG).toBeUndefined()
  })
})
