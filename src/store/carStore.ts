import { create } from 'zustand'
import type { CarSpec } from '@/types/car'
import type { CarModifications } from '@/types/config'
import { DEFAULT_MODIFICATIONS } from '@/types/config'
import carsData from '@/data/cars.json'

const CARS = carsData as CarSpec[]

interface CarStore {
  cars: CarSpec[]
  selectedCarId: string | null
  modifications: CarModifications
  getSelectedCar: () => CarSpec | undefined
  selectCar: (carId: string) => void
  updateModifications: (mods: Partial<CarModifications>) => void
  resetModifications: () => void
}

export const useCarStore = create<CarStore>((set, get) => ({
  cars: CARS,
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
}))
