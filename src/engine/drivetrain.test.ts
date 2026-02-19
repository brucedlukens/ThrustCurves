import { describe, it, expect } from 'vitest'
import { wheelTorqueNm, rpmToSpeedMs, speedMsToRpm } from './drivetrain'

const SUPRA_1ST_RATIO = 5.0
const SUPRA_FINAL_DRIVE = 3.46
const SUPRA_LOSS = 0.12
// 275/35R19 tire: radius = 19*0.0254/2 + 275*35/100/1000 = 0.2413 + 0.09625 = 0.33755 m
const SUPRA_TIRE_RADIUS = 0.33755

describe('wheelTorqueNm', () => {
  it('computes wheel torque in 1st gear (Supra)', () => {
    // 499 Nm engine * 5.0 * 3.46 * (1 - 0.12)
    // = 499 * 17.3 * 0.88 = 7596.8 Nm
    const result = wheelTorqueNm(499, SUPRA_1ST_RATIO, SUPRA_FINAL_DRIVE, SUPRA_LOSS)
    expect(result).toBeCloseTo(7596.8, 0)
  })

  it('returns 0 when torque is 0', () => {
    expect(wheelTorqueNm(0, 5.0, 3.46, 0.12)).toBe(0)
  })

  it('scales linearly with engine torque', () => {
    const t1 = wheelTorqueNm(200, 3.0, 4.0, 0.10)
    const t2 = wheelTorqueNm(400, 3.0, 4.0, 0.10)
    expect(t2).toBeCloseTo(t1 * 2, 5)
  })

  it('applies drivetrain loss correctly', () => {
    // No loss
    const tNoLoss = wheelTorqueNm(100, 1.0, 1.0, 0)
    expect(tNoLoss).toBeCloseTo(100, 5)
    // 20% loss
    const t20Loss = wheelTorqueNm(100, 1.0, 1.0, 0.20)
    expect(t20Loss).toBeCloseTo(80, 5)
  })
})

describe('rpmToSpeedMs', () => {
  it('computes speed at idle RPM in 1st gear (Supra)', () => {
    // speed = 700 / (5.0 * 3.46) * (2π/60) * 0.33755 ≈ 1.430 m/s
    const speed = rpmToSpeedMs(700, SUPRA_1ST_RATIO, SUPRA_FINAL_DRIVE, SUPRA_TIRE_RADIUS)
    expect(speed).toBeCloseTo(1.430, 2)
  })

  it('computes speed at redline in 1st gear (Supra)', () => {
    // speed = 6500 / (5.0 * 3.46) * (2π/60) * 0.33755 ≈ 13.28 m/s ≈ 47.8 km/h
    const speed = rpmToSpeedMs(6500, SUPRA_1ST_RATIO, SUPRA_FINAL_DRIVE, SUPRA_TIRE_RADIUS)
    expect(speed).toBeCloseTo(13.28, 1)
  })

  it('returns 0 at 0 RPM', () => {
    expect(rpmToSpeedMs(0, 5.0, 3.46, 0.33755)).toBe(0)
  })

  it('scales linearly with RPM', () => {
    const s1 = rpmToSpeedMs(2000, 3.0, 4.0, 0.3)
    const s2 = rpmToSpeedMs(4000, 3.0, 4.0, 0.3)
    expect(s2).toBeCloseTo(s1 * 2, 5)
  })
})

describe('speedMsToRpm', () => {
  it('is the inverse of rpmToSpeedMs', () => {
    const originalRpm = 4500
    const speed = rpmToSpeedMs(originalRpm, SUPRA_1ST_RATIO, SUPRA_FINAL_DRIVE, SUPRA_TIRE_RADIUS)
    const rpm = speedMsToRpm(speed, SUPRA_1ST_RATIO, SUPRA_FINAL_DRIVE, SUPRA_TIRE_RADIUS)
    expect(rpm).toBeCloseTo(originalRpm, 3)
  })

  it('returns 0 at 0 speed', () => {
    expect(speedMsToRpm(0, 5.0, 3.46, 0.33755)).toBe(0)
  })

  it('scales linearly with speed', () => {
    const r1 = speedMsToRpm(10, 3.0, 4.0, 0.3)
    const r2 = speedMsToRpm(20, 3.0, 4.0, 0.3)
    expect(r2).toBeCloseTo(r1 * 2, 5)
  })
})
