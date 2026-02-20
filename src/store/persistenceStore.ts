import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { SavedSetup, CarModifications } from '@/types/config'
import * as persistence from '@/services/persistence'

interface PersistenceStore {
  savedSetups: SavedSetup[]
  isLoading: boolean
  error: string | null
  /** Load all setups from IndexedDB into the store */
  loadSetups: () => Promise<void>
  /** Save a new named setup; returns the created SavedSetup */
  saveSetup: (name: string, carId: string, mods: CarModifications) => Promise<SavedSetup>
  /** Delete a setup by ID */
  deleteSetup: (id: string) => Promise<void>
}

export const usePersistenceStore = create<PersistenceStore>(set => ({
  savedSetups: [],
  isLoading: false,
  error: null,

  loadSetups: async () => {
    set({ isLoading: true, error: null })
    try {
      const setups = await persistence.getAllSetups()
      set({ savedSetups: setups, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load setups',
      })
    }
  },

  saveSetup: async (name, carId, mods) => {
    const now = new Date().toISOString()
    const setup: SavedSetup = {
      id: uuidv4(),
      name,
      carId,
      modifications: mods,
      createdAt: now,
      updatedAt: now,
    }
    await persistence.putSetup(setup)
    set(state => ({ savedSetups: [...state.savedSetups, setup] }))
    return setup
  },

  deleteSetup: async (id) => {
    await persistence.removeSetup(id)
    set(state => ({ savedSetups: state.savedSetups.filter(s => s.id !== id) }))
  },
}))
