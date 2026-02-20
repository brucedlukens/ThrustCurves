import { create } from 'zustand'
import type { CarSpec } from '@/types/car'
import type { CarModifications } from '@/types/config'
import { DEFAULT_MODIFICATIONS } from '@/types/config'
import { getAllCustomCars, putCustomCar, removeCustomCar } from '@/services/persistence'
import carsData from '@/data/cars.json'

const OEM_CARS = carsData as CarSpec[]

interface CarStore {
  cars: CarSpec[]
  selectedCarId: string | null
  modifications: CarModifications
  getSelectedCar: () => CarSpec | undefined
  selectCar: (carId: string) => void
  updateModifications: (mods: Partial<CarModifications>) => void
  resetModifications: () => void
  /** Load custom cars from IndexedDB and merge with OEM list */
  loadCustomCars: () => Promise<void>
  /** Persist a custom car (add or update) and merge into cars list */
  saveCustomCar: (car: CarSpec) => Promise<void>
  /** Remove a custom car from IndexedDB and the cars list */
  deleteCustomCar: (id: string) => Promise<void>
}

export const useCarStore = create<CarStore>((set, get) => ({
  cars: OEM_CARS,
  selectedCarId: null,
  modifications: { ...DEFAULT_MODIFICATIONS },

  getSelectedCar: () => {
    const { cars, selectedCarId } = get()
    return cars.find(c => c.id === selectedCarId)
  },

  selectCar: (carId: string) =>
    set({ selectedCarId: carId, modifications: { ...DEFAULT_MODIFICATIONS } }),

  updateModifications: (mods: Partial<CarModifications>) =>
    set(state => ({ modifications: { ...state.modifications, ...mods } })),

  resetModifications: () => set({ modifications: { ...DEFAULT_MODIFICATIONS } }),

  loadCustomCars: async () => {
    const customCars = await getAllCustomCars()
    set({ cars: [...OEM_CARS, ...customCars] })
  },

  saveCustomCar: async (car: CarSpec) => {
    await putCustomCar(car)
    // Re-fetch all custom cars so ordering is consistent
    const customCars = await getAllCustomCars()
    set({ cars: [...OEM_CARS, ...customCars] })
  },

  deleteCustomCar: async (id: string) => {
    await removeCustomCar(id)
    const customCars = await getAllCustomCars()
    set(state => ({
      cars: [...OEM_CARS, ...customCars],
      // Deselect if we just deleted the selected car
      selectedCarId: state.selectedCarId === id ? null : state.selectedCarId,
    }))
  },
}))
