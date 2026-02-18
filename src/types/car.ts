/** A single point on a curve: [rpm, value] */
export type CurvePoint = [number, number]

export type DrivetrainType = 'FWD' | 'RWD' | 'AWD'

export type TransmissionType = 'manual' | 'automatic' | 'dct' | 'cvt'

export interface TireSize {
  widthMm: number
  aspectRatio: number
  rimDiameterIn: number
}

export interface EngineSpec {
  /** Torque curve: array of [rpm, Nm] points at ~200 RPM intervals */
  torqueCurve: CurvePoint[]
  /** Power curve: array of [rpm, kW] points at ~200 RPM intervals */
  powerCurve: CurvePoint[]
  /** Maximum RPM before fuel cut */
  redlineRpm: number
  /** Idle RPM */
  idleRpm: number
  /** Displacement in liters */
  displacementL: number
  /** True if turbocharged or supercharged */
  forcedInduction: boolean
}

export interface TransmissionSpec {
  /** Gear ratios for each gear (index 0 = 1st gear) */
  gearRatios: number[]
  /** Final drive ratio */
  finalDriveRatio: number
  /** Time in milliseconds to complete a gear shift (thrust = 0 during shift) */
  shiftTimeMs: number
  /** Fraction of power lost to drivetrain (0–1, e.g. 0.15 = 15% loss) */
  drivetrainLoss: number
  type: TransmissionType
}

export interface AeroSpec {
  /** Drag coefficient (dimensionless) */
  cd: number
  /** Frontal area in square meters */
  frontalAreaM2: number
}

export interface CarSpec {
  id: string
  make: string
  model: string
  year: number
  trim: string
  curbWeightKg: number
  drivetrain: DrivetrainType
  engine: EngineSpec
  transmission: TransmissionSpec
  tireSize: TireSize
  aero: AeroSpec
}
