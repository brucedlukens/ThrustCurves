import { TRUCKS, findTruck, findPowertrain } from '@/data/trucks'
import { useUnitStore } from '@/store/unitStore'
import { kgToLb, lbToKg } from '@/utils/units'
import type { TowTruckState } from './entry'
import { TOWING_COLORS } from './entry'
import { fmtMass } from './format'

interface TruckPickerProps {
  selections: TowTruckState[]
  onAdd: (truckId: string) => void
  onUpdate: (key: string, patch: Partial<TowTruckState>) => void
  onRemove: (key: string) => void
}

const SELECT_CLASS =
  'w-full px-2.5 py-1.5 rounded-lg border border-line bg-lift font-data text-xs text-data focus:outline-none focus:border-signal/60 transition-colors'

export default function TruckPicker({ selections, onAdd, onUpdate, onRemove }: TruckPickerProps) {
  const units = useUnitStore(state => state.units)
  const imperial = units === 'imperial'

  return (
    <div className="flex flex-col gap-3">
      <select
        value=""
        aria-label="Add a truck"
        onChange={e => {
          if (e.target.value) onAdd(e.target.value)
        }}
        className={SELECT_CLASS}
      >
        <option value="">+ Add a truck…</option>
        {TRUCKS.map(t => (
          <option key={t.id} value={t.id}>
            {t.make} {t.model} ({t.generation})
          </option>
        ))}
      </select>

      {selections.map((sel, i) => {
        const truck = findTruck(sel.truckId)
        const powertrain = truck ? findPowertrain(truck, sel.powertrainId) : undefined
        if (!truck || !powertrain) return null
        const color = TOWING_COLORS[i % TOWING_COLORS.length]
        const weightKg = sel.weightOverrideKg ?? powertrain.curbWeightKg

        return (
          <div key={sel.key} className="rounded-xl border border-line bg-panel p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="font-display text-sm font-semibold text-gray-100 truncate">
                  {truck.make} {truck.model}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(sel.key)}
                aria-label={`Remove ${truck.model}`}
                className="p-1 rounded hover:bg-raised text-muted-txt hover:text-gray-200 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-display text-[9px] font-semibold tracking-[0.15em] uppercase text-muted-txt">
                Engine
              </label>
              <select
                value={sel.powertrainId}
                aria-label={`${truck.model} engine`}
                onChange={e => onUpdate(sel.key, { powertrainId: e.target.value })}
                className={SELECT_CLASS}
              >
                {truck.powertrains.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.engineName} ({p.transmission.gearRatios.length}-spd)
                  </option>
                ))}
              </select>
              {powertrain.notes && (
                <p className="font-data text-[10px] text-muted-txt leading-snug">{powertrain.notes}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="font-display text-[9px] font-semibold tracking-[0.15em] uppercase text-muted-txt">
                  Axle ratio
                </label>
                <select
                  value={sel.axleRatio}
                  aria-label={`${truck.model} axle ratio`}
                  onChange={e => onUpdate(sel.key, { axleRatio: Number(e.target.value) })}
                  className={SELECT_CLASS}
                >
                  {powertrain.axleRatios.map(r => (
                    <option key={r} value={r}>
                      {r.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-display text-[9px] font-semibold tracking-[0.15em] uppercase text-muted-txt">
                  Weight ({imperial ? 'lb' : 'kg'})
                </label>
                <input
                  type="number"
                  min={0}
                  step={imperial ? 50 : 25}
                  value={Math.round(imperial ? kgToLb(weightKg) : weightKg)}
                  onChange={e => {
                    const v = Math.max(0, Number(e.target.value))
                    onUpdate(sel.key, { weightOverrideKg: imperial ? lbToKg(v) : v })
                  }}
                  className={`${SELECT_CLASS} text-right tabular-nums`}
                />
              </div>
            </div>

            {sel.weightOverrideKg !== undefined && (
              <button
                type="button"
                onClick={() => onUpdate(sel.key, { weightOverrideKg: undefined })}
                className="self-start font-data text-[10px] text-muted-txt hover:text-gray-300 underline underline-offset-2 transition-colors"
              >
                Reset to stock ({fmtMass(powertrain.curbWeightKg, units)}, crew cab 4x4)
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
