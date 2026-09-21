/**
 * Synthetic autocross run builder shared by engine tests and the sample-log generator.
 * Produces a logger-style CSV at a fixed sample rate from a piecewise course
 * description, driving the car with the real thrust engine so the baseline
 * model fits the "log" closely.
 */
import type { CarSpec } from '@/types/car'
import type { CarModifications } from '@/types/config'
import { DEFAULT_MODIFICATIONS } from '@/types/config'
import { GRAVITY_MS2 } from '@/data/presets'
import { dragForceN } from '@/engine/aerodynamics'
import { rollingResistanceN } from '@/engine/tires'
import { buildPowertrainModel, thrustAtSpeed } from '@/engine/telemetry/whatif'
import type { PowertrainModel } from '@/engine/telemetry/whatif'
import carsData from '@/data/cars.json'

const G = 9.80665

export type CourseElement =
  | { kind: 'straight'; lengthM: number; throttle?: number }
  | { kind: 'brake'; toSpeedMs: number; decelG: number }
  | { kind: 'corner'; lengthM: number; speedMs: number; latG: number }
  | { kind: 'slalom'; lengthM: number; latG: number; gateM: number; throttle?: number }

export interface SynthOptions {
  rateHz?: number
  /** Multiply the model's thrust so the "car" is a bit weaker/stronger than spec */
  thrustScale?: number
  /** Max longitudinal g the tires allow (launch) */
  maxAccelG?: number
  maxLatG?: number
  startSpeedMs?: number
  withThrottle?: boolean
  withRpm?: boolean
  withLatAccel?: boolean
  withGps?: boolean
}

export interface SynthRow {
  timeS: number
  speedMs: number
  distanceM: number
  longG: number
  latG: number
  throttle: number
  rpm: number
  lat: number
  lon: number
}

export function getTestCar(id = 'mazda-mx5-miata-2021'): CarSpec {
  const car = (carsData as CarSpec[]).find(c => c.id === id)
  if (!car) throw new Error(`test car ${id} not in cars.json`)
  return car
}

/** RPM in the gear the thrust envelope picks at this speed (optimal shifting). */
function rpmFor(model: PowertrainModel, speedMs: number): number {
  let gear = 1
  for (const p of model.envelope) {
    if (p.speedMs <= speedMs) gear = p.gear
    else break
  }
  const ratio = model.gearEffectiveRatios[gear - 1] ?? model.gearEffectiveRatios[0]
  return (speedMs * ratio * 60) / (2 * Math.PI * model.tireRadiusM)
}

/**
 * Step the car through the course at a fine internal dt, then sample at rateHz.
 * Heading is integrated from lateral g so GPS coordinates are self-consistent.
 */
