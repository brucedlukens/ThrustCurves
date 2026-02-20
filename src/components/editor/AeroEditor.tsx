import { useCarStore } from '@/store/carStore'

const INPUT_CLS =
  'w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-100 ' +
  'focus:outline-none focus:ring-1 focus:ring-indigo-500'

interface AeroEditorProps {
  stockCd: number
  stockFrontalAreaM2: number
}

export default function AeroEditor({ stockCd, stockFrontalAreaM2 }: AeroEditorProps) {
  const cdOverride = useCarStore(state => state.modifications.cdOverride)
  const frontalAreaOverride = useCarStore(state => state.modifications.frontalAreaOverride)
  const updateModifications = useCarStore(state => state.updateModifications)

  const handleCdChange = (rawValue: string) => {
    const val = parseFloat(rawValue)
    updateModifications({
      cdOverride: rawValue === '' || isNaN(val) || val <= 0 ? undefined : val,
    })
  }

  const handleFrontalAreaChange = (rawValue: string) => {
    const val = parseFloat(rawValue)
    updateModifications({
      frontalAreaOverride: rawValue === '' || isNaN(val) || val <= 0 ? undefined : val,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Drag Coefficient (Cd)</label>
        <input
          type="number"
          value={cdOverride ?? stockCd}
          onChange={e => handleCdChange(e.target.value)}
          min={0.1}
          max={2.0}
          step={0.01}
          className={INPUT_CLS}
          aria-label="Drag coefficient"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Frontal Area (m²)</label>
        <input
          type="number"
          value={frontalAreaOverride ?? stockFrontalAreaM2}
          onChange={e => handleFrontalAreaChange(e.target.value)}
          min={0.5}
          max={6.0}
          step={0.01}
          className={INPUT_CLS}
          aria-label="Frontal area in square meters"
        />
      </div>
      <p className="text-xs text-gray-500">Clear any field to revert to stock value</p>
    </div>
  )
}
