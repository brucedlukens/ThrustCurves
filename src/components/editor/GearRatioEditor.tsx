import { useCarStore } from '@/store/carStore'

const INPUT_CLS =
  'w-full bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors'

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
      {/* Gear ratios grid */}
      <div>
        <p className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt mb-1.5">
          Gear Ratios
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {stockGearRatios.map((stockRatio, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <label className="font-display text-[9px] font-medium tracking-wider uppercase text-muted-txt">
                G{i + 1}
              </label>
              <input
                type="number"
                value={gearRatioOverrides[i] ?? stockRatio}
                onChange={e => handleGearChange(i, e.target.value)}
                min={0.1}
                max={10}
                step={0.001}
                className={INPUT_CLS}
                aria-label={`Gear ${i + 1} ratio`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Final drive + shift time */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5">
          <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
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
            aria-label="Final drive ratio"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
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
              aria-label="Shift time in milliseconds"
            />
            <span className="font-data text-[11px] text-muted-txt shrink-0">ms</span>
          </div>
        </div>
      </div>

      <p className="font-data text-[10px] text-muted-txt">Clear field to revert to stock</p>
    </div>
  )
}
