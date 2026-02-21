import { describe, it, expect } from 'vitest'
import {
  mapPixelToValue,
  colorDistance,
  extractCurveFromImageData,
  tracedPointsToCurve,
} from './dynoReader'
import type { DynoCalibrationPoint, TracedPixelPoint } from '@/types/dyno'

// ── mapPixelToValue ──────────────────────────────────────────────────────────

describe('mapPixelToValue', () => {
  const cal1: DynoCalibrationPoint = { pixelX: 100, pixelY: 0, value: 1000 }
  const cal2: DynoCalibrationPoint = { pixelX: 500, pixelY: 0, value: 7000 }

  it('returns cal1 value at cal1 pixel X', () => {
    expect(mapPixelToValue(100, cal1, cal2, true)).toBe(1000)
  })

  it('returns cal2 value at cal2 pixel X', () => {
    expect(mapPixelToValue(500, cal1, cal2, true)).toBe(7000)
  })

  it('interpolates midpoint on X axis', () => {
    // midpoint pixel = 300, midpoint value = (1000+7000)/2 = 4000
    expect(mapPixelToValue(300, cal1, cal2, true)).toBeCloseTo(4000)
  })

  it('extrapolates beyond calibration range', () => {
    // Beyond cal2 at pixel 700: value = 7000 + (700-500)/(500-100) * (7000-1000) = 10000
    expect(mapPixelToValue(700, cal1, cal2, true)).toBeCloseTo(10000)
  })

  it('uses pixelY when useX is false', () => {
    // Y axis: low pixel Y = top of chart = high value (typical dyno layout)
    const yc1: DynoCalibrationPoint = { pixelX: 0, pixelY: 400, value: 100 }
    const yc2: DynoCalibrationPoint = { pixelX: 0, pixelY: 100, value: 500 }
    expect(mapPixelToValue(400, yc1, yc2, false)).toBeCloseTo(100)
    expect(mapPixelToValue(100, yc1, yc2, false)).toBeCloseTo(500)
    // Midpoint pixel: 250 → midpoint value: 300
    expect(mapPixelToValue(250, yc1, yc2, false)).toBeCloseTo(300)
  })

  it('handles degenerate case where both calibration points share the same pixel', () => {
    const same: DynoCalibrationPoint = { pixelX: 200, pixelY: 200, value: 3000 }
    expect(mapPixelToValue(200, same, same, true)).toBe(3000)
  })
})

// ── colorDistance ────────────────────────────────────────────────────────────

describe('colorDistance', () => {
  it('returns 0 for identical colors', () => {
    expect(colorDistance(255, 0, 0, 255, 0, 0)).toBe(0)
    expect(colorDistance(128, 200, 50, 128, 200, 50)).toBe(0)
  })

  it('computes correct Euclidean distance', () => {
    // sqrt(3^2 + 4^2 + 0) = 5
    expect(colorDistance(0, 0, 0, 3, 4, 0)).toBeCloseTo(5)
  })

  it('is symmetric', () => {
    const d1 = colorDistance(100, 150, 200, 50, 80, 220)
    const d2 = colorDistance(50, 80, 220, 100, 150, 200)
    expect(d1).toBeCloseTo(d2)
  })

  it('returns max distance for black vs white', () => {
    // sqrt(255^2 * 3) ≈ 441.67
    expect(colorDistance(0, 0, 0, 255, 255, 255)).toBeCloseTo(441.67, 1)
  })
})

// ── extractCurveFromImageData ────────────────────────────────────────────────

