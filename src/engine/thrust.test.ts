import { describe, it, expect } from 'vitest'
import {
  effectiveTorqueCurve,
  computeGearThrustCurve,
  computeAllGearCurves,
  computeEnvelope,
  interpolateGearThrust,
  findShiftPoints,
} from './thrust'
import type { CarSpec } from '@/types/car'
import type { CarModifications } from '@/types/config'
import { DEFAULT_MODIFICATIONS } from '@/types/config'

// Minimal test car spec
const testCar: CarSpec = {
  id: 'test-car',
  make: 'Test',
  model: 'Car',
  year: 2024,
  trim: 'Base',
  curbWeightKg: 1500,
  drivetrain: 'RWD',
  engine: {
    torqueCurve: [
      [1000, 200],
      [2000, 300],
      [3000, 350],
      [4000, 340],
      [5000, 300],
      [6000, 250],
    ],
    powerCurve: [
      [1000, 21],
      [2000, 63],
      [3000, 110],
      [4000, 143],
      [5000, 157],
      [6000, 157],
    ],
    redlineRpm: 6000,
    idleRpm: 1000,
    displacementL: 2.0,
    forcedInduction: false,
  },
  transmission: {
    gearRatios: [3.5, 2.0, 1.4, 1.0],
    finalDriveRatio: 4.0,
    shiftTimeMs: 150,
    drivetrainLoss: 0.10,
    type: 'manual',
  },
  tireSize: { widthMm: 225, aspectRatio: 45, rimDiameterIn: 17 },
  aero: { cd: 0.30, frontalAreaM2: 2.0 },
}

const stockMods: CarModifications = {
  ...DEFAULT_MODIFICATIONS,
}

describe('effectiveTorqueCurve', () => {
  it('returns base curve unchanged with multiplier=1 and powerCorrection=1', () => {
    const result = effectiveTorqueCurve(testCar, stockMods, 1.0)
    expect(result).toEqual(testCar.engine.torqueCurve)
  })

  it('applies torqueMultiplier', () => {
    const mods = { ...stockMods, torqueMultiplier: 1.2 }
    const result = effectiveTorqueCurve(testCar, mods, 1.0)
    expect(result[1][1]).toBeCloseTo(300 * 1.2, 5)
  })

  it('applies power correction', () => {
    const result = effectiveTorqueCurve(testCar, stockMods, 0.85)
    expect(result[2][1]).toBeCloseTo(350 * 0.85, 5)
  })

  it('uses customTorqueCurve when provided', () => {
    const custom: [number, number][] = [[1000, 400], [6000, 300]]
    const mods = { ...stockMods, customTorqueCurve: custom }
    const result = effectiveTorqueCurve(testCar, mods, 1.0)
    expect(result[0][1]).toBe(400)
    expect(result[1][1]).toBe(300)
  })
})

describe('computeGearThrustCurve', () => {
  it('produces correct number of points (within idle-redline range)', () => {
    // All 6 torque points are between idle (1000) and redline (6000)
    const torqueCurve = testCar.engine.torqueCurve
    const gear = computeGearThrustCurve(testCar, stockMods, 0, torqueCurve, 0.32)
    expect(gear.points.length).toBe(6)
    expect(gear.gear).toBe(1)
  })

  it('points are sorted by speed', () => {
    const torqueCurve = testCar.engine.torqueCurve
    const gear = computeGearThrustCurve(testCar, stockMods, 0, torqueCurve, 0.32)
    for (let i = 1; i < gear.points.length; i++) {
      expect(gear.points[i].speedMs).toBeGreaterThan(gear.points[i - 1].speedMs)
    }
  })

  it('speedRangeMs matches first and last point', () => {
    const torqueCurve = testCar.engine.torqueCurve
    const gear = computeGearThrustCurve(testCar, stockMods, 1, torqueCurve, 0.32)
    expect(gear.speedRangeMs[0]).toBe(gear.points[0].speedMs)
    expect(gear.speedRangeMs[1]).toBe(gear.points[gear.points.length - 1].speedMs)
  })

  it('applies gear ratio override', () => {
    const mods = { ...stockMods, gearRatioOverrides: [3.5, 3.0] } // override gear 2 to 3.0 (was 2.0)
    const torqueCurve = testCar.engine.torqueCurve
    const gear2Stock = computeGearThrustCurve(testCar, stockMods, 1, torqueCurve, 0.32)
    const gear2Override = computeGearThrustCurve(testCar, mods, 1, torqueCurve, 0.32)
    // Higher ratio → lower speed, higher thrust at same RPM
    expect(gear2Override.speedRangeMs[1]).toBeLessThan(gear2Stock.speedRangeMs[1])
  })
})

describe('interpolateGearThrust', () => {
  const torqueCurve = testCar.engine.torqueCurve
  const gear1 = computeGearThrustCurve(testCar, stockMods, 0, torqueCurve, 0.32)

  it('returns first point value below minimum speed', () => {
    const result = interpolateGearThrust(gear1, 0)
    expect(result).toBe(gear1.points[0].forceN)
  })

  it('returns last point value above maximum speed', () => {
    const result = interpolateGearThrust(gear1, gear1.speedRangeMs[1] + 10)
    expect(result).toBe(gear1.points[gear1.points.length - 1].forceN)
  })

  it('returns exact point values at breakpoints', () => {
    for (const pt of gear1.points) {
      expect(interpolateGearThrust(gear1, pt.speedMs)).toBeCloseTo(pt.forceN, 5)
    }
  })

  it('returns 0 for empty gear curve', () => {
    const emptyGear = { gear: 1, points: [], speedRangeMs: [0, 0] as [number, number] }
    expect(interpolateGearThrust(emptyGear, 10)).toBe(0)
  })
})

