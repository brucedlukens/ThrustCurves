import { useCarStore } from '@/store/carStore'

const INPUT_CLS =
  'w-full bg-[--color-surface-2] border border-[--color-border] rounded px-2 py-1.5 text-sm ' +
  'text-[--color-text-1] focus:outline-none focus:ring-1 focus:ring-amber-500/50 ' +
  'focus:border-[--color-border-2]'

const MONO_STYLE = { fontFamily: 'var(--font-mono)' }
const LABEL_STYLE = { fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }

interface GearRatioEditorProps {
  stockGearRatios: number[]
  stockFinalDrive: number
  stockShiftTimeMs: number
}

export default function GearRatioEditor({
  stockGearRatios,
  stockFinalDrive,
  stockShiftTimeMs,
}: GearRatioEditorProps) {
  const gearRatioOverrides = useCarStore(state => state.modifications.gearRatioOverrides)
  const finalDriveOverride = useCarStore(state => state.modifications.finalDriveOverride)
  const shiftTimeOverride = useCarStore(state => state.modifications.shiftTimeOverride)
  const updateModifications = useCarStore(state => state.updateModifications)

  const handleGearChange = (gearIndex: number, rawValue: string) => {
    const val = parseFloat(rawValue)
    const newOverrides = [...gearRatioOverrides]
    while (newOverrides.length <= gearIndex) newOverrides.push(undefined)
    newOverrides[gearIndex] = rawValue === '' || isNaN(val) || val <= 0 ? undefined : val
    updateModifications({ gearRatioOverrides: newOverrides })
  }

  const handleFinalDriveChange = (rawValue: string) => {
    const val = parseFloat(rawValue)
    updateModifications({
      finalDriveOverride: rawValue === '' || isNaN(val) || val <= 0 ? undefined : val,
    })
  }

  const handleShiftTimeChange = (rawValue: string) => {
    const val = parseFloat(rawValue)
    updateModifications({
      shiftTimeOverride: rawValue === '' || isNaN(val) || val <= 0 ? undefined : val,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {stockGearRatios.map((stockRatio, i) => (
          <div key={i} className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest" style={LABEL_STYLE}>
              Gear {i + 1}
            </label>
            <input
              type="number"
              value={gearRatioOverrides[i] ?? stockRatio}
              onChange={e => handleGearChange(i, e.target.value)}
              min={0.1}
              max={10}
              step={0.001}
              className={INPUT_CLS}
              style={MONO_STYLE}
              aria-label={`Gear ${i + 1} ratio`}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest" style={LABEL_STYLE}>
            Final Drive
          </label>
          <input
            type="number"
            value={finalDriveOverride ?? stockFinalDrive}
            onChange={e => handleFinalDriveChange(e.target.value)}
            min={0.1}
            max={10}
            step={0.001}
            className={INPUT_CLS}
            style={MONO_STYLE}
            aria-label="Final drive ratio"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest" style={LABEL_STYLE}>
            Shift Time
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={shiftTimeOverride ?? stockShiftTimeMs}
              onChange={e => handleShiftTimeChange(e.target.value)}
              min={0}
              max={2000}
              step={10}
              className={INPUT_CLS}
              style={MONO_STYLE}
              aria-label="Shift time in milliseconds"
            />
            <span className="text-xs shrink-0" style={{ color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>ms</span>
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--color-text-3)' }}>
        Clear any field to revert to stock value
      </p>
    </div>
  )
}
