import { useCarStore } from '@/store/carStore'
import type { TireSize } from '@/types/car'

const INPUT_CLS =
  'w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-100 ' +
  'focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-500'

interface TireSizeEditorProps {
  stockTireSize: TireSize
}

export default function TireSizeEditor({ stockTireSize }: TireSizeEditorProps) {
  const tireSizeOverride = useCarStore(state => state.modifications.tireSizeOverride)
  const updateModifications = useCarStore(state => state.updateModifications)

  const current = tireSizeOverride ?? {}

  const update = (field: keyof TireSize, rawValue: string) => {
    const val = parseFloat(rawValue)
    if (rawValue === '' || isNaN(val) || val <= 0) {
      // Clear this field; if all fields become empty, clear the whole override
      const next = { ...tireSizeOverride }
      delete next[field]
      const hasAny = Object.keys(next).length > 0
      updateModifications({ tireSizeOverride: hasAny ? (next as TireSize) : undefined })
    } else {
      const base: TireSize = tireSizeOverride ?? {
        widthMm: stockTireSize.widthMm,
        aspectRatio: stockTireSize.aspectRatio,
        rimDiameterIn: stockTireSize.rimDiameterIn,
      }
      updateModifications({ tireSizeOverride: { ...base, [field]: val } })
    }
  }

  // Effective tire string label
  const w = (current as Partial<TireSize>).widthMm ?? stockTireSize.widthMm
  const a = (current as Partial<TireSize>).aspectRatio ?? stockTireSize.aspectRatio
  const r = (current as Partial<TireSize>).rimDiameterIn ?? stockTireSize.rimDiameterIn

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Width (mm)</label>
          <input
            type="number"
            value={(tireSizeOverride as Partial<TireSize> | undefined)?.widthMm ?? ''}
            onChange={e => update('widthMm', e.target.value)}
            placeholder={String(stockTireSize.widthMm)}
            min={100}
            max={400}
            step={5}
            className={INPUT_CLS}
            aria-label="Tire width in millimeters"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Aspect (%)</label>
          <input
            type="number"
            value={(tireSizeOverride as Partial<TireSize> | undefined)?.aspectRatio ?? ''}
            onChange={e => update('aspectRatio', e.target.value)}
            placeholder={String(stockTireSize.aspectRatio)}
            min={20}
            max={80}
            step={5}
            className={INPUT_CLS}
            aria-label="Tire aspect ratio"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Rim (in)</label>
          <input
            type="number"
            value={(tireSizeOverride as Partial<TireSize> | undefined)?.rimDiameterIn ?? ''}
            onChange={e => update('rimDiameterIn', e.target.value)}
            placeholder={String(stockTireSize.rimDiameterIn)}
            min={10}
            max={26}
            step={1}
            className={INPUT_CLS}
            aria-label="Rim diameter in inches"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Effective: {w}/{a}R{r}
      </p>
    </div>
  )
}
