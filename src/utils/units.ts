/** Conversion factor: m/s → mph */
export const MS_TO_MPH = 2.23694

/** Conversion factor: m/s → km/h */
export const MS_TO_KMH = 3.6

/** Conversion factor: Nm → lb·ft */
export const NM_TO_LBFT = 0.737562

/** Conversion factor: kW → hp */
export const KW_TO_HP = 1.34102

/** Conversion factor: N → lbf */
export const N_TO_LBF = 0.224809

/** Conversion factor: m → ft */
export const M_TO_FT = 3.28084

export function msToMph(ms: number): number {
  return ms * MS_TO_MPH
}

export function mphToMs(mph: number): number {
  return mph / MS_TO_MPH
}

export function msToKmh(ms: number): number {
  return ms * MS_TO_KMH
}

export function nmToLbft(nm: number): number {
  return nm * NM_TO_LBFT
}

export function kwToHp(kw: number): number {
  return kw * KW_TO_HP
}

export function nToLbf(n: number): number {
  return n * N_TO_LBF
}

export function mToFt(m: number): number {
  return m * M_TO_FT
}
