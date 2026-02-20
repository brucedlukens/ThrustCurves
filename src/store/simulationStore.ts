import { create } from 'zustand'
import type { SimulationResult } from '@/types/simulation'

interface SimulationStore {
  result: SimulationResult | null
  isRunning: boolean
  error: string | null
  setResult: (result: SimulationResult) => void
  setRunning: (running: boolean) => void
  setError: (error: string | null) => void
  clearResult: () => void
}

export const useSimulationStore = create<SimulationStore>(set => ({
  result: null,
  isRunning: false,
  error: null,
  setResult: result => set({ result, error: null }),
  setRunning: running => set({ isRunning: running }),
  setError: error => set({ error, result: null }),
  clearResult: () => set({ result: null, error: null }),
}))
