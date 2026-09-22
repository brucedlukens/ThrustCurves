import { useEffect, useRef, useState } from 'react'
import { useCarStore } from '@/store/carStore'
import { useUnitStore } from '@/store/unitStore'
import { lbftToNm, nmToLbft } from '@/utils/units'
import type { CurvePoint } from '@/types/car'

const INPUT_CLS =
  'bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors'

interface TorqueCurveEditorProps {
  stockTorqueCurve: CurvePoint[]
}

/** A row as typed: torque is in the active display unit (Nm or lb·ft), never stored as-is. */
interface TorqueRow {
  key: number
  rpm: string
  torque: string
}

let rowKeyCounter = 0
function nextKey() { return ++rowKeyCounter }

/** Parse rows into a Nm curve; `imperial` rows are typed in lb·ft. */
function parseRows(rows: TorqueRow[], imperial: boolean): CurvePoint[] | undefined {
  const valid = rows
    .map(r => {
      const rpm = parseFloat(r.rpm)
      const t = parseFloat(r.torque)
      return [rpm, imperial ? lbftToNm(t) : t] as CurvePoint
    })
    .filter(([rpm, nm]) => !isNaN(rpm) && !isNaN(nm) && rpm > 0 && nm > 0)
    .sort((a, b) => a[0] - b[0])
  return valid.length >= 2 ? valid : undefined
}

/** Format a stored Nm value for display in the active unit. */
function displayTorque(nm: number, imperial: boolean): string {
  return (imperial ? nmToLbft(nm) : nm).toFixed(1)
}

