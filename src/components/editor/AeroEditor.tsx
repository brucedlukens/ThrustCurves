import { useCarStore } from '@/store/carStore'

const INPUT_CLS =
  'w-full bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors'

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
      <div className="flex flex-col gap-0.5">
        <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
          Drag Coefficient (Cd)
        </label>
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
      <div className="flex flex-col gap-0.5">
        <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
          Frontal Area (m²)
        </label>
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
      <p className="font-data text-[10px] text-muted-txt">Clear field to revert to stock</p>
    </div>
  )
}
