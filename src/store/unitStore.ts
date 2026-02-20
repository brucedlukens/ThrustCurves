import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UnitSystem = 'imperial' | 'metric'

interface UnitStore {
  units: UnitSystem
  toggleUnits: () => void
}

export const useUnitStore = create<UnitStore>()(
  persist(
    set => ({
      units: 'imperial',
      toggleUnits: () =>
        set(state => ({ units: state.units === 'imperial' ? 'metric' : 'imperial' })),
    }),
    { name: 'thrust-curves-units' }
  )
)