export default function TorqueCurveEditor({ stockTorqueCurve }: TorqueCurveEditorProps) {
  const torqueMultiplier = useCarStore(state => state.modifications.torqueMultiplier)
  const customTorqueCurve = useCarStore(state => state.modifications.customTorqueCurve)
  const updateModifications = useCarStore(state => state.updateModifications)

  const units = useUnitStore(state => state.units)
  const imperial = units === 'imperial'
  const torqueUnit = imperial ? 'lb·ft' : 'Nm'

  const isCustom = customTorqueCurve !== undefined

  const [rows, setRows] = useState<TorqueRow[]>(() =>
    customTorqueCurve
      ? customTorqueCurve.map(([rpm, nm]) => ({
          key: nextKey(),
          rpm: String(rpm),
          torque: displayTorque(nm, imperial),
        }))
      : []
  )

  // When the unit toggle flips, re-express the typed torque values in the new unit
  const prevImperial = useRef(imperial)
  useEffect(() => {
    if (prevImperial.current === imperial) return
    const wasImperial = prevImperial.current
    prevImperial.current = imperial
    setRows(prev =>
      prev.map(r => {
        const t = parseFloat(r.torque)
        if (isNaN(t)) return r
        const nm = wasImperial ? lbftToNm(t) : t
        return { ...r, torque: displayTorque(nm, imperial) }
      }),
    )
  }, [imperial])

  const handleEnableCustom = () => {
    const initialRows = stockTorqueCurve.map(([rpm, nm]) => ({
      key: nextKey(),
      rpm: String(rpm),
      torque: displayTorque(nm, imperial),
    }))
    setRows(initialRows)
    // Seed the store with the exact stock curve; the rows are a rounded display of it
    updateModifications({ customTorqueCurve: stockTorqueCurve })
  }

  const handleDisableCustom = () => {
    setRows([])
    updateModifications({ customTorqueCurve: undefined })
  }

  const handleRowChange = (index: number, field: 'rpm' | 'torque', value: string) => {
    const updated = rows.map((r, i) => i === index ? { ...r, [field]: value } : r)
    setRows(updated)
    const parsed = parseRows(updated, imperial)
    if (parsed) updateModifications({ customTorqueCurve: parsed })
  }

  const handleAddRow = () => {
    const lastRpm = rows.length > 0 ? parseFloat(rows[rows.length - 1].rpm) : 1000
    const newRpm = isNaN(lastRpm) ? 1000 : lastRpm + 500
    setRows(prev => [...prev, { key: nextKey(), rpm: String(newRpm), torque: '' }])
  }

  const handleRemoveRow = (index: number) => {
    const updated = rows.filter((_, i) => i !== index)
    setRows(updated)
    const parsed = parseRows(updated, imperial)
    updateModifications({ customTorqueCurve: parsed })
  }

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateModifications({ torqueMultiplier: parseFloat(parseFloat(e.target.value).toFixed(2)) })
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    if (!isNaN(val) && val > 0 && val <= 3) {
      updateModifications({ torqueMultiplier: parseFloat(val.toFixed(2)) })
    }
  }

  const pct = ((torqueMultiplier - 1) * 100).toFixed(0)
  const pctLabel = torqueMultiplier >= 1 ? `+${pct}%` : `${pct}%`

  return (
    <div className="flex flex-col gap-4">
      {/* Multiplier */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
            Torque Multiplier
          </label>
          <span className={`font-data text-sm font-semibold ${torqueMultiplier !== 1 ? 'text-signal-hi' : 'text-label'}`}>
            {pctLabel}
          </span>
        </div>
        <input
          type="range"
          min={0.5}
          max={2.0}
          step={0.01}
          value={torqueMultiplier}
          onChange={handleSlider}
          className="w-full"
          aria-label="Torque multiplier slider"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={torqueMultiplier}
            onChange={handleInput}
            min={0.5}
            max={2.0}
            step={0.01}
            className={`${INPUT_CLS} flex-1`}
            aria-label="Torque multiplier"
          />
          <span className="font-data text-xs text-label shrink-0">× stock</span>
        </div>
      </div>

      {/* Custom curve */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-display text-[10px] font-semibold tracking-widest uppercase text-muted-txt">
            Custom Torque Curve
          </label>
          {isCustom ? (
            <button
              onClick={handleDisableCustom}
              className="text-xs text-muted-txt hover:text-gray-300 underline underline-offset-2 transition-colors"
            >
              Use stock
            </button>
          ) : (
            <button
              onClick={handleEnableCustom}
              className="text-xs text-signal-hi hover:text-signal underline underline-offset-2 transition-colors"
            >
              Enter custom
            </button>
          )}
        </div>

        {isCustom && (
          <div className="flex flex-col gap-2">
            <div className="max-h-48 overflow-y-auto rounded border border-line">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-lift">
                  <tr className="border-b border-line">
                    <th className="text-left px-2 py-1.5 font-display font-semibold tracking-wider uppercase text-muted-txt text-[10px]">RPM</th>
                    <th className="text-left px-2 py-1.5 font-display font-semibold tracking-wider uppercase text-muted-txt text-[10px]">{torqueUnit}</th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.key} className="border-b border-faint last:border-0">
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={row.rpm}
                          onChange={e => handleRowChange(i, 'rpm', e.target.value)}
                          min={0}
                          max={20000}
                          step={100}
                          className={`${INPUT_CLS} w-full py-1`}
                          aria-label={`Row ${i + 1} RPM`}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={row.torque}
                          onChange={e => handleRowChange(i, 'torque', e.target.value)}
                          min={0}
                          max={5000}
                          step={1}
                          className={`${INPUT_CLS} w-full py-1`}
                          aria-label={`Row ${i + 1} torque (${torqueUnit})`}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <button
                          onClick={() => handleRemoveRow(i)}
                          className="text-muted-txt hover:text-signal-hi transition-colors text-xs"
                          aria-label={`Remove row ${i + 1}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleAddRow}
              className="text-xs text-signal-hi hover:text-signal self-start transition-colors"
            >
              + Add row
            </button>
            <p className="font-data text-[10px] text-muted-txt">
              Torque in {torqueUnit} (follows the unit toggle). Minimum 2 valid rows. Sorted by RPM automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
