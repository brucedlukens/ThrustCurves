import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AccelerationChart from './AccelerationChart'
import type { TimeStep } from '@/types/simulation'

const mockTrace: TimeStep[] = Array.from({ length: 50 }, (_, i) => ({
  timeS: i * 0.5,
  speedMs: i * 1.0,
  distanceM: i * i * 0.25,
  accelerationMs2: Math.max(0, 8 - i * 0.15),
  gear: Math.min(Math.floor(i / 8) + 1, 6),
  rpm: 2000 + i * 100,
  thrustN: 5000,
  dragN: 200 + i * 50,
  netForceN: 4800 - i * 50,
}))

describe('AccelerationChart', () => {
  it('renders without crashing with valid trace', () => {
    render(<AccelerationChart trace={mockTrace} />)
    // Chart renders into a container
  })

  it('shows empty state when trace has no positive acceleration', () => {
    const zeroTrace: TimeStep[] = mockTrace.map(s => ({ ...s, accelerationMs2: -1 }))
    render(<AccelerationChart trace={zeroTrace} />)
    expect(screen.getByText('No acceleration data')).toBeInTheDocument()
  })

  it('renders empty trace without crashing', () => {
    render(<AccelerationChart trace={[]} />)
    expect(screen.getByText('No acceleration data')).toBeInTheDocument()
  })
})
