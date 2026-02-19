import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PerformanceCard from './PerformanceCard'
import type { PerformanceMetrics } from '@/types/simulation'

describe('PerformanceCard', () => {
  test('renders 0-60 mph time when provided', () => {
    const perf: PerformanceMetrics = { zeroTo60Mph: 4.23 }
    render(<PerformanceCard performance={perf} />)
    expect(screen.getByText('4.23s')).toBeInTheDocument()
  })

  test('renders em-dash for missing metrics', () => {
    render(<PerformanceCard performance={{}} />)
    // All metrics should show '—' when undefined
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(5)
  })

  test('renders quarter mile time', () => {
    const perf: PerformanceMetrics = { quarterMileS: 12.45 }
    render(<PerformanceCard performance={perf} />)
    expect(screen.getByText('12.45s')).toBeInTheDocument()
  })

  test('renders top speed in mph', () => {
    // 67.056 m/s ≈ 150 mph
    const perf: PerformanceMetrics = { topSpeedMs: 67.056 }
    render(<PerformanceCard performance={perf} />)
    const speedText = screen.getByText(/150\.\d+ mph/)
    expect(speedText).toBeInTheDocument()
  })

  test('renders all metric labels', () => {
    render(<PerformanceCard performance={{}} />)
    expect(screen.getByText('0–60 mph')).toBeInTheDocument()
    expect(screen.getByText('0–100 km/h')).toBeInTheDocument()
    expect(screen.getByText('¼ Mile')).toBeInTheDocument()
    expect(screen.getByText('¼ Mile Trap')).toBeInTheDocument()
    expect(screen.getByText('Top Speed')).toBeInTheDocument()
  })
})
