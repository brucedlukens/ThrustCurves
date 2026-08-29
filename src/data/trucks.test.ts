import { describe, it, expect } from 'vitest'
import { TRUCKS, findTruck, findPowertrain, resolveTruckToCarSpec } from './trucks'
import { TRAILER_PRESETS, trailerToLoad } from './trailers'
import { runTowingAnalysis } from '@/engine/towing'

describe('trucks.json schema', () => {
  it('contains the expected truck models', () => {
    expect(TRUCKS.length).toBeGreaterThanOrEqual(9)
    const tiers = new Set(TRUCKS.map((t) => t.classTier))
    expect(tiers).toEqual(new Set(['half', 'threequarter', 'one']))
  })

  it('every powertrain has a valid torque curve and gearing', () => {
    for (const truck of TRUCKS) {
      expect(truck.powertrains.length).toBeGreaterThan(0)
      for (const p of truck.powertrains) {
        const label = `${truck.id}/${p.id}`
        // Ascending rpm, positive torque
        for (let i = 1; i < p.torqueCurve.length; i++) {
          expect(p.torqueCurve[i][0], label).toBeGreaterThan(p.torqueCurve[i - 1][0])
        }
        expect(Math.min(...p.torqueCurve.map(([, nm]) => nm)), label).toBeGreaterThan(0)
        // Gearing sane
        expect(p.transmission.gearRatios.length, label).toBeGreaterThanOrEqual(6)
        expect(p.axleRatios, label).toContain(p.defaultAxleRatio)
        // Redline at or above the last curve point
        expect(p.redlineRpm, label).toBeGreaterThanOrEqual(
          p.torqueCurve[p.torqueCurve.length - 1][0],
        )
        expect(p.curbWeightKg, label).toBeGreaterThan(2000)
        expect(p.curbWeightKg, label).toBeLessThan(4000)
      }
    }
  })

  it('diesel powertrains are marked forced induction', () => {
    for (const truck of TRUCKS) {
      for (const p of truck.powertrains) {
        if (p.fuel === 'diesel') {
          expect(p.forcedInduction, `${truck.id}/${p.id}`).toBe(true)
        }
      }
    }
  })
})

describe('resolveTruckToCarSpec', () => {
  const truck = findTruck('gm-2500hd-2020')!
  const diesel = findPowertrain(truck, '66-duramax')!

  it('maps the selection into a CarSpec with the axle ratio as final drive', () => {
    const spec = resolveTruckToCarSpec(truck, diesel, 3.42)
    expect(spec.transmission.finalDriveRatio).toBe(3.42)
    expect(spec.transmission.gearRatios).toEqual(diesel.transmission.gearRatios)
    expect(spec.curbWeightKg).toBe(diesel.curbWeightKg)
    expect(spec.engine.torqueCurve).toEqual(diesel.torqueCurve)
  })

  it('derives the power curve from the torque curve', () => {
    const spec = resolveTruckToCarSpec(truck, diesel, 3.42)
    for (let i = 0; i < spec.engine.powerCurve.length; i++) {
      const [rpm, kw] = spec.engine.powerCurve[i]
      const [tRpm, nm] = spec.engine.torqueCurve[i]
      expect(rpm).toBe(tRpm)
      expect(kw).toBeCloseTo((nm * rpm) / 9549, 6)
    }
  })

  it('applies a curb weight override', () => {
    const spec = resolveTruckToCarSpec(truck, diesel, 3.42, 3700)
    expect(spec.curbWeightKg).toBe(3700)
  })

  it('every truck/powertrain/axle combination produces a runnable analysis', () => {
    const preset = TRAILER_PRESETS.find((p) => p.id === 'travel-trailer-mid')!
    const scenario = {
      trailer: trailerToLoad(preset, preset.defaultMassKg),
      cargoMassKg: 100,
      altitudeM: 0,
      gradePercent: 0,
      speedMs: 29.0576, // 65 mph
    }
    for (const t of TRUCKS) {
      for (const p of t.powertrains) {
        const spec = resolveTruckToCarSpec(t, p, p.defaultAxleRatio)
        const analysis = runTowingAnalysis(spec, scenario, p.fuel)
        const label = `${t.id}/${p.id}`
        // Every truck should hold 65 mph with a mid travel trailer on flat ground
        expect(analysis.cruisingGear, label).not.toBeNull()
        expect(analysis.maxSustainable, label).not.toBeNull()
        expect(analysis.maxSustainable!.speedMs, label).toBeGreaterThan(scenario.speedMs)
        expect(analysis.passing.from40to60S, label).not.toBeNull()
        expect(analysis.absoluteMaxGrade!.gradePercent, label).toBeGreaterThan(1)
      }
    }
  })
})

describe('trailer presets', () => {
  it('cover the major categories with plausible physics values', () => {
    const categories = new Set(TRAILER_PRESETS.map((p) => p.category))
    for (const cat of ['flatbed', 'enclosed', 'travel', 'fifthwheel', 'boat', 'gooseneck']) {
      expect(categories).toContain(cat)
    }
    for (const p of TRAILER_PRESETS) {
      expect(p.cd).toBeGreaterThan(0.2)
      expect(p.cd).toBeLessThan(1)
      expect(p.exposureFactor).toBeGreaterThan(0)
      expect(p.exposureFactor).toBeLessThanOrEqual(1)
      expect(p.defaultMassKg).toBeGreaterThanOrEqual(p.massRangeKg[0])
      expect(p.defaultMassKg).toBeLessThanOrEqual(p.massRangeKg[1])
    }
  })

  it('trailerToLoad computes effective CdA with the exposure factor', () => {
    const p = TRAILER_PRESETS.find((t) => t.id === 'travel-trailer-mid')!
    const load = trailerToLoad(p, 3000)
    expect(load.massKg).toBe(3000)
    expect(load.effectiveCdA).toBeCloseTo(p.cd * p.frontalAreaM2 * p.exposureFactor, 6)
    expect(load.crr).toBe(p.crr)
  })
})
