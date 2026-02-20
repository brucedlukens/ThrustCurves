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
        <h2
          className="text-2xl font-bold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-1)' }}
        >
          Saved Configurations
        </h2>
        <p
          className="mt-1 text-sm"
          style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-2)' }}
        >
          Load a saved setup into the simulator, or delete configurations you no longer need.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm" style={{ color: 'var(--color-text-3)' }}>Loading…</p>
      )}

      {error && (
        <div
          className="rounded-lg p-4 text-sm"
          style={{
            border: '1px solid var(--color-danger)',
            backgroundColor: 'rgba(239,68,68,0.1)',
            color: 'var(--color-danger)',
          }}
        >
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
