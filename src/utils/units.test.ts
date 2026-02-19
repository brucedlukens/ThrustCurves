import { describe, test, expect } from 'vitest'
import {
  msToMph,
  mphToMs,
  msToKmh,
  nmToLbft,
  kwToHp,
  nToLbf,
  mToFt,
  MS_TO_MPH,
  MS_TO_KMH,
  NM_TO_LBFT,
  KW_TO_HP,
  N_TO_LBF,
  M_TO_FT,
} from './units'

describe('units', () => {
  test('msToMph: 0 m/s → 0 mph', () => {
    expect(msToMph(0)).toBe(0)
  })

  test('msToMph: 26.82 m/s ≈ 60 mph', () => {
    expect(msToMph(26.8224)).toBeCloseTo(60, 1)
  })

  test('mphToMs: 60 mph → ~26.82 m/s', () => {
    expect(mphToMs(60)).toBeCloseTo(26.8224, 2)
  })

  test('mphToMs(msToMph(v)) round-trips correctly', () => {
    expect(mphToMs(msToMph(30))).toBeCloseTo(30, 6)
  })

  test('msToKmh: 27.778 m/s ≈ 100 km/h', () => {
    expect(msToKmh(27.778)).toBeCloseTo(100, 1)
  })

  test('nmToLbft: 1 Nm ≈ 0.7376 lb·ft', () => {
    expect(nmToLbft(1)).toBeCloseTo(NM_TO_LBFT, 4)
  })

  test('kwToHp: 1 kW ≈ 1.341 hp', () => {
    expect(kwToHp(1)).toBeCloseTo(KW_TO_HP, 4)
  })

  test('nToLbf: 1 N ≈ 0.2248 lbf', () => {
    expect(nToLbf(1)).toBeCloseTo(N_TO_LBF, 4)
  })

  test('mToFt: 1 m ≈ 3.281 ft', () => {
    expect(mToFt(1)).toBeCloseTo(M_TO_FT, 4)
  })

  test('constants: MS_TO_MPH and MS_TO_KMH match ratio', () => {
    expect(MS_TO_MPH / MS_TO_KMH).toBeCloseTo(1 / 1.60934, 3)
  })
})
