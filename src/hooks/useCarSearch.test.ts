import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCarSearch } from './useCarSearch'

describe('useCarSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('returns all cars initially (empty query)', () => {
    const { result } = renderHook(() => useCarSearch())
    expect(result.current.results.length).toBeGreaterThan(0)
    expect(result.current.query).toBe('')
  })

  test('still shows all cars before debounce fires', () => {
    const { result } = renderHook(() => useCarSearch(200))
    const initialCount = result.current.results.length

    act(() => {
      result.current.setQuery('toyota')
    })

    // Debounce has not fired yet — results still unfiltered
    expect(result.current.results.length).toBe(initialCount)
  })

  test('filters by make after debounce fires', () => {
    const { result } = renderHook(() => useCarSearch(200))

    act(() => {
      result.current.setQuery('toyota')
    })
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.results.length).toBeGreaterThan(0)
    expect(result.current.results.every(c => c.make.toLowerCase().includes('toyota'))).toBe(true)
  })

  test('returns empty array for non-matching query', () => {
    const { result } = renderHook(() => useCarSearch(0))

    act(() => {
      result.current.setQuery('zzznonexistentcar999')
    })
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.results).toHaveLength(0)
  })

  test('search is case-insensitive', () => {
    const { result } = renderHook(() => useCarSearch(0))

    act(() => {
      result.current.setQuery('TOYOTA')
    })
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.results.length).toBeGreaterThan(0)
  })

  test('clears to all results when query is reset to empty', () => {
    const { result } = renderHook(() => useCarSearch(0))
    const totalCount = result.current.results.length

    act(() => {
      result.current.setQuery('toyota')
    })
    act(() => {
      vi.runAllTimers()
    })
    act(() => {
      result.current.setQuery('')
    })
    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.results.length).toBe(totalCount)
  })

  test('debouncedQuery lags behind query', () => {
    const { result } = renderHook(() => useCarSearch(200))

    act(() => {
      result.current.setQuery('supra')
    })

    expect(result.current.query).toBe('supra')
    expect(result.current.debouncedQuery).toBe('')

    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.debouncedQuery).toBe('supra')
  })
})
