/** A single point on a thrust curve: speed (m/s) → force (N) */
export interface ThrustPoint {
  speedMs: number
  forceN: number
  rpm: number
}

/** Thrust curve for one gear across its valid speed range */
export interface GearThrustCurve {
  gear: number
  points: ThrustPoint[]
  /** Speed range [min, max] in m/s where this gear produces positive thrust */
  speedRangeMs: [number, number]
}

/** A point on the thrust envelope (best available gear at each speed) */
export interface EnvelopePoint {
  speedMs: number
  forceN: number
  /** Which gear produces this force */
  gear: number
}

/** Optimal shift point between two consecutive gears */
export interface ShiftPoint {
  fromGear: number
  toGear: number
  /** Speed at which to shift (m/s) */
  speedMs: number
  rpm: number
}

/** A single time-step record during numerical integration */
export interface TimeStep {
  timeS: number
  speedMs: number
  distanceM: number
  accelerationMs2: number
  gear: number
  rpm: number
  thrustN: number
  dragN: number
  netForceN: number
}

/** Performance metrics extracted from time-step integration */
export interface PerformanceMetrics {
  /** Time to 60 mph (96.56 km/h) in seconds */
  zeroTo60Mph?: number
  /** Time to 100 km/h in seconds */
  zeroTo100Kmh?: number
  /** Quarter-mile time in seconds */
  quarterMileS?: number
  /** Quarter-mile trap speed in m/s */
  quarterMileSpeedMs?: number
  /** Top speed limited by aerodynamic drag (m/s) */
  topSpeedMs?: number
}

/** Full simulation result */
export interface SimulationResult {
  gearCurves: GearThrustCurve[]
  envelope: EnvelopePoint[]
  shiftPoints: ShiftPoint[]
  performance: PerformanceMetrics
  /** Full time-step trace for plotting acceleration over time/distance */
  trace: TimeStep[]
}