describe('extractCurveFromImageData', () => {
  function makeImageData(
    width: number,
    height: number,
    pixels: Array<{ x: number; y: number; r: number; g: number; b: number }>,
  ): Uint8ClampedArray {
    const data = new Uint8ClampedArray(width * height * 4) // initialized to 0 (transparent black)
    for (const { x, y, r, g, b } of pixels) {
      const idx = (y * width + x) * 4
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255
    }
    return data
  }

  it('finds exact color matches', () => {
    // 4×3 image with red pixels at (1,1) and (2,0)
    const data = makeImageData(4, 3, [
      { x: 1, y: 1, r: 255, g: 0, b: 0 },
      { x: 2, y: 0, r: 255, g: 0, b: 0 },
    ])
    const points = extractCurveFromImageData(data, 4, 3, 255, 0, 0, 10)
    expect(points).toHaveLength(2)
    expect(points.find(p => p.pixelX === 1)).toEqual({ pixelX: 1, pixelY: 1 })
    expect(points.find(p => p.pixelX === 2)).toEqual({ pixelX: 2, pixelY: 0 })
  })

  it('returns empty when no pixels match', () => {
    const data = new Uint8ClampedArray(4 * 4 * 4) // all zeros (transparent black)
    const points = extractCurveFromImageData(data, 4, 4, 255, 0, 0, 10)
    expect(points).toHaveLength(0)
  })

  it('returns only the topmost matching pixel per column', () => {
    // 1-wide, 3-tall image: all red — should return only (0,0)
    const data = makeImageData(1, 3, [
      { x: 0, y: 0, r: 255, g: 0, b: 0 },
      { x: 0, y: 1, r: 255, g: 0, b: 0 },
      { x: 0, y: 2, r: 255, g: 0, b: 0 },
    ])
    const points = extractCurveFromImageData(data, 1, 3, 255, 0, 0, 10)
    expect(points).toHaveLength(1)
    expect(points[0]).toEqual({ pixelX: 0, pixelY: 0 })
  })

  it('matches within tolerance', () => {
    // Pixel at (0,0) is [240, 5, 5] — should match [255, 0, 0] at tolerance=30
    // distance = sqrt((255-240)^2 + 5^2 + 5^2) = sqrt(225 + 25 + 25) = sqrt(275) ≈ 16.6
    const data = makeImageData(2, 2, [
      { x: 0, y: 0, r: 240, g: 5, b: 5 },
      // (1,0) = [180, 0, 0] — distance ≈ 75, should NOT match at tolerance=30
      { x: 1, y: 0, r: 180, g: 0, b: 0 },
    ])
    const points = extractCurveFromImageData(data, 2, 2, 255, 0, 0, 30)
    expect(points).toHaveLength(1)
    expect(points[0].pixelX).toBe(0)
  })

  it('does not match pixels outside tolerance', () => {
    // distance to [255,0,0] is ~75 (too far at tolerance=30)
    const data = makeImageData(1, 1, [{ x: 0, y: 0, r: 180, g: 0, b: 0 }])
    const points = extractCurveFromImageData(data, 1, 1, 255, 0, 0, 30)
    expect(points).toHaveLength(0)
  })
})

// ── tracedPointsToCurve ──────────────────────────────────────────────────────

