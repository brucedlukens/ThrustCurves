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
    <div className="flex flex-col gap-6 max-w-3xl p-6">
      <div>
        <h1
          className="font-display text-2xl font-bold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Saved Configurations
        </h1>
        <p
          className="font-ui text-sm mt-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          Load a saved setup into the simulator, or delete configurations you no longer need.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p className="font-ui text-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading…
          </p>
        </div>
      )}

      {error && (
        <div
          className="rounded-lg p-4 font-ui text-sm"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--danger)',
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
