import { useState, useMemo, useEffect, useRef } from 'react'
import { useCarStore } from '@/store/carStore'
import type { CarSpec } from '@/types/car'

/**
 * Debounced car search hook.
 *
 * @param debounceMs - Milliseconds to wait after the last keystroke before filtering (default 200ms)
 */
export function useCarSearch(debounceMs = 200): {
  query: string
  setQuery: (q: string) => void
  results: CarSpec[]
  debouncedQuery: string
} {
  const cars = useCarStore(state => state.cars)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, debounceMs])

  const results = useMemo<CarSpec[]>(() => {
    const q = debouncedQuery.toLowerCase().trim()
    if (!q) return cars
    return cars.filter(car => {
      const searchable = `${car.year} ${car.make} ${car.model} ${car.trim}`.toLowerCase()
      return searchable.includes(q)
    })
  }, [cars, debouncedQuery])

  return { query, setQuery, results, debouncedQuery }
}
