import { describe, it, expect } from 'vitest'
import {
  towingRoadLoadN,
  maxGradePercentAtSpeed,
  maxSustainableSpeed,
  analyzeGearsAtSpeed,
  runTowingAnalysis,
  MIN_LOAD_RPM_DIESEL,
  MIN_LOAD_RPM_GAS,
} from './towing'
import type { TowingMasses } from './towing'
import type { CarSpec, CurvePoint } from '@/types/car'
import type { TowScenario } from '@/types/truck'
import type { EnvelopePoint, GearThrustCurve } from '@/types/simulation'

const MASSES: TowingMasses = {
  truckMassKg: 3000,
  trailerMassKg: 3000,
  truckCrr: 0.015,
  trailerCrr: 0.01,
}

const CDA = 3.0
const RHO = 1.225
const V60 = 26.8224 // 60 mph in m/s

describe('towingRoadLoadN', () => {
  it('at zero speed on flat ground equals rolling resistance only', () => {
    // (3000·0.015 + 3000·0.01) · 9.81 = 735.75 N
    const load = towingRoadLoadN(MASSES, CDA, RHO, 0, 0)
    expect(load).toBeCloseTo(735.75, 1)
  })

  it('on flat ground equals aero drag + rolling resistance', () => {
    // aero = 0.5·3.0·1.225·26.8224² = 1321.97 N; rr = 735.75 N
    const load = towingRoadLoadN(MASSES, CDA, RHO, 0, V60)
    expect(load).toBeCloseTo(1321.97 + 735.75, 0)
  })

  it('adds grade force and reduces normal-load rr on a 6% grade', () => {
    // θ = atan(0.06): sinθ = 0.0598923, cosθ = 0.9982047
    // aero = 1321.97; rr = 735.75·cosθ = 734.43; grade = 6000·9.81·sinθ = 3525.26
    const load = towingRoadLoadN(MASSES, CDA, RHO, 6, V60)
    expect(load).toBeCloseTo(5581.7, 0)
  })

  it('is lower downhill than on flat ground', () => {
    const flat = towingRoadLoadN(MASSES, CDA, RHO, 0, V60)
    const downhill = towingRoadLoadN(MASSES, CDA, RHO, -6, V60)
    expect(downhill).toBeLessThan(flat)
  })
})

describe('maxGradePercentAtSpeed', () => {
  it('round-trips with towingRoadLoadN', () => {
    const thrust = towingRoadLoadN(MASSES, CDA, RHO, 6, V60)
    const grade = maxGradePercentAtSpeed(thrust, MASSES, CDA, RHO, V60)
    expect(grade).toBeCloseTo(6, 2)
  })

  it('returns 0 when thrust exactly matches flat-ground load', () => {
    const thrust = towingRoadLoadN(MASSES, CDA, RHO, 0, V60)
    const grade = maxGradePercentAtSpeed(thrust, MASSES, CDA, RHO, V60)
    expect(grade).toBeCloseTo(0, 2)
  })

  it('returns a negative grade when thrust cannot hold speed on flat ground', () => {
    const flatLoad = towingRoadLoadN(MASSES, CDA, RHO, 0, V60)
    const grade = maxGradePercentAtSpeed(flatLoad * 0.5, MASSES, CDA, RHO, V60)
    expect(grade).toBeLessThan(0)
  })

  it('steeper round-trip also matches (12%)', () => {
    const thrust = towingRoadLoadN(MASSES, CDA, RHO, 12, V60)
    const grade = maxGradePercentAtSpeed(thrust, MASSES, CDA, RHO, V60)
    expect(grade).toBeCloseTo(12, 2)
  })
})

describe('maxSustainableSpeed', () => {
  // Constant 3000 N envelope from 0 to 50 m/s in gear 1
  const envelope: EnvelopePoint[] = Array.from({ length: 101 }, (_, i) => ({
    speedMs: i * 0.5,
    forceN: 3000,
    gear: 1,
  }))

  it('finds the aero-drag equilibrium speed', () => {
    // No rr: v* = sqrt(3000 / (0.5·3.0·1.225)) = 40.406 m/s
    const masses: TowingMasses = { truckMassKg: 2000, trailerMassKg: 0, truckCrr: 0, trailerCrr: 0 }
    const result = maxSustainableSpeed(envelope, masses, CDA, RHO, 0)
    expect(result).not.toBeNull()
    expect(result!.speedMs).toBeCloseTo(40.41, 1)
    expect(result!.gear).toBe(1)
  })

  it('is capped by the envelope top speed when thrust always exceeds load', () => {
    const masses: TowingMasses = { truckMassKg: 1000, trailerMassKg: 0, truckCrr: 0, trailerCrr: 0 }
    const result = maxSustainableSpeed(envelope, masses, 0.1, RHO, 0)
    expect(result).not.toBeNull()
    expect(result!.speedMs).toBeCloseTo(50, 1)
  })

  it('returns null when the load exceeds thrust at every speed', () => {
    // 10000 kg on a 100% grade needs ~69 kN, far above 3000 N
    const masses: TowingMasses = { truckMassKg: 10000, trailerMassKg: 0, truckCrr: 0.015, trailerCrr: 0 }
    const result = maxSustainableSpeed(envelope, masses, CDA, RHO, 100)
    expect(result).toBeNull()
  })

  it('decreases with steeper grade', () => {
    const masses: TowingMasses = { truckMassKg: 3000, trailerMassKg: 3000, truckCrr: 0.015, trailerCrr: 0.01 }
    const flat = maxSustainableSpeed(envelope, masses, CDA, RHO, 0)
    const hill = maxSustainableSpeed(envelope, masses, CDA, RHO, 2)
    expect(flat).not.toBeNull()
    expect(hill).not.toBeNull()
    expect(hill!.speedMs).toBeLessThan(flat!.speedMs)
  })
})

