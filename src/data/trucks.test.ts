import { describe, it, expect } from 'vitest'
import {
  TRUCKS,
  TRUCK_FAMILIES,
  buildTruckFamilies,
  carrySelectionToGeneration,
  familyOfTruck,
  findPowertrain,
  findTruck,
  findTruckFamily,
  resolveTruckToCarSpec,
} from './trucks'
import { TRAILER_PRESETS, trailerToLoad } from './trailers'
import { runTowingAnalysis } from '@/engine/towing'
import type { TruckModel, TruckPowertrain } from '@/types/truck'

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
        // Gearing sane (90s trucks bottom out at 4-speed automatics)
        expect(p.transmission.gearRatios.length, label).toBeGreaterThanOrEqual(4)
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
      // 60 mph, not 65: the weakest catalog powertrain (1996-98 12-valve
      // Cummins automatic, governed at 2500 rpm) genuinely cannot hold 65 with
      // this trailer — 3rd gear sits just past the governor and 4th is a few
      // hundred newtons short. Period towing reality, not a data error.
      speedMs: 26.8224, // 60 mph
    }
    for (const t of TRUCKS) {
      for (const p of t.powertrains) {
        const spec = resolveTruckToCarSpec(t, p, p.defaultAxleRatio)
        const analysis = runTowingAnalysis(spec, scenario, p.fuel)
        const label = `${t.id}/${p.id}`
        // Every truck should hold 60 mph with a mid travel trailer on flat ground
        expect(analysis.cruisingGear, label).not.toBeNull()
        expect(analysis.maxSustainable, label).not.toBeNull()
        expect(analysis.maxSustainable!.speedMs, label).toBeGreaterThan(scenario.speedMs)
        expect(analysis.passing.from40to60S, label).not.toBeNull()
        expect(analysis.absoluteMaxGrade!.gradePercent, label).toBeGreaterThan(1)
      }
    }
  })
})

describe('truck families', () => {
  it('groups every generation under a make + model family', () => {
    const total = TRUCK_FAMILIES.reduce((n, f) => n + f.generations.length, 0)
    expect(total).toBe(TRUCKS.length)
    expect(new Set(TRUCK_FAMILIES.map((f) => f.key)).size).toBe(TRUCK_FAMILIES.length)
    for (const f of TRUCK_FAMILIES) {
      expect(f.generations.length).toBeGreaterThan(0)
      for (const g of f.generations) {
        expect(g.make, f.key).toBe(f.make)
        expect(g.model, f.key).toBe(f.model)
        expect(g.classTier, f.key).toBe(f.classTier)
      }
    }
  })

  it("sorts a family's generations newest first", () => {
    const gen = (id: string, yearStart: number, yearEnd: number | null) =>
      ({
        id,
        make: 'Ford',
        model: 'F-150',
        classTier: 'half',
        generation: id,
        yearStart,
        yearEnd,
        powertrains: [],
      }) as unknown as TruckModel
    const families = buildTruckFamilies([gen('old', 2015, 2020), gen('new', 2021, null)])
    expect(families).toHaveLength(1)
    expect(families[0].generations.map((g) => g.id)).toEqual(['new', 'old'])
  })

  it('findTruckFamily and familyOfTruck resolve the F-150 family', () => {
    const family = findTruckFamily('ford-f-150')
    expect(family).toBeDefined()
    expect(family!.generations.some((g) => g.id === 'ford-f150-2021')).toBe(true)
    expect(familyOfTruck('ford-f150-2021')?.key).toBe('ford-f-150')
  })
})

describe('carrySelectionToGeneration', () => {
  const pt = (over: Partial<TruckPowertrain>) =>
    ({
      id: 'base',
      engineName: 'Base V8',
      fuel: 'gas',
      displacementL: 5.0,
      axleRatios: [3.31, 3.73],
      defaultAxleRatio: 3.31,
      ...over,
    }) as TruckPowertrain
  const truckWith = (...powertrains: TruckPowertrain[]) =>
    ({ powertrains }) as unknown as TruckModel

  it('keeps the same engine by name and the same axle ratio when offered', () => {
    const prev = pt({ id: 'a', engineName: '3.5L EcoBoost V6', displacementL: 3.5 })
    const target = truckWith(
      pt({ id: 'other' }),
      pt({ id: 'b', engineName: '3.5L EcoBoost V6', displacementL: 3.5 }),
    )
    expect(carrySelectionToGeneration(target, prev, 3.73)).toEqual({
      powertrainId: 'b',
      axleRatio: 3.73,
    })
  })

  it('matches by fuel + displacement when the engine was renamed', () => {
    const prev = pt({ id: 'a', engineName: '5.0L Ti-VCT V8' })
    const target = truckWith(
      pt({ id: 'diesel', fuel: 'diesel', displacementL: 3.0, engineName: '3.0L Diesel' }),
      pt({ id: 'v8', engineName: '5.0L Coyote V8' }),
    )
    expect(carrySelectionToGeneration(target, prev, 3.31).powertrainId).toBe('v8')
  })

  it('falls back to the first powertrain and its default axle when nothing matches', () => {
    const prev = pt({ id: 'a', engineName: '6.2L V8', displacementL: 6.2 })
    const target = truckWith(pt({ id: 'first', axleRatios: [3.55], defaultAxleRatio: 3.55 }))
    expect(carrySelectionToGeneration(target, prev, 4.3)).toEqual({
      powertrainId: 'first',
      axleRatio: 3.55,
    })
  })

  it('uses the first powertrain when there is no previous powertrain', () => {
    const target = truckWith(pt({ id: 'first' }))
    expect(carrySelectionToGeneration(target, undefined, 3.73)).toEqual({
      powertrainId: 'first',
      axleRatio: 3.73,
    })
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