describe('computeAllGearCurves', () => {
  it('returns one curve per gear', () => {
    const curves = computeAllGearCurves(testCar, stockMods)
    expect(curves).toHaveLength(testCar.transmission.gearRatios.length)
  })

  it('gear numbers are 1-indexed', () => {
    const curves = computeAllGearCurves(testCar, stockMods)
    curves.forEach((gc, i) => {
      expect(gc.gear).toBe(i + 1)
    })
  })

  it('higher gears have higher max speed and lower max thrust', () => {
    const curves = computeAllGearCurves(testCar, stockMods)
    // Higher gear = higher max speed
    for (let i = 1; i < curves.length; i++) {
      expect(curves[i].speedRangeMs[1]).toBeGreaterThan(curves[i - 1].speedRangeMs[1])
    }
    // Higher gear = lower peak thrust (at same RPM, smaller ratio → less torque multiplication)
    for (let i = 1; i < curves.length; i++) {
      const peak1 = Math.max(...curves[i - 1].points.map((p) => p.forceN))
      const peak2 = Math.max(...curves[i].points.map((p) => p.forceN))
      expect(peak2).toBeLessThan(peak1)
    }
  })

  it('applies altitude power correction (NA engine at Denver)', () => {
    const seaLevelMods = { ...stockMods, altitudeM: 0 }
    const denverMods = { ...stockMods, altitudeM: 1609 }
    const curvesSeaLevel = computeAllGearCurves(testCar, seaLevelMods)
    const curvesDenver = computeAllGearCurves(testCar, denverMods)
    // All thrust values at Denver should be lower
    const peakSeaLevel = Math.max(...curvesSeaLevel[0].points.map((p) => p.forceN))
    const peakDenver = Math.max(...curvesDenver[0].points.map((p) => p.forceN))
    expect(peakDenver).toBeLessThan(peakSeaLevel)
  })
})

describe('computeEnvelope', () => {
  it('returns non-empty envelope for valid gear curves', () => {
    const curves = computeAllGearCurves(testCar, stockMods)
    const envelope = computeEnvelope(curves)
    expect(envelope.length).toBeGreaterThan(0)
  })

  it('envelope thrust is always ≥ any individual gear thrust at same speed (within range)', () => {
    const curves = computeAllGearCurves(testCar, stockMods)
    const envelope = computeEnvelope(curves)

    for (const ep of envelope) {
      for (const gc of curves) {
        // Only check gears that are considered at this speed (within valid range)
        if (ep.speedMs > gc.speedRangeMs[1] || ep.speedMs < gc.speedRangeMs[0]) continue
        const gearThrust = interpolateGearThrust(gc, ep.speedMs)
        expect(ep.forceN).toBeGreaterThanOrEqual(gearThrust - 0.001)
      }
    }
  })

  it('envelope speeds are monotonically increasing', () => {
    const curves = computeAllGearCurves(testCar, stockMods)
    const envelope = computeEnvelope(curves)
    for (let i = 1; i < envelope.length; i++) {
      expect(envelope[i].speedMs).toBeGreaterThan(envelope[i - 1].speedMs)
    }
  })

  it('gear numbers in envelope are valid (1 to N)', () => {
    const curves = computeAllGearCurves(testCar, stockMods)
    const envelope = computeEnvelope(curves)
    const validGears = curves.map((gc) => gc.gear)
    for (const ep of envelope) {
      expect(validGears).toContain(ep.gear)
    }
  })

  it('returns empty array for empty gear curves', () => {
    expect(computeEnvelope([])).toEqual([])
  })
})

describe('findShiftPoints', () => {
  it('returns N-1 shift points for N gears', () => {
    const curves = computeAllGearCurves(testCar, stockMods)
    const envelope = computeEnvelope(curves)
    const shifts = findShiftPoints(testCar, stockMods, curves, envelope)
    expect(shifts).toHaveLength(testCar.transmission.gearRatios.length - 1)
  })

  it('shift speeds are monotonically increasing', () => {
    const curves = computeAllGearCurves(testCar, stockMods)
    const envelope = computeEnvelope(curves)
    const shifts = findShiftPoints(testCar, stockMods, curves, envelope)
    for (let i = 1; i < shifts.length; i++) {
      expect(shifts[i].speedMs).toBeGreaterThan(shifts[i - 1].speedMs)
    }
  })

  it('fromGear and toGear are sequential', () => {
    const curves = computeAllGearCurves(testCar, stockMods)
    const envelope = computeEnvelope(curves)
    const shifts = findShiftPoints(testCar, stockMods, curves, envelope)
    shifts.forEach((sp, i) => {
      expect(sp.fromGear).toBe(i + 1)
      expect(sp.toGear).toBe(i + 2)
    })
  })

  it('all shift speeds are positive', () => {
    const curves = computeAllGearCurves(testCar, stockMods)
    const envelope = computeEnvelope(curves)
    const shifts = findShiftPoints(testCar, stockMods, curves, envelope)
    for (const sp of shifts) {
      expect(sp.speedMs).toBeGreaterThan(0)
    }
  })

  it('shift RPMs are within idle-redline range', () => {
    const curves = computeAllGearCurves(testCar, stockMods)
    const envelope = computeEnvelope(curves)
    const shifts = findShiftPoints(testCar, stockMods, curves, envelope)
    for (const sp of shifts) {
      expect(sp.rpm).toBeGreaterThanOrEqual(testCar.engine.idleRpm)
      // Allow tiny floating-point tolerance above redline (< 0.1%)
      expect(sp.rpm).toBeLessThanOrEqual(testCar.engine.redlineRpm * 1.001)
    }
  })
})