describe('tracedPointsToCurve', () => {
  // X calibration: pixel 0 → 1000 RPM, pixel 600 → 7000 RPM
  const xCal: [DynoCalibrationPoint, DynoCalibrationPoint] = [
    { pixelX: 0, pixelY: 0, value: 1000 },
    { pixelX: 600, pixelY: 0, value: 7000 },
  ]
  // Y calibration (typical dyno: lower pixelY = higher value)
  // pixelY 300 → 100 Nm, pixelY 0 → 600 Nm
  const yCal: [DynoCalibrationPoint, DynoCalibrationPoint] = [
    { pixelX: 0, pixelY: 300, value: 100 },
    { pixelX: 0, pixelY: 0, value: 600 },
  ]

  // Helper: pixelY for a given Nm value using yCal above
  // y = 300 + (Nm - 100) / (600 - 100) * (0 - 300) = 300 - (Nm - 100) * 0.6
  function nmToPixelY(nm: number) {
    return 300 - (nm - 100) * 0.6
  }

  it('converts pixel points to Nm CurvePoints', () => {
    // Flat curve at 400 Nm across RPM range
    const pixelY400 = nmToPixelY(400) // = 300 - 300 * 0.6 = 120
    const traced: TracedPixelPoint[] = [
      { pixelX: 0, pixelY: pixelY400 },   // 1000 RPM
      { pixelX: 300, pixelY: pixelY400 }, // 4000 RPM
      { pixelX: 600, pixelY: pixelY400 }, // 7000 RPM
    ]
    const curve = tracedPointsToCurve(traced, xCal, yCal, 'Nm', 1000, 7000)
    expect(curve.length).toBeGreaterThan(0)
    // All values should be ≈ 400 Nm
    curve.forEach(([rpm, nm]) => {
      expect(rpm).toBeGreaterThanOrEqual(1000)
      expect(rpm).toBeLessThanOrEqual(7000)
      expect(nm).toBeCloseTo(400, 0)
    })
  })

  it('resamples to 200 RPM intervals', () => {
    const pixelY = nmToPixelY(300)
    const traced: TracedPixelPoint[] = [
      { pixelX: 0, pixelY },
      { pixelX: 600, pixelY },
    ]
    const curve = tracedPointsToCurve(traced, xCal, yCal, 'Nm', 1000, 7000)
    // All RPM values should be multiples of 200
    curve.forEach(([rpm]) => {
      expect(rpm % 200).toBe(0)
    })
  })

  it('converts lb-ft to Nm', () => {
    // Calibrate Y in lb-ft: 100 lb-ft at pixelY=300, 600 lb-ft at pixelY=0
    const yCalLbft: [DynoCalibrationPoint, DynoCalibrationPoint] = [
      { pixelX: 0, pixelY: 300, value: 100 },
      { pixelX: 0, pixelY: 0, value: 600 },
    ]
    // pixelY=120 → 400 lb-ft → lbftToNm(400) ≈ 542 Nm
    const traced: TracedPixelPoint[] = [
      { pixelX: 0, pixelY: 120 },
      { pixelX: 300, pixelY: 120 },
      { pixelX: 600, pixelY: 120 },
    ]
    const curve = tracedPointsToCurve(traced, xCal, yCalLbft, 'lb-ft', 1000, 7000)
    expect(curve.length).toBeGreaterThan(0)
    // 400 lb-ft / 0.737562 ≈ 542 Nm
    curve.forEach(([, nm]) => {
      expect(nm).toBeCloseTo(400 / 0.737562, -1)
    })
  })

  it('converts kW to Nm', () => {
    // x: pixel 0 → 3000 RPM, pixel 100 → 5000 RPM
    const xCal2: [DynoCalibrationPoint, DynoCalibrationPoint] = [
      { pixelX: 0, pixelY: 0, value: 3000 },
      { pixelX: 100, pixelY: 0, value: 5000 },
    ]
    // y: pixelY 100 → 0 kW, pixelY 0 → 100 kW
    const yCalKw: [DynoCalibrationPoint, DynoCalibrationPoint] = [
      { pixelX: 0, pixelY: 100, value: 0 },
      { pixelX: 0, pixelY: 0, value: 100 },
    ]
    // pixelX=50 → 4000 RPM, pixelY=0 → 100 kW → Nm = 100*9549/4000 ≈ 239
    const traced: TracedPixelPoint[] = [
      { pixelX: 0, pixelY: 0 },  // 3000 RPM, 100 kW
      { pixelX: 50, pixelY: 0 }, // 4000 RPM, 100 kW
      { pixelX: 100, pixelY: 0 }, // 5000 RPM, 100 kW
    ]
    const curve = tracedPointsToCurve(traced, xCal2, yCalKw, 'kW', 3000, 5000)
    expect(curve.length).toBeGreaterThan(0)
    const pt4000 = curve.find(([rpm]) => rpm === 4000)
    if (pt4000) {
      expect(pt4000[1]).toBeCloseTo(239, -1)
    }
  })

  it('converts hp to Nm', () => {
    const yCalHp: [DynoCalibrationPoint, DynoCalibrationPoint] = [
      { pixelX: 0, pixelY: 100, value: 0 },
      { pixelX: 0, pixelY: 0, value: 200 },
    ]
    // 200 hp at 4000 RPM: kW = 200*0.7457 = 149.14, Nm = 149.14*9549/4000 ≈ 356
    const xCal3: [DynoCalibrationPoint, DynoCalibrationPoint] = [
      { pixelX: 0, pixelY: 0, value: 3000 },
      { pixelX: 100, pixelY: 0, value: 5000 },
    ]
    const traced: TracedPixelPoint[] = [
      { pixelX: 0, pixelY: 0 },
      { pixelX: 50, pixelY: 0 }, // 4000 RPM, 200 hp
      { pixelX: 100, pixelY: 0 },
    ]
    const curve = tracedPointsToCurve(traced, xCal3, yCalHp, 'hp', 3000, 5000)
    expect(curve.length).toBeGreaterThan(0)
    const pt4000 = curve.find(([rpm]) => rpm === 4000)
    if (pt4000) {
      // 200 hp * 0.7457 kW/hp * 9549 / 4000 ≈ 356 Nm
      expect(pt4000[1]).toBeCloseTo(200 * 0.7457 * 9549 / 4000, -1)
    }
  })

  it('returns empty array for empty traced points', () => {
    const curve = tracedPointsToCurve([], xCal, yCal, 'Nm', 1000, 7000)
    expect(curve).toHaveLength(0)
  })

  it('filters points outside the RPM range', () => {
    const traced: TracedPixelPoint[] = [
      { pixelX: -100, pixelY: 120 }, // below 1000 RPM (extrapolated)
      { pixelX: 300, pixelY: 120 },  // valid 4000 RPM
      { pixelX: 700, pixelY: 120 },  // above 7000 RPM (extrapolated)
    ]
    const curve = tracedPointsToCurve(traced, xCal, yCal, 'Nm', 1000, 7000)
    curve.forEach(([rpm]) => {
      expect(rpm).toBeGreaterThanOrEqual(1000)
      expect(rpm).toBeLessThanOrEqual(7000)
    })
  })
})
