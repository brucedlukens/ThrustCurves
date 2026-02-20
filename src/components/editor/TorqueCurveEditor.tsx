import { useState } from 'react'
import { useCarStore } from '@/store/carStore'
import type { CurvePoint } from '@/types/car'

const INPUT_CLS =
  'bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-100 ' +
  'focus:outline-none focus:ring-1 focus:ring-indigo-500'

interface TorqueCurveEditorProps {
  stockTorqueCurve: CurvePoint[]
}

interface TorqueRow {
  key: number
  rpm: string
  torqueNm: string
}

let rowKeyCounter = 0
function nextKey() { return ++rowKeyCounter }

function parseRows(rows: TorqueRow[]): CurvePoint[] | undefined {
  const valid = rows
    .map(r => [parseFloat(r.rpm), parseFloat(r.torqueNm)] as CurvePoint)
    .filter(([rpm, nm]) => !isNaN(rpm) && !isNaN(nm) && rpm > 0 && nm > 0)
    .sort((a, b) => a[0] - b[0])
  return valid.length >= 2 ? valid : undefined
}

export default function TorqueCurveEditor({ stockTorqueCurve }: TorqueCurveEditorProps) {
  const torqueMultiplier = useCarStore(state => state.modifications.torqueMultiplier)
  const customTorqueCurve = useCarStore(state => state.modifications.customTorqueCurve)
  const updateModifications = useCarStore(state => state.updateModifications)

  const isCustom = customTorqueCurve !== undefined

  // Lazy initializer: populate rows from store at mount time (handles loading saved setups)
  const [rows, setRows] = useState<TorqueRow[]>(() =>
    customTorqueCurve
      ? customTorqueCurve.map(([rpm, nm]) => ({
          key: nextKey(),
          rpm: String(rpm),
          torqueNm: String(nm),
        }))
      : []
  )

  const handleEnableCustom = () => {
    const initialRows = stockTorqueCurve.map(([rpm, nm]) => ({
      key: nextKey(),
      rpm: String(rpm),
      torqueNm: nm.toFixed(1),
    }))
    setRows(initialRows)
    const parsed = parseRows(initialRows)
    updateModifications({ customTorqueCurve: parsed ?? stockTorqueCurve })
  }

  const handleDisableCustom = () => {
    setRows([])
    updateModifications({ customTorqueCurve: undefined })
  }

  const handleRowChange = (index: number, field: 'rpm' | 'torqueNm', value: string) => {
    const updated = rows.map((r, i) => i === index ? { ...r, [field]: value } : r)
    setRows(updated)
    const parsed = parseRows(updated)
    if (parsed) updateModifications({ customTorqueCurve: parsed })
  }

  const handleAddRow = () => {
    const lastRpm = rows.length > 0 ? parseFloat(rows[rows.length - 1].rpm) : 1000
    const newRpm = isNaN(lastRpm) ? 1000 : lastRpm + 500
    setRows(prev => [...prev, { key: nextKey(), rpm: String(newRpm), torqueNm: '' }])
  }

  const handleRemoveRow = (index: number) => {
    const updated = rows.filter((_, i) => i !== index)
    setRows(updated)
    const parsed = parseRows(updated)
    updateModifications({ customTorqueCurve: parsed })
  }

  // --- Multiplier handlers ---
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
      {/* Multiplier section */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Torque Multiplier</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.01}
            value={torqueMultiplier}
            onChange={handleSlider}
            className="flex-1 accent-indigo-500"
            aria-label="Torque multiplier slider"
          />
          <span className="text-sm text-indigo-400 w-12 text-right">{pctLabel}</span>
        </div>
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
          <span className="text-gray-400 text-sm shrink-0">× stock</span>
        </div>
        {isCustom && (
          <p className="text-xs text-gray-500">Multiplier also applies to custom curve</p>
        )}
      </div>

      {/* Custom curve section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500">Custom Torque Curve</label>
          {isCustom ? (
            <button
              onClick={handleDisableCustom}
              className="text-xs text-gray-500 hover:text-gray-300 underline"
            >
              Use stock curve
            </button>
          ) : (
            <button
              onClick={handleEnableCustom}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Enter custom values
            </button>
          )}
        </div>

        {isCustom && (
          <div className="flex flex-col gap-2">
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-800">
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-1 py-1 text-gray-500 font-medium">RPM</th>
                    <th className="text-left px-1 py-1 text-gray-500 font-medium">Torque (Nm)</th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.key} className="border-b border-gray-700/40">
                      <td className="px-1 py-0.5">
                        <input
                          type="number"
                          value={row.rpm}
                          onChange={e => handleRowChange(i, 'rpm', e.target.value)}
                          min={0}
                          max={20000}
                          step={100}
                          className={`${INPUT_CLS} w-full`}
                          aria-label={`Row ${i + 1} RPM`}
                        />
                      </td>
                      <td className="px-1 py-0.5">
                        <input
                          type="number"
                          value={row.torqueNm}
                          onChange={e => handleRowChange(i, 'torqueNm', e.target.value)}
                          min={0}
                          max={5000}
                          step={1}
                          className={`${INPUT_CLS} w-full`}
                          aria-label={`Row ${i + 1} torque`}
                        />
                      </td>
                      <td className="px-1 py-0.5">
                        <button
                          onClick={() => handleRemoveRow(i)}
                          className="text-gray-600 hover:text-red-400 text-xs leading-none"
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
              className="text-xs text-indigo-400 hover:text-indigo-300 self-start"
            >
              + Add row
            </button>
            <p className="text-xs text-gray-600">
              Minimum 2 valid rows required. Sorted by RPM automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
