import type { UnitSystem } from '@/store/unitStore'
import { kwToHp, kgToLb, msToMph, msToKmh, mToFt } from '@/utils/units'

/** Ordinal gear label: 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th" … */
export function gearLabel(gear: number): string {
  const suffix = gear === 1 ? 'st' : gear === 2 ? 'nd' : gear === 3 ? 'rd' : 'th'
  return `${gear}${suffix}`
}

/** Format power (kW internal) in display units, with sign when requested */
export function fmtPower(kw: number, units: UnitSystem, signed = false): string {
  const value = units === 'imperial' ? kwToHp(kw) : kw
  const unit = units === 'imperial' ? 'hp' : 'kW'
  const sign = signed && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(0)} ${unit}`
}

/** Format a mass (kg internal) in display units */
export function fmtMass(kg: number, units: UnitSystem): string {
  return units === 'imperial'
    ? `${Math.round(kgToLb(kg)).toLocaleString()} lb`
    : `${Math.round(kg).toLocaleString()} kg`
}

/** Format a speed (m/s internal) in display units */
export function fmtSpeedMs(ms: number, units: UnitSystem): string {
  return units === 'imperial' ? `${msToMph(ms).toFixed(0)} mph` : `${msToKmh(ms).toFixed(0)} km/h`
}

/** Format an altitude (m internal) in display units */
export function fmtAltitude(m: number, units: UnitSystem): string {
  return units === 'imperial'
    ? `${Math.round(mToFt(m)).toLocaleString()} ft`
    : `${Math.round(m).toLocaleString()} m`
}
