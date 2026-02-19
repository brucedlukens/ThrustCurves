import { describe, it, expect } from 'vitest'
import { runIntegration } from './performance'
import type { IntegrationParams } from './performance'
import type { EnvelopePoint, GearThrustCurve, ShiftPoint } from '@/types/simulation'

// A simple 2-gear test scenario with constant thrust
// to allow analytical verification.
function makeSimpleParams(overrides: Partial<IntegrationParams> = {}): IntegrationParams {
  // Constant thrust envelope: 3000 N from 0 to 50 m/s, then 0
  const envelope: EnvelopePoint[] = Array.from({ length: 101 }, (_, i) => ({
    speedMs: i * 0.5,
    forceN: 3000,
    gear: 1,
  }))

  const gearCurves: GearThrustCurve[] = [
    {
      gear: 1,
      points: [
        { speedMs: 0, forceN: 3000, rpm: 1000 },
        { speedMs: 50, forceN: 3000, rpm: 6000 },
      ],
      speedRangeMs: [0, 50],
    },
  ]

  const shiftPoints: ShiftPoint[] = []

  return {
    envelope,
    gearCurves,
    shiftPoints,
    massKg: 1500,
    shiftTimeMs: 0,
    crr: 0, // no rolling resistance
    airDensityKgM3: 0, // no drag
    cd: 0,
    frontalAreaM2: 0,
    gravityMs2: 9.81,
    gearEffectiveRatios: [17.3],
    tireRadiusM: 0.33755,
    ...overrides,
  }
}

describe('runIntegration', () => {
  it('returns non-empty trace', () => {
    const { trace } = runIntegration(makeSimpleParams())
    expect(trace.length).toBeGreaterThan(0)
  })

  it('trace starts at time=0, speed=0, distance=0', () => {
    const { trace } = runIntegration(makeSimpleParams())
    expect(trace[0].timeS).toBe(0)
    expect(trace[0].speedMs).toBe(0)
    expect(trace[0].distanceM).toBe(0)
  })

  it('with constant thrust and no drag, acceleration = F/m', () => {
    // 3000 N / 1500 kg = 2 m/s²
    const { trace } = runIntegration(makeSimpleParams())
    expect(trace[0].accelerationMs2).toBeCloseTo(2.0, 4)
  })

  it('captures 0-60 mph metric (with constant high thrust)', () => {
    // F=3000 N, m=1500 kg → a=2 m/s²
    // v = a*t → 26.82 m/s at t ≈ 13.41 s
    const { performance } = runIntegration(makeSimpleParams())
    expect(performance.zeroTo60Mph).toBeDefined()
    expect(performance.zeroTo60Mph!).toBeCloseTo(13.41, 0)
  })

  it('captures 0-100 km/h metric', () => {
    const { performance } = runIntegration(makeSimpleParams())
    expect(performance.zeroTo100Kmh).toBeDefined()
    expect(performance.zeroTo100Kmh!).toBeGreaterThan(0)
    // 100 km/h ≈ 27.78 m/s, should be slightly more than 0-60 time
    expect(performance.zeroTo100Kmh!).toBeGreaterThan(performance.zeroTo60Mph!)
  })

  it('captures quarter mile metric', () => {
    const { performance } = runIntegration(makeSimpleParams())
    expect(performance.quarterMileS).toBeDefined()
    expect(performance.quarterMileSpeedMs).toBeDefined()
    expect(performance.quarterMileSpeedMs!).toBeGreaterThan(0)
  })

  it('sets topSpeedMs from last envelope point', () => {
    const { performance } = runIntegration(makeSimpleParams())
    expect(performance.topSpeedMs).toBe(50) // last envelope point is at 50 m/s
  })

  it('gear number increases monotonically when shift points are defined', () => {
    const shiftPoints: ShiftPoint[] = [
      { fromGear: 1, toGear: 2, speedMs: 10, rpm: 4000 },
    ]
    const gearCurves: GearThrustCurve[] = [
      {
        gear: 1,
        points: [
          { speedMs: 0, forceN: 5000, rpm: 1000 },
          { speedMs: 15, forceN: 5000, rpm: 6000 },
        ],
        speedRangeMs: [0, 15],
      },
      {
        gear: 2,
        points: [
          { speedMs: 5, forceN: 3000, rpm: 1000 },
          { speedMs: 50, forceN: 3000, rpm: 6000 },
        ],
        speedRangeMs: [5, 50],
      },
    ]
    const params = makeSimpleParams({
      gearCurves,
      shiftPoints,
      gearEffectiveRatios: [17.3, 9.0],
    })

    const { trace } = runIntegration(params)

    // Find all gear transitions in trace
    const gearValues = trace.map((t) => t.gear)
    let prevGear = gearValues[0]
    for (const g of gearValues) {
      expect(g).toBeGreaterThanOrEqual(prevGear)
      prevGear = g
    }
  })

  it('thrust is 0 during gear change period', () => {
    const shiftPoints: ShiftPoint[] = [
      { fromGear: 1, toGear: 2, speedMs: 5, rpm: 3000 },
    ]
    const gearCurves: GearThrustCurve[] = [
      {
        gear: 1,
        points: [
          { speedMs: 0, forceN: 3000, rpm: 1000 },
          { speedMs: 10, forceN: 3000, rpm: 6000 },
        ],
        speedRangeMs: [0, 10],
      },
      {
        gear: 2,
        points: [
          { speedMs: 3, forceN: 2000, rpm: 1000 },
          { speedMs: 50, forceN: 2000, rpm: 6000 },
        ],
        speedRangeMs: [3, 50],
      },
    ]
    const params = makeSimpleParams({
      gearCurves,
      shiftPoints,
      massKg: 1500,
      shiftTimeMs: 200, // 200 ms shift time
      gearEffectiveRatios: [17.3, 9.0],
    })

    const { trace } = runIntegration(params)
    // Find the shift event in the trace
    const shiftSteps = trace.filter((t) => t.gear === 2 && t.thrustN === 0)
    // Some steps immediately after the shift should have zero thrust
    expect(shiftSteps.length).toBeGreaterThan(0)
  })
})
