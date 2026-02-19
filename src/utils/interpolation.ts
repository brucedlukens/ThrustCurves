import type { CurvePoint } from '@/types/car'

/**
 * Linear interpolation over a sorted array of [x, y] curve points.
 * Clamps to the first/last value if x is out of range.
 */
export function interpolate(curve: CurvePoint[], x: number): number {
  if (curve.length === 0) return 0
  if (x <= curve[0][0]) return curve[0][1]
  if (x >= curve[curve.length - 1][0]) return curve[curve.length - 1][1]

  for (let i = 0; i < curve.length - 1; i++) {
    const [x0, y0] = curve[i]
    const [x1, y1] = curve[i + 1]
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0)
      return y0 + t * (y1 - y0)
    }
  }

  return curve[curve.length - 1][1]
}
