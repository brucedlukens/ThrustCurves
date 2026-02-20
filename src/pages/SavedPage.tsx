import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersistenceStore } from '@/store/persistenceStore'
import { useCarStore } from '@/store/carStore'
import SavedConfigsList from '@/components/saved/SavedConfigsList'
import type { SavedSetup } from '@/types/config'

export default function SavedPage() {
  const navigate = useNavigate()
  const { savedSetups, isLoading, error, loadSetups, deleteSetup } = usePersistenceStore()
  const cars = useCarStore(state => state.cars)
  const selectCar = useCarStore(state => state.selectCar)
  const updateModifications = useCarStore(state => state.updateModifications)

  useEffect(() => {
    loadSetups()
  }, [loadSetups])

  const handleLoad = (setup: SavedSetup) => {
    selectCar(setup.carId)
    updateModifications(setup.modifications)
    navigate('/simulator')
  }

  const handleDelete = async (id: string) => {
    await deleteSetup(id)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-semibold text-gray-100">Saved Configurations</h2>
        <p className="text-gray-400 mt-1 text-sm">
          Load a saved setup into the simulator, or delete configurations you no longer need.
        </p>
      </div>

      {isLoading && (
        <p className="text-gray-500 text-sm">Loading…</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-700 bg-red-900/20 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!isLoading && (
        <SavedConfigsList
          setups={savedSetups}
          cars={cars}
          onLoad={handleLoad}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
