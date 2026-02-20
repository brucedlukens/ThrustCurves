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
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight uppercase text-gray-100">
          Saved Configurations
        </h1>
        <p className="font-data text-sm text-muted-txt mt-1.5">
          Load a saved setup into the simulator, or delete configurations you no longer need.
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-signal/40 to-transparent" />
      </div>

      {isLoading && (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
          <span className="font-data text-sm text-muted-txt">Loading…</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-signal/40 bg-signal-dim p-4">
          <p className="font-data text-sm text-signal-hi">{error}</p>
        </div>
      )}

      {!isLoading && (
        <>
          {savedSetups.length > 0 && (
            <div className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
              {savedSetups.length} saved setup{savedSetups.length !== 1 ? 's' : ''}
            </div>
          )}
          <SavedConfigsList
            setups={savedSetups}
            cars={cars}
            onLoad={handleLoad}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  )
}
