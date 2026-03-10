import type { DynoCalibrationPoint, DynoYUnit, TracedPixelPoint } from '@/types/dyno'
import type { CurvePoint } from '@/types/car'
import { lbftToNm } from '@/utils/units'
import { interpolate } from '@/utils/interpolation'

/**
 * Map a pixel coordinate to a physical value using two calibration points.
 * Uses linear interpolation/extrapolation.
 *
 * @param pixelCoord - the pixel position to convert
 * @param cal1 - first calibration point
 * @param cal2 - second calibration point
 * @param useX - true to use the X pixel coordinate, false to use Y
 */
export function mapPixelToValue(
  pixelCoord: number,
  cal1: DynoCalibrationPoint,
  cal2: DynoCalibrationPoint,
  useX: boolean,
): number {
  const p1 = useX ? cal1.pixelX : cal1.pixelY
  const p2 = useX ? cal2.pixelX : cal2.pixelY
  if (p1 === p2) return cal1.value
  const t = (pixelCoord - p1) / (p2 - p1)
  return cal1.value + t * (cal2.value - cal1.value)
}

/**
 * Euclidean color distance between two RGB colors.
 * Max value is ~441 (sqrt(3 * 255^2)).
 */
export function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

/**
 * Extract curve pixels from RGBA image data by color proximity.
 * For each X column, finds the topmost pixel whose color is within `tolerance`
 * of the target RGB. Returns results sorted by X.
 */
export function extractCurveFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  targetR: number,
  targetG: number,
  targetB: number,
  tolerance: number,
): TracedPixelPoint[] {
  const points: TracedPixelPoint[] = []
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      if (colorDistance(r, g, b, targetR, targetG, targetB) <= tolerance) {
        points.push({ pixelX: x, pixelY: y })
        break // topmost match in this column
      }
    }
  }
  return points
}

/**
 * Convert traced pixel points to a CurvePoint[] ([rpm, Nm]) using axis calibration.
 * Resamples the extracted data to 200 RPM intervals between idleRpm and redlineRpm.
 * Converts the Y-axis value to Nm regardless of the original unit.
 */
export function tracedPointsToCurve(
  traced: TracedPixelPoint[],
  xCal: [DynoCalibrationPoint, DynoCalibrationPoint],
  yCal: [DynoCalibrationPoint, DynoCalibrationPoint],
  yUnit: DynoYUnit,
  idleRpm: number,
  redlineRpm: number,
): CurvePoint[] {
  if (traced.length === 0) return []

  // Convert pixel coordinates to physical values
  const raw: CurvePoint[] = traced.map(({ pixelX, pixelY }) => [
    mapPixelToValue(pixelX, xCal[0], xCal[1], true),
    mapPixelToValue(pixelY, yCal[0], yCal[1], false),
  ])

  // Sort by RPM
  const sorted = [...raw].sort((a, b) => a[0] - b[0])

  // Resample to 200 RPM intervals
  const STEP = 200
  const startRpm = Math.ceil(idleRpm / STEP) * STEP
  const points: CurvePoint[] = []

  for (let rpm = startRpm; rpm <= redlineRpm; rpm += STEP) {
    if (rpm < sorted[0][0] || rpm > sorted[sorted.length - 1][0]) continue

    const rawValue = interpolate(sorted, rpm)
    if (rawValue <= 0) continue

    let nm: number
    switch (yUnit) {
      case 'Nm':
        nm = rawValue
        break
      case 'lb-ft':
        nm = lbftToNm(rawValue)
        break
      case 'kW':
        // P(kW) = T(Nm) * rpm / 9549  →  T(Nm) = P(kW) * 9549 / rpm
        nm = (rawValue * 9549) / rpm
        break
      case 'hp':
        // 1 hp = 0.7457 kW
        nm = (rawValue * 0.7457 * 9549) / rpm
        break
      default:
        nm = rawValue
    }

    if (nm > 0) {
      points.push([rpm, Math.round(nm)])
    }
  }

  return points
}
