import { useCarStore } from '@/store/carStore'

const INPUT_CLS =
  'w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-100 ' +
  'focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-500'

interface GearRatioEditorProps {
  /** Stock gear ratios array */
  stockGearRatios: number[]
  /** Stock final drive ratio */
  stockFinalDrive: number
}

export default function GearRatioEditor({ stockGearRatios, stockFinalDrive }: GearRatioEditorProps) {
  const gearRatioOverrides = useCarStore(state => state.modifications.gearRatioOverrides)
  const finalDriveOverride = useCarStore(state => state.modifications.finalDriveOverride)
  const updateModifications = useCarStore(state => state.updateModifications)

  const handleGearChange = (gearIndex: number, rawValue: string) => {
    const val = parseFloat(rawValue)
    const newOverrides = [...gearRatioOverrides]
    // Pad array if needed
    while (newOverrides.length <= gearIndex) {
      newOverrides.push(undefined)
    }
    newOverrides[gearIndex] = rawValue === '' || isNaN(val) || val <= 0 ? undefined : val
    updateModifications({ gearRatioOverrides: newOverrides })
  }

  const handleFinalDriveChange = (rawValue: string) => {
    const val = parseFloat(rawValue)
    updateModifications({
      finalDriveOverride: rawValue === '' || isNaN(val) || val <= 0 ? undefined : val,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {stockGearRatios.map((stockRatio, i) => (
          <div key={i} className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Gear {i + 1}</label>
            <input
              type="number"
              value={gearRatioOverrides[i] ?? ''}
              onChange={e => handleGearChange(i, e.target.value)}
              placeholder={stockRatio.toFixed(3)}
              min={0.1}
              max={10}
              step={0.001}
              className={INPUT_CLS}
              aria-label={`Gear ${i + 1} ratio`}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Final Drive</label>
        <input
          type="number"
          value={finalDriveOverride ?? ''}
          onChange={e => handleFinalDriveChange(e.target.value)}
          placeholder={stockFinalDrive.toFixed(3)}
          min={0.1}
          max={10}
          step={0.001}
          className={INPUT_CLS}
          aria-label="Final drive ratio"
        />
      </div>
      <p className="text-xs text-gray-500">Leave blank to use stock ratios</p>
    </div>
  )
}
