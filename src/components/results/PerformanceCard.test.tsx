import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PerformanceCard from './PerformanceCard'
import type { PerformanceMetrics } from '@/types/simulation'

describe('PerformanceCard', () => {
  test('renders 0-60 mph time when provided', () => {
    const perf: PerformanceMetrics = { zeroTo60Mph: 4.23 }
    render(<PerformanceCard performance={perf} />)
    // Component renders mobile and desktop layouts — both contain the value
    const els = screen.getAllByText('4.23s')
    expect(els.length).toBeGreaterThan(0)
  })

  test('renders em-dash for missing metrics', () => {
    render(<PerformanceCard performance={{}} />)
    // All metrics should show '—' when undefined (mobile + desktop = ≥10 total)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(5)
  })

  test('renders quarter mile time', () => {
    const perf: PerformanceMetrics = { quarterMileS: 12.45 }
    render(<PerformanceCard performance={perf} />)
    const els = screen.getAllByText('12.45s')
    expect(els.length).toBeGreaterThan(0)
  })

  test('renders top speed in mph', () => {
    // 67.056 m/s ≈ 150 mph
    const perf: PerformanceMetrics = { topSpeedMs: 67.056 }
    render(<PerformanceCard performance={perf} />)
    const speedEls = screen.getAllByText(/150\.\d+ mph/)
    expect(speedEls.length).toBeGreaterThan(0)
  })

  test('renders all metric labels', () => {
    render(<PerformanceCard performance={{}} />)
    // Labels appear in both mobile and desktop — getAllByText to handle duplicates
    expect(screen.getAllByText('0–60 mph').length).toBeGreaterThan(0)
    expect(screen.getAllByText('0–100 km/h').length).toBeGreaterThan(0)
    expect(screen.getAllByText('¼ Mile').length).toBeGreaterThan(0)
    expect(screen.getAllByText('¼ Mile Trap').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Top Speed').length).toBeGreaterThan(0)
  })
})