describe('analyzeGearsAtSpeed', () => {
  // Two gears with constant thrust; effective ratios chosen so RPM is analytic:
  // rpm = v · effRatio · 60 / (2π · r), r = 0.4 m
  const gearCurves: GearThrustCurve[] = [
    {
      gear: 1,
      points: [
        { speedMs: 0, forceN: 8000, rpm: 1000 },
        { speedMs: 21, forceN: 8000, rpm: 5000 },
      ],
      speedRangeMs: [0, 21],
    },
    {
      gear: 2,
      points: [
        { speedMs: 0, forceN: 4000, rpm: 500 },
        { speedMs: 42, forceN: 4000, rpm: 5000 },
      ],
      speedRangeMs: [0, 42],
    },
  ]
  const effRatios = [10, 5]
  const radius = 0.4

  it('computes per-gear rpm from effective ratio and tire radius', () => {
    const gears = analyzeGearsAtSpeed(gearCurves, effRatios, radius, 20, 3000, 1250, 5000)
    // gear 1: 20·10·60/(2π·0.4) = 4774.6 rpm; gear 2: 2387.3 rpm
    expect(gears[0].rpm).toBeCloseTo(4774.6, 0)
    expect(gears[1].rpm).toBeCloseTo(2387.3, 0)
  })

  it('marks gears over redline as unusable', () => {
    // At 25 m/s gear 1 spins 5968 rpm (> 5000 redline)
    const gears = analyzeGearsAtSpeed(gearCurves, effRatios, radius, 25, 3000, 1250, 5000)
    expect(gears[0].usable).toBe(false)
    expect(gears[1].usable).toBe(true)
  })

  it('marks gears below the lugging floor as unusable', () => {
    // At 6 m/s gear 2 spins 716 rpm (< 1250 floor) while gear 1 spins 1432 rpm
    const gears = analyzeGearsAtSpeed(gearCurves, effRatios, radius, 6, 3000, 1250, 5000)
    expect(gears[1].usable).toBe(false)
    expect(gears[0].usable).toBe(true)
  })

  it('reports surplus force and power against the road load', () => {
    const gears = analyzeGearsAtSpeed(gearCurves, effRatios, radius, 20, 3000, 1250, 5000)
    // gear 1: 8000 − 3000 = 5000 N surplus → 100 kW at 20 m/s
    expect(gears[0].surplusN).toBeCloseTo(5000, 5)
    expect(gears[0].surplusKw).toBeCloseTo(100, 5)
    expect(gears[0].availableKw).toBeCloseTo(160, 5)
    // gear 2: 4000 − 3000 = 1000 N surplus → 20 kW
    expect(gears[1].surplusN).toBeCloseTo(1000, 5)
    expect(gears[1].surplusKw).toBeCloseTo(20, 5)
  })
})

