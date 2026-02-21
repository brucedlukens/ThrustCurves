/** A calibration point: pixel coordinate paired with a physical value */
export interface DynoCalibrationPoint {
  pixelX: number
  pixelY: number
  value: number
}

/** Unit of the Y-axis on the dyno graph */
export type DynoYUnit = 'Nm' | 'lb-ft' | 'kW' | 'hp'

/** A pixel coordinate where the curve was detected */
export interface TracedPixelPoint {
  pixelX: number
  pixelY: number
}

/** Wizard steps for the Dyno Reader */
export type DynoStep =
  | 'upload'
  | 'calibrate-x'
  | 'calibrate-y'
  | 'color'
  | 'trace'
  | 'export'
