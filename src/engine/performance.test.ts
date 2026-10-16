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

  it('sets topSpeedMs from drag-equilibrium speed', () => {
    const { performance } = runIntegration(makeSimpleParams())
    expect(performance.topSpeedMs).toBe(50) // last envelope point is at 50 m/s (no drag in test)
  })

  it('trace extends beyond quarter-mile speed to near top speed', () => {
    // With no drag or rolling resistance, topSpeedMs = 50 m/s.
    // The trace should now continue until speed >= 49.5 m/s (99% of 50),
    // well past the quarter-mile trap speed.
    const { trace, performance } = runIntegration(makeSimpleParams())
    const maxTraceSpeed = Math.max(...trace.map(t => t.speedMs))
    expect(maxTraceSpeed).toBeGreaterThanOrEqual(performance.topSpeedMs! * 0.99)
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

  it('applies grade force as extra resistance', () => {
    // 10% grade: θ = atan(0.1), sinθ = 0.09950
    // net = 3000 − 1500·9.81·0.09950 = 1535.6 N → a = 1.0237 m/s²
    const { trace } = runIntegration(makeSimpleParams({ gradePercent: 10 }))
    expect(trace[0].accelerationMs2).toBeCloseTo(1.0237, 3)
  })

  it('grade reduces the drag-limited top speed', () => {
    // cd 0.9 × 2.5 m² makes drag at 50 m/s (3445 N) exceed the 3000 N thrust,
    // so top speed is drag-limited rather than envelope-capped in both runs
    const flat = runIntegration(makeSimpleParams({ airDensityKgM3: 1.225, cd: 0.9, frontalAreaM2: 2.5 }))
    const hill = runIntegration(
      makeSimpleParams({ airDensityKgM3: 1.225, cd: 0.9, frontalAreaM2: 2.5, gradePercent: 8 }),
    )
    expect(hill.performance.topSpeedMs!).toBeLessThan(flat.performance.topSpeedMs!)
  })

  it('starts from initialSpeedMs when provided', () => {
    const { trace } = runIntegration(makeSimpleParams({ initialSpeedMs: 17.8816 }))
    expect(trace[0].speedMs).toBeCloseTo(17.8816, 4)
    expect(trace[0].timeS).toBe(0)
  })

  it('starts in the correct gear for the initial speed without a shift penalty', () => {
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
    const { trace } = runIntegration(
      makeSimpleParams({
        gearCurves,
        shiftPoints,
        gearEffectiveRatios: [17.3, 9.0],
        initialSpeedMs: 12,
        shiftTimeMs: 500,
      }),
    )
    expect(trace[0].gear).toBe(2)
    expect(trace[0].thrustN).toBeCloseTo(3000, 4)
  })

  it('stops once stopAtSpeedMs is reached', () => {
    // a = 2 m/s²: 17.8816 → 26.8224 m/s takes 4.47 s
    const { trace } = runIntegration(
      makeSimpleParams({ initialSpeedMs: 17.8816, stopAtSpeedMs: 26.8224 }),
    )
    const last = trace[trace.length - 1]
    expect(last.speedMs).toBeGreaterThanOrEqual(26.8224)
    expect(last.timeS).toBeCloseTo(4.47, 1)
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

describe('runIntegration with thrusters', () => {
  it('adds the thruster force during the burn, then stops', () => {
    // Tires 3000 N + thrusters 1500 N on 1500 kg: 3 m/s², then 2 m/s² after 1 s
    const { trace } = runIntegration(makeSimpleParams({ thrusters: { forceN: 1500, durationS: 1 } }))
    expect(trace.find((t) => t.timeS > 0.5)!.accelerationMs2).toBeCloseTo(3.0, 4)
    expect(trace.find((t) => t.timeS > 1.5)!.accelerationMs2).toBeCloseTo(2.0, 4)
  })

  it('keeps tire thrust and thruster force separate in the trace', () => {
    // thrustN stays the tire force: playback reads thrustN === 0 as a gear change
    const { trace } = runIntegration(makeSimpleParams({ thrusters: { forceN: 1500, durationS: 1 } }))
    const step = trace.find((t) => t.timeS > 0.5)!
    expect(step.thrustN).toBeCloseTo(3000, 4)
    expect(step.netForceN).toBeCloseTo(4500, 4)
  })

  it('reaches 60 mph sooner than the same car without them', () => {
    const plain = runIntegration(makeSimpleParams()).performance.zeroTo60Mph!
    const boosted = runIntegration(makeSimpleParams({ thrusters: { forceN: 1500, durationS: 1 } })).performance
      .zeroTo60Mph!
    // 1 s at +1 m/s² is 1 m/s banked: 26.82 m/s arrives 0.5 s earlier at 2 m/s²
    expect(plain - boosted).toBeCloseTo(0.5, 1)
  })
})

describe('runIntegration with a held gear', () => {
  // Three gears, speed = k·rpm with rpm 1000–5000 sampled every 250 rpm:
  //   1st 4–20 m/s, 2nd 7–35 m/s, 3rd 10–50 m/s. Normal shifts at 20 and 35 m/s.
  const KS = [0.004, 0.007, 0.01]
  function gearCurve(gear: number, forceAt: (rpm: number) => number): GearThrustCurve {
    const k = KS[gear - 1]
    const points = Array.from({ length: 17 }, (_, i) => {
      const rpm = 1000 + i * 250
      return { speedMs: k * rpm, forceN: forceAt(rpm), rpm }
    })
    return { gear, points, speedRangeMs: [points[0].speedMs, points[points.length - 1].speedMs] }
  }
  const shiftPoints: ShiftPoint[] = [
    { fromGear: 1, toGear: 2, speedMs: 20, rpm: 5000 },
    { fromGear: 2, toGear: 3, speedMs: 35, rpm: 5000 },
  ]
  function params(
    forces: [(rpm: number) => number, (rpm: number) => number, (rpm: number) => number],
    overrides: Partial<IntegrationParams> = {},
  ): IntegrationParams {
    const gearCurves = forces.map((f, i) => gearCurve(i + 1, f))
    const envelope: EnvelopePoint[] = Array.from({ length: 101 }, (_, i) => {
      const v = i * 0.5
      let best = { forceN: 0, gear: 1 }
      for (const gc of gearCurves) {
        if (v < gc.speedRangeMs[0] || v > gc.speedRangeMs[1]) continue
        const f = gc.points.reduce((a, p) => (Math.abs(p.speedMs - v) < Math.abs(a.speedMs - v) ? p : a)).forceN
        if (f > best.forceN) best = { forceN: f, gear: gc.gear }
      }
      return { speedMs: v, ...best }
    })
    return makeSimpleParams({
      envelope,
      gearCurves,
      shiftPoints,
      massKg: 2000,
      gearEffectiveRatios: [10, 6, 4],
      ...overrides,
    })
  }
  const constant = (n: number) => () => n
  const gearsInOrder = (trace: { gear: number }[]) =>
    trace.map((s) => s.gear).filter((g, i, all) => i === 0 || g !== all[i - 1])

  it('runs lower gears only until the held gear reaches its minimum rpm, then jumps to it', () => {
    // 3rd at 1500 rpm = 15 m/s, before the normal 1→2 shift at 20 m/s
    const { trace } = runIntegration(
      params([constant(6000), constant(3500), constant(2500)], { holdGear: 3, minLoadRpm: 1500, stopAtSpeedMs: 30 }),
    )
    expect(gearsInOrder(trace)).toEqual([1, 3])
    const firstInThird = trace.find((s) => s.gear === 3)!
    expect(firstInThird.speedMs).toBeGreaterThanOrEqual(15)
    expect(firstInThird.speedMs).toBeLessThan(15.1)
  })

  it('starts in the held gear on a rolling start when it is usable there', () => {
    // At 12 m/s normal shifting would be in 1st; 3rd is usable from 10 m/s
    const { trace } = runIntegration(
      params([constant(6000), constant(3500), constant(2500)], { holdGear: 3, initialSpeedMs: 12, stopAtSpeedMs: 30 }),
    )
    expect(trace[0].gear).toBe(3)
    expect(gearsInOrder(trace)).toEqual([3])
  })

  it('stays in the held gear and levels off at redline instead of upshifting', () => {
    // 2nd redlines at 35 m/s; the target is out of reach without 3rd
    const { trace } = runIntegration(
      params([constant(6000), constant(3500), constant(2500)], { holdGear: 2, stopAtSpeedMs: 45 }),
    )
    expect(trace.some((s) => s.gear === 3)).toBe(false)
    const last = trace[trace.length - 1]
    expect(last.speedMs).toBeGreaterThan(34)
    expect(Math.max(...trace.map((s) => s.speedMs))).toBeLessThan(35.1)
    // Rev limiter: no drive force above redline
    expect(trace.filter((s) => s.speedMs > 35).every((s) => s.thrustN === 0)).toBe(true)
  })

  it('drops to a lower gear when the held gear falls below its minimum rpm', () => {
    // ~4000 N of grade: 3rd (2500 N) can't hold speed; 1st pulls only below 3000 rpm (12 m/s)
    const firstGear = (rpm: number) => (rpm < 3000 ? 6000 : 3000)
    const { trace } = runIntegration(
      params([firstGear, constant(3500), constant(2500)], {
        holdGear: 3,
        minLoadRpm: 2000, // 3rd usable from 20 m/s
        initialSpeedMs: 21,
        stopAtSpeedMs: 30,
        gradePercent: 20.8,
      }),
    )
    expect(trace[0].gear).toBe(3)
    expect(gearsInOrder(trace)).toEqual([3, 1])
    const downshift = trace.find((s) => s.gear === 1)!
    expect(downshift.speedMs).toBeLessThan(18) // 0.9 × 20 m/s hysteresis
  })

  it('a rolling start above top speed decelerates and settles instead of stopping at once', () => {
    // 20.8% grade: only 1st below 12 m/s can pull, so the rig slows from 21 m/s
    const firstGear = (rpm: number) => (rpm < 3000 ? 6000 : 3000)
    const { trace } = runIntegration(
      params([firstGear, constant(3500), constant(2500)], { initialSpeedMs: 21, stopAtSpeedMs: 30, gradePercent: 20.8 }),
    )
    expect(trace.length).toBeGreaterThan(1)
    expect(trace[trace.length - 1].speedMs).toBeLessThan(13)
  })

  describe('downshifting while losing speed', () => {
    it('does not downshift for the speed dip during a slow upshift on a grade', () => {
      // ~3000 N of grade; a 1.5 s shift sheds ~11% of the 20 m/s shift speed, but 2nd still pulls
      const { trace } = runIntegration(
        params([constant(6000), constant(3500), constant(2500)], {
          shiftTimeMs: 1500,
          gradePercent: 15.4,
          stopAtSpeedMs: 30,
        }),
      )
      expect(gearsInOrder(trace)).toEqual([1, 2])
      expect(trace[trace.length - 1].speedMs).toBeGreaterThanOrEqual(30)
    })

    it('drops back once from a gear that cannot pull, without hunting', () => {
      // ~4000 N of grade: 1st (6000 N) pulls, 2nd (3500 N) can't. Shift into 2nd at
      // 15 m/s, below 1st's 20 m/s top speed on this grade.
      const { trace } = runIntegration(
        params([constant(6000), constant(3500), constant(2500)], {
          gradePercent: 20.8,
          stopAtSpeedMs: 30,
          shiftPoints: [
            { fromGear: 1, toGear: 2, speedMs: 15, rpm: 3750 },
            { fromGear: 2, toGear: 3, speedMs: 35, rpm: 5000 },
          ],
        }),
      )
      expect(gearsInOrder(trace)).toEqual([1, 2, 1])
      // Back in 1st it runs on past the 15 m/s shift point instead of re-entering 2nd
      expect(trace[trace.length - 1].speedMs).toBeGreaterThan(19)
    })
  })

  describe('cruise speed', () => {
    it('holds the cruise speed at part throttle in the highest gear that can', () => {
      // 3rd (2500 N) has plenty for flat ground with no drag
      const { trace } = runIntegration(
        params([constant(6000), constant(3500), constant(2500)], { initialSpeedMs: 25, cruiseSpeedMs: 25 }),
      )
      expect(trace.every((s) => s.gear === 3)).toBe(true)
      expect(trace.every((s) => Math.abs(s.speedMs - 25) < 1e-9)).toBe(true)
      expect(trace[0].thrustN).toBeCloseTo(0, 6) // no resistance to overcome
      // Ends once steady rather than running to the time limit
      expect(trace[trace.length - 1].timeS).toBeLessThan(1.5)
    })

    it('picks a lower gear when the top gear lacks the thrust on a grade', () => {
      // ~3000 N of grade: 3rd (2500 N) can't, 2nd (3500 N) can at 25 m/s
      const { trace } = runIntegration(
        params([constant(6000), constant(3500), constant(2500)], {
          initialSpeedMs: 25,
          cruiseSpeedMs: 25,
          gradePercent: 15.4,
        }),
      )
      expect(gearsInOrder(trace)).toEqual([2])
      expect(trace[trace.length - 1].speedMs).toBeCloseTo(25, 6)
    })

    it('kicks down and slows when no usable gear can hold the speed', () => {
      // ~4000 N of grade: only 1st pulls, and only below 12 m/s
      const firstGear = (rpm: number) => (rpm < 3000 ? 6000 : 3000)
      const { trace } = runIntegration(
        params([firstGear, constant(3500), constant(2500)], {
          initialSpeedMs: 18,
          cruiseSpeedMs: 18,
          gradePercent: 20.8,
        }),
      )
      expect(trace[trace.length - 1].speedMs).toBeLessThan(13)
      expect(trace.some((s) => s.gear === 1)).toBe(true)
    })

    it('ignores gears below the minimum load rpm when choosing the cruising gear', () => {
      // 3rd at 12 m/s = 1200 rpm; with a 1500 rpm floor it is not usable, 2nd (1714 rpm) is
      const { trace } = runIntegration(
        params([constant(6000), constant(3500), constant(2500)], {
          initialSpeedMs: 12,
          cruiseSpeedMs: 12,
          minLoadRpm: 1500,
        }),
      )
      expect(gearsInOrder(trace)).toEqual([2])
    })

    it('cruises in the held gear when it can hold the speed', () => {
      const { trace } = runIntegration(
        params([constant(6000), constant(3500), constant(2500)], {
          initialSpeedMs: 25,
          cruiseSpeedMs: 25,
          holdGear: 2,
        }),
      )
      expect(gearsInOrder(trace)).toEqual([2])
    })
  })
})

describe('cruising with a curve that starts at 0 rpm (EV)', () => {
  // Single gear, speed = 0.01·rpm, thrust flat from 0 rpm
  const ev = makeSimpleParams({
    gearCurves: [
      {
        gear: 1,
        points: Array.from({ length: 11 }, (_, i) => ({ speedMs: i * 5, forceN: 3000, rpm: i * 500 })),
        speedRangeMs: [0, 50],
      },
    ],
  })

  it('can cruise (a 0 rpm start does not make the gear unusable)', () => {
    const { trace } = runIntegration({ ...ev, initialSpeedMs: 20, cruiseSpeedMs: 20 })
    expect(trace.every((s) => Math.abs(s.speedMs - 20) < 1e-9)).toBe(true)
  })
})
