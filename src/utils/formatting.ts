import { msToMph, nToLbf, mToFt } from './units'

/** Format a time value in seconds, or '—' if undefined */
export function fmtTime(s: number | undefined): string {
  return s !== undefined ? `${s.toFixed(2)}s` : '—'
}

/** Format a speed in m/s as mph, or '—' if undefined */
export function fmtSpeed(ms: number | undefined): string {
  return ms !== undefined ? `${msToMph(ms).toFixed(1)} mph` : '—'
}

/** Format a force in Newtons as lbf */
export function fmtForce(n: number): string {
  return `${nToLbf(n).toFixed(0)} lbf`
}

/** Format a distance in meters as feet */
export function fmtDistance(m: number): string {
  return `${mToFt(m).toFixed(0)} ft`
}

/** Format an RPM value */
export function fmtRpm(rpm: number): string {
  return `${rpm.toFixed(0)} RPM`
}
