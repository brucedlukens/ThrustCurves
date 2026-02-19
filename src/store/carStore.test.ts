import { describe, test, expect, beforeEach } from 'vitest'
import { useCarStore } from './carStore'
import { DEFAULT_MODIFICATIONS } from '@/types/config'

describe('carStore', () => {
  beforeEach(() => {
    useCarStore.setState({
      selectedCarId: null,
      modifications: { ...DEFAULT_MODIFICATIONS },
    })
  })

  test('initial cars list is non-empty', () => {
    expect(useCarStore.getState().cars.length).toBeGreaterThan(0)
  })

  test('selectCar sets selectedCarId and resets modifications', () => {
    const { cars } = useCarStore.getState()
    useCarStore.getState().updateModifications({ weightDeltaKg: -50 })
    useCarStore.getState().selectCar(cars[0].id)

    const state = useCarStore.getState()
    expect(state.selectedCarId).toBe(cars[0].id)
    expect(state.modifications).toEqual(DEFAULT_MODIFICATIONS)
  })

  test('updateModifications merges partial update', () => {
    useCarStore.getState().updateModifications({ weightDeltaKg: -50 })
    const { modifications } = useCarStore.getState()
    expect(modifications.weightDeltaKg).toBe(-50)
    // Other fields remain at defaults
    expect(modifications.torqueMultiplier).toBe(1.0)
    expect(modifications.altitudeM).toBe(0)
  })

  test('resetModifications restores defaults', () => {
    useCarStore.getState().updateModifications({ weightDeltaKg: -50, altitudeM: 1609 })
    useCarStore.getState().resetModifications()
    expect(useCarStore.getState().modifications).toEqual(DEFAULT_MODIFICATIONS)
  })

  test('getSelectedCar returns undefined when none selected', () => {
    expect(useCarStore.getState().getSelectedCar()).toBeUndefined()
  })

  test('getSelectedCar returns correct car after selectCar', () => {
    const { cars } = useCarStore.getState()
    useCarStore.getState().selectCar(cars[0].id)
    const car = useCarStore.getState().getSelectedCar()
    expect(car).toBeDefined()
    expect(car?.id).toBe(cars[0].id)
  })

  test('selectCar with unknown id sets selectedCarId but getSelectedCar returns undefined', () => {
    useCarStore.getState().selectCar('nonexistent-id')
    expect(useCarStore.getState().selectedCarId).toBe('nonexistent-id')
    expect(useCarStore.getState().getSelectedCar()).toBeUndefined()
  })
})