export function synthesizeRun(
  car: CarSpec,
  course: CourseElement[],
  opts: SynthOptions = {},
  mods: CarModifications = DEFAULT_MODIFICATIONS,
): SynthRow[] {
  const {
    rateHz = 10,
    thrustScale = 1,
    maxAccelG = 0.6,
    maxLatG = 1.1,
    startSpeedMs = 0,
  } = opts
  const model = buildPowertrainModel(car, mods)
  const rrN = rollingResistanceN(model.massKg, DEFAULT_CRR_LOCAL, GRAVITY_MS2)
  const dt = 0.005
  const sampleDt = 1 / rateHz

  let t = 0
  let v = startSpeedMs
  let d = 0
  let heading = 0
  let lat = 39.0
  let lon = -104.0
  let nextSample = 0
  const rows: SynthRow[] = []
  const push = (longG: number, latG: number, throttle: number) => {
    rows.push({
      timeS: t,
      speedMs: v,
      distanceM: d,
      longG,
      latG,
      throttle,
      rpm: rpmFor(model, Math.max(v, 1)),
      lat,
      lon,
    })
  }

  const advance = (a: number, latG: number, throttle: number) => {
    if (t >= nextSample - 1e-9) {
      push(a / G, latG, throttle)
      nextSample += sampleDt
    }
    v = Math.max(0, v + a * dt)
    d += v * dt
    // yaw rate = a_lat / v
    if (v > 0.5) heading += ((latG * G) / v) * dt
    lat += ((v * Math.cos(heading)) / 111320) * dt
    lon += ((v * Math.sin(heading)) / (111320 * Math.cos((lat * Math.PI) / 180))) * dt
    t += dt
  }

  const powerAccel = (throttle: number) => {
    const thrust = thrustScale * throttle * thrustAtSpeed(model, v)
    const drag = dragForceN(model.cd, model.frontalAreaM2, model.airDensityKgM3, v)
    return (thrust - drag - rrN) / model.massKg
  }

  for (const el of course) {
    if (el.kind === 'straight') {
      const end = d + el.lengthM
      const throttle = el.throttle ?? 1
      while (d < end) {
        const a = Math.min(powerAccel(throttle), maxAccelG * G)
        advance(a, 0, throttle)
      }
    } else if (el.kind === 'brake') {
      while (v > el.toSpeedMs) {
        advance(-el.decelG * G, 0, 0)
      }
    } else if (el.kind === 'corner') {
      const end = d + el.lengthM
      while (d < end) {
        // Hold target speed: tiny corrective accel toward it
        const a = Math.max(-0.2 * G, Math.min(0.2 * G, (el.speedMs - v) / 0.5))
        advance(a, el.latG, 0.3)
      }
    } else {
      // slalom: alternate lateral g each gate, accelerate under throttle limited by the friction circle
      const end = d + el.lengthM
      const throttle = el.throttle ?? 1
      const start = d
      while (d < end) {
        const phase = ((d - start) / el.gateM) * Math.PI
        const latG = el.latG * Math.sin(phase)
        const latUse = Math.min(1, Math.abs(latG) / maxLatG)
        const aGrip = maxAccelG * G * Math.sqrt(1 - latUse * latUse)
        const a = Math.min(powerAccel(throttle), aGrip)
        advance(a, latG, throttle)
      }
    }
  }
  push(0, 0, 0)
  return rows
}

const DEFAULT_CRR_LOCAL = 0.015

/** Render rows as a RaceCapture-style CSV. */
export function rowsToCsv(rows: SynthRow[], opts: SynthOptions = {}): string {
  const { withThrottle = true, withRpm = true, withLatAccel = true, withGps = false } = opts
  const headers = ['Time (s)', 'Speed (mph)', 'Distance (m)', 'LongAccel (g)']
  if (withLatAccel) headers.push('LatAccel (g)')
  if (withThrottle) headers.push('Throttle (%)')
  if (withRpm) headers.push('RPM')
  if (withGps) headers.push('Latitude', 'Longitude')
  const lines = [headers.join(',')]
  for (const r of rows) {
    const cells = [r.timeS.toFixed(3), (r.speedMs * 2.23694).toFixed(2), r.distanceM.toFixed(2), r.longG.toFixed(3)]
    if (withLatAccel) cells.push(r.latG.toFixed(3))
    if (withThrottle) cells.push((r.throttle * 100).toFixed(0))
    if (withRpm) cells.push(r.rpm.toFixed(0))
    if (withGps) cells.push(r.lat.toFixed(7), r.lon.toFixed(7))
    lines.push(cells.join(','))
  }
  return lines.join('\n') + '\n'
}

/** A representative autocross: launch, straight, slalom, braking, sweeper, straight, finish. */
export const SAMPLE_COURSE: CourseElement[] = [
  { kind: 'straight', lengthM: 70 },
  { kind: 'brake', toSpeedMs: 16, decelG: 0.9 },
  { kind: 'slalom', lengthM: 75, latG: 0.95, gateM: 15 },
  { kind: 'straight', lengthM: 60 },
  { kind: 'brake', toSpeedMs: 13, decelG: 0.95 },
  { kind: 'corner', lengthM: 45, speedMs: 13, latG: 1.0 },
  { kind: 'straight', lengthM: 110 },
  { kind: 'brake', toSpeedMs: 18, decelG: 0.9 },
  { kind: 'corner', lengthM: 30, speedMs: 18, latG: 1.0 },
  { kind: 'straight', lengthM: 50 },
]
