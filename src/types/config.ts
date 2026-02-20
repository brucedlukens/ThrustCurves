import type { CurvePoint, TireSize } from './car.ts'

/** User-applied modifications layered on top of an OEM CarSpec */
export interface CarModifications {
  /** Additional weight in kg (negative = weight reduction) */
  weightDeltaKg: number
  /** Multiply all torque values by this factor (1.0 = stock) */
  torqueMultiplier: number
  /** Replace the stock torque curve entirely (optional) */
  customTorqueCurve?: CurvePoint[]
  /** Override individual gear ratios (index = gear - 1, undefined = stock) */
  gearRatioOverrides: (number | undefined)[]
  finalDriveOverride?: number
  tireSizeOverride?: TireSize
  cdOverride?: number
  frontalAreaOverride?: number
  /** Override forced induction flag */
  forcedInductionOverride?: boolean
  shiftTimeOverride?: number
  drivetrainLossOverride?: number
  /** Altitude in meters for air density calculation */
  altitudeM: number
  /**
   * Longitudinal tire friction coefficient (μ).
   * Caps thrust at μ × mass × g. undefined = no limit.
   * Typical values: drag slick ~1.7, track ~1.4, street ~1.0, eco ~0.7
   */
  tractionCoefficientMu?: number
}

/** A named, saved simulation configuration */
export interface SavedSetup {
  id: string
  name: string
  /** ID of the base CarSpec */
  carId: string
  modifications: CarModifications
  createdAt: string
  updatedAt: string
}

/** A set of setups selected for side-by-side comparison */
export interface ComparisonSet {
  id: string
  name: string
  setupIds: string[]
}

/** Default/blank modifications (no changes from stock) */
export const DEFAULT_MODIFICATIONS: CarModifications = {
  weightDeltaKg: 0,
  torqueMultiplier: 1.0,
  gearRatioOverrides: [],
  altitudeM: 0,
}
