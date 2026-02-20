import { useState } from 'react'
import { useCarStore } from '@/store/carStore'
import type { CurvePoint } from '@/types/car'

const INPUT_CLS =
  'bg-[--color-surface-2] border border-[--color-border] rounded px-2 py-1.5 text-sm ' +
  'text-[--color-text-1] focus:outline-none focus:ring-1 focus:ring-amber-500/50 ' +
  'focus:border-[--color-border-2] placeholder:text-[--color-text-3]'

const MONO_STYLE = { fontFamily: 'var(--font-mono)' }

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
        <label
          className="text-[10px] uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
        >
          Torque Multiplier
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.01}
            value={torqueMultiplier}
            onChange={handleSlider}
            className="flex-1"
            style={{ accentColor: 'var(--color-accent)' }}
            aria-label="Torque multiplier slider"
          />
          <span
            className="text-base w-14 text-right"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}
          >
            {pctLabel}
          </span>
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
            style={MONO_STYLE}
            aria-label="Torque multiplier"
          />
          <span className="text-sm shrink-0" style={{ color: 'var(--color-text-2)' }}>× stock</span>
        </div>
        {isCustom && (
          <p className="text-xs" style={{ color: 'var(--color-text-3)' }}>
            Multiplier also applies to custom curve
          </p>
        )}
      </div>

      {/* Custom curve section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            className="text-[10px] uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
          >
            Custom Torque Curve
          </label>
          {isCustom ? (
            <button
              onClick={handleDisableCustom}
              className="text-xs underline"
              style={{ color: 'var(--color-text-3)' }}
            >
              Use stock curve
            </button>
          ) : (
            <button
              onClick={handleEnableCustom}
              className="text-xs underline"
              style={{ color: 'var(--color-accent)' }}
            >
              Enter custom values
            </button>
          )}
        </div>

        {isCustom && (
          <div className="flex flex-col gap-2">
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead
                  className="sticky top-0"
                  style={{ backgroundColor: 'var(--color-surface-2)' }}
                >
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th
                      className="text-left px-1 py-1 font-medium uppercase tracking-wider text-[10px]"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
                    >
                      RPM
                    </th>
                    <th
                      className="text-left px-1 py-1 font-medium uppercase tracking-wider text-[10px]"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
                    >
                      Torque (Nm)
                    </th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.key} style={{ borderBottom: '1px solid rgba(42,42,56,0.4)' }}>
                      <td className="px-1 py-0.5">
                        <input
                          type="number"
                          value={row.rpm}
                          onChange={e => handleRowChange(i, 'rpm', e.target.value)}
                          min={0}
                          max={20000}
                          step={100}
                          className={`${INPUT_CLS} w-full`}
                          style={MONO_STYLE}
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
                          style={MONO_STYLE}
                          aria-label={`Row ${i + 1} torque`}
                        />
                      </td>
                      <td className="px-1 py-0.5">
                        <button
                          onClick={() => handleRemoveRow(i)}
                          className="text-xs leading-none hover:text-red-400 transition-colors"
                          style={{ color: 'var(--color-text-3)' }}
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
              className="text-xs self-start"
              style={{ color: 'var(--color-accent)' }}
            >
              + Add row
            </button>
            <p className="text-xs" style={{ color: 'var(--color-text-3)' }}>
              Minimum 2 valid rows required. Sorted by RPM automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
