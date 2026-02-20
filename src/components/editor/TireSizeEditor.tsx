import { useCarStore } from '@/store/carStore'
import type { TireSize } from '@/types/car'

const INPUT_CLS =
  'w-full bg-[--color-surface-2] border border-[--color-border] rounded px-2 py-1.5 text-sm ' +
  'text-[--color-text-1] focus:outline-none focus:ring-1 focus:ring-amber-500/50 ' +
  'focus:border-[--color-border-2]'

const MONO_STYLE = { fontFamily: 'var(--font-mono)' }
const LABEL_STYLE = { fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }

interface TireSizeEditorProps {
  stockTireSize: TireSize
}

/** Outer tire diameter in inches: rim + 2 sidewalls (sidewall = width × aspect / 100 mm → in) */
function outerDiameterIn(widthMm: number, aspectRatio: number, rimDiameterIn: number): number {
  return rimDiameterIn + 2 * (widthMm * (aspectRatio / 100)) / 25.4
}

export default function TireSizeEditor({ stockTireSize }: TireSizeEditorProps) {
  const tireSizeOverride = useCarStore(state => state.modifications.tireSizeOverride)
  const updateModifications = useCarStore(state => state.updateModifications)

  const effective: TireSize = {
    widthMm: tireSizeOverride?.widthMm ?? stockTireSize.widthMm,
    aspectRatio: tireSizeOverride?.aspectRatio ?? stockTireSize.aspectRatio,
    rimDiameterIn: tireSizeOverride?.rimDiameterIn ?? stockTireSize.rimDiameterIn,
  }

  const handleChange = (field: keyof TireSize, rawValue: string) => {
    const val = parseFloat(rawValue)
    if (rawValue === '' || isNaN(val) || val <= 0) {
      const next: TireSize = { ...effective, [field]: stockTireSize[field] }
      const matchesStock =
        next.widthMm === stockTireSize.widthMm &&
        next.aspectRatio === stockTireSize.aspectRatio &&
        next.rimDiameterIn === stockTireSize.rimDiameterIn
      updateModifications({ tireSizeOverride: matchesStock ? undefined : next })
      return
    }

    const next: TireSize = { ...effective, [field]: val }
    const matchesStock =
      next.widthMm === stockTireSize.widthMm &&
      next.aspectRatio === stockTireSize.aspectRatio &&
      next.rimDiameterIn === stockTireSize.rimDiameterIn
    updateModifications({ tireSizeOverride: matchesStock ? undefined : next })
  }

  const diam = outerDiameterIn(effective.widthMm, effective.aspectRatio, effective.rimDiameterIn)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest" style={LABEL_STYLE}>
            Width (mm)
          </label>
          <input
            type="number"
            value={effective.widthMm}
            onChange={e => handleChange('widthMm', e.target.value)}
            min={100}
            max={400}
            step={5}
            className={INPUT_CLS}
            style={MONO_STYLE}
            aria-label="Tire width in millimeters"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest" style={LABEL_STYLE}>
            Aspect (%)
          </label>
          <input
            type="number"
            value={effective.aspectRatio}
            onChange={e => handleChange('aspectRatio', e.target.value)}
            min={20}
            max={80}
            step={5}
            className={INPUT_CLS}
            style={MONO_STYLE}
            aria-label="Tire aspect ratio"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest" style={LABEL_STYLE}>
            Rim (in)
          </label>
          <input
            type="number"
            value={effective.rimDiameterIn}
            onChange={e => handleChange('rimDiameterIn', e.target.value)}
            min={10}
            max={26}
            step={1}
            className={INPUT_CLS}
            style={MONO_STYLE}
            aria-label="Rim diameter in inches"
          />
        </div>
      </div>
      <p className="text-xs" style={{ color: 'var(--color-text-3)' }}>
        Outer diameter:{' '}
        <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
          {diam.toFixed(2)} in
        </span>
        {' '}({(diam * 25.4).toFixed(0)} mm)
      </p>
    </div>
  )
}