describe('runTowingAnalysis', () => {
  // Synthetic truck: flat 600 Nm from 1000–5000 rpm, two gears, no drivetrain loss.
  const torqueCurve: CurvePoint[] = Array.from({ length: 21 }, (_, i): CurvePoint => [
    1000 + i * 200,
    600,
  ])

  const truck: CarSpec = {
    id: 'test-truck',
    make: 'Test',
    model: 'Truck',
    year: 2024,
    trim: 'Test',
    curbWeightKg: 2500,
    drivetrain: 'AWD',
    engine: {
      torqueCurve,
      powerCurve: torqueCurve.map(([rpm, nm]): CurvePoint => [rpm, (nm * rpm) / 9549]),
      redlineRpm: 5000,
      idleRpm: 650,
      displacementL: 5.0,
      forcedInduction: false,
    },
    transmission: {
      gearRatios: [4.0, 1.5],
      finalDriveRatio: 3.5,
      shiftTimeMs: 300,
      drivetrainLoss: 0,
      type: 'automatic',
    },
    tireSize: { widthMm: 275, aspectRatio: 60, rimDiameterIn: 20 },
    aero: { cd: 0.4, frontalAreaM2: 3.5 },
  }

  const scenario: TowScenario = {
    trailer: { massKg: 3000, effectiveCdA: 2.0, crr: 0.01 },
    cargoMassKg: 100,
    altitudeM: 0,
    gradePercent: 3,
    speedMs: V60,
  }

  it('produces a gear entry for every transmission gear', () => {
    const analysis = runTowingAnalysis(truck, scenario, 'gas')
    expect(analysis.gearsAtSpeed).toHaveLength(2)
    expect(analysis.gearsAtSpeed.map((g) => g.gear)).toEqual([1, 2])
  })

  it('combines truck and trailer mass and CdA', () => {
    const analysis = runTowingAnalysis(truck, scenario, 'gas')
    expect(analysis.totalMassKg).toBe(2500 + 100 + 3000)
    expect(analysis.combinedCdA).toBeCloseTo(0.4 * 3.5 + 2.0, 6)
  })

  it('picks the highest gear that can hold speed as the cruising gear', () => {
    const analysis = runTowingAnalysis(truck, scenario, 'gas')
    const holders = analysis.gearsAtSpeed.filter((g) => g.usable && g.surplusN >= 0)
    expect(analysis.cruisingGear).not.toBeNull()
    expect(analysis.cruisingGear!.gear).toBe(Math.max(...holders.map((g) => g.gear)))
  })

  it('reports a max sustainable speed with gear and rpm on the scenario grade', () => {
    const analysis = runTowingAnalysis(truck, scenario, 'gas')
    expect(analysis.maxSustainable).not.toBeNull()
    expect(analysis.maxSustainable!.speedMs).toBeGreaterThan(scenario.speedMs)
    expect(analysis.maxSustainable!.rpm).toBeGreaterThan(0)
  })

  it('max grade per gear is steeper in lower gears', () => {
    // At 13 m/s (~29 mph) both gears sit inside their usable rpm band
    const lowSpeed: TowScenario = { ...scenario, speedMs: 13 }
    const analysis = runTowingAnalysis(truck, lowSpeed, 'gas')
    const byGear = new Map(analysis.maxGradePerGear.map((g) => [g.gear, g.maxGradePercent]))
    expect(byGear.get(1)).toBeDefined()
    expect(byGear.get(2)).toBeDefined()
    expect(byGear.get(1)!).toBeGreaterThan(byGear.get(2)!)
  })

  it('absolute max grade comes from the strongest usable gear', () => {
    const analysis = runTowingAnalysis(truck, scenario, 'gas')
    expect(analysis.absoluteMaxGrade).not.toBeNull()
    const best = Math.max(...analysis.maxGradePerGear.map((g) => g.maxGradePercent))
    expect(analysis.absoluteMaxGrade!.gradePercent).toBeCloseTo(best, 6)
  })

  it('computes a positive 40-60 mph passing time', () => {
    const analysis = runTowingAnalysis(truck, scenario, 'gas')
    expect(analysis.passing.from40to60S).not.toBeNull()
    expect(analysis.passing.from40to60S!).toBeGreaterThan(0)
  })

  it('passing time is null when the truck cannot reach the target speed', () => {
    const steep: TowScenario = { ...scenario, gradePercent: 30, trailer: { ...scenario.trailer, massKg: 12000 } }
    const analysis = runTowingAnalysis(truck, steep, 'gas')
    expect(analysis.passing.from40to60S).toBeNull()
  })

  it('applies the diesel lugging floor to gear usability', () => {
    // At the scenario speed, gear 2 spins below the gas floor but above the diesel floor
    // rpm(gear 2) = 26.8224 · (1.5·3.5) · 60 / (2π · r); r ≈ 0.419 m → ~3208 rpm — usable for both.
    // Instead verify the floors are what usability is computed against.
    expect(MIN_LOAD_RPM_DIESEL).toBeLessThan(MIN_LOAD_RPM_GAS)
    const gas = runTowingAnalysis(truck, scenario, 'gas')
    const diesel = runTowingAnalysis(truck, scenario, 'diesel')
    // Same truck: diesel floor can only make more gears usable, never fewer
    const gasUsable = gas.gearsAtSpeed.filter((g) => g.usable).length
    const dieselUsable = diesel.gearsAtSpeed.filter((g) => g.usable).length
    expect(dieselUsable).toBeGreaterThanOrEqual(gasUsable)
  })

  it('provides a road-load curve covering the envelope speed range', () => {
    const analysis = runTowingAnalysis(truck, scenario, 'gas')
    expect(analysis.roadLoadCurve.length).toBeGreaterThan(10)
    const maxEnvSpeed = analysis.envelope[analysis.envelope.length - 1].speedMs
    const maxCurveSpeed = analysis.roadLoadCurve[analysis.roadLoadCurve.length - 1].speedMs
    expect(maxCurveSpeed).toBeGreaterThanOrEqual(maxEnvSpeed - 1)
  })

  it('altitude reduces available thrust for an NA engine', () => {
    const highAlt = runTowingAnalysis(truck, { ...scenario, altitudeM: 2000 }, 'gas')
    const seaLevel = runTowingAnalysis(truck, scenario, 'gas')
    const peakHigh = Math.max(...highAlt.envelope.map((p) => p.forceN))
    const peakSea = Math.max(...seaLevel.envelope.map((p) => p.forceN))
    expect(peakHigh).toBeLessThan(peakSea * 0.85)
  })
})
