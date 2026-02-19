import { describe, test, expect, beforeEach } from 'vitest'
import { useSimulationStore } from './simulationStore'
import type { SimulationResult } from '@/types/simulation'

const mockResult: SimulationResult = {
  gearCurves: [],
  envelope: [],
  shiftPoints: [],
  performance: {},
  trace: [],
}

describe('simulationStore', () => {
  beforeEach(() => {
    useSimulationStore.setState({ result: null, isRunning: false, error: null })
  })

  test('initial state is null/false/null', () => {
    const { result, isRunning, error } = useSimulationStore.getState()
    expect(result).toBeNull()
    expect(isRunning).toBe(false)
    expect(error).toBeNull()
  })

  test('setResult stores result and clears error', () => {
    useSimulationStore.setState({ error: 'prior error' })
    useSimulationStore.getState().setResult(mockResult)
    const state = useSimulationStore.getState()
    expect(state.result).toBe(mockResult)
    expect(state.error).toBeNull()
  })

  test('setRunning updates isRunning', () => {
    useSimulationStore.getState().setRunning(true)
    expect(useSimulationStore.getState().isRunning).toBe(true)
    useSimulationStore.getState().setRunning(false)
    expect(useSimulationStore.getState().isRunning).toBe(false)
  })

  test('setError stores message and clears result', () => {
    useSimulationStore.setState({ result: mockResult })
    useSimulationStore.getState().setError('Simulation failed')
    const state = useSimulationStore.getState()
    expect(state.error).toBe('Simulation failed')
    expect(state.result).toBeNull()
  })

  test('clearResult resets result and error', () => {
    useSimulationStore.setState({ result: mockResult, error: 'oops' })
    useSimulationStore.getState().clearResult()
    const state = useSimulationStore.getState()
    expect(state.result).toBeNull()
    expect(state.error).toBeNull()
  })
})
