import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import ThrustCurveChart from './ThrustCurveChart'
import type { GearThrustCurve, EnvelopePoint } from '@/types/simulation'

const mockGearCurves: GearThrustCurve[] = [
  {
    gear: 1,
    speedRangeMs: [0, 15],
    points: [
      { speedMs: 0, forceN: 8000, rpm: 1000 },
      { speedMs: 5, forceN: 7000, rpm: 2000 },
      { speedMs: 10, forceN: 6000, rpm: 3000 },
      { speedMs: 15, forceN: 5000, rpm: 4000 },
    ],
  },
  {
    gear: 2,
    speedRangeMs: [10, 25],
    points: [
      { speedMs: 10, forceN: 5500, rpm: 2000 },
      { speedMs: 15, forceN: 5000, rpm: 2800 },
      { speedMs: 25, forceN: 4000, rpm: 4500 },
    ],
  },
]

const mockEnvelope: EnvelopePoint[] = [
  { speedMs: 0, forceN: 8000, gear: 1 },
  { speedMs: 5, forceN: 7000, gear: 1 },
  { speedMs: 10, forceN: 6000, gear: 1 },
  { speedMs: 15, forceN: 5000, gear: 2 },
  { speedMs: 25, forceN: 4000, gear: 2 },
]

describe('ThrustCurveChart', () => {
  test('renders without crashing', () => {
    const { container } = render(
      <ThrustCurveChart gearCurves={mockGearCurves} envelope={mockEnvelope} />,
    )
    expect(container).toBeTruthy()
  })

  test('renders with empty gear curves', () => {
    const { container } = render(<ThrustCurveChart gearCurves={[]} envelope={[]} />)
    expect(container).toBeTruthy()
  })
})
