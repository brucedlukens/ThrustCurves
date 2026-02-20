import type { ComparisonEntry } from '@/hooks/useComparison'
import { fmtTime } from '@/utils/formatting'
import { useUnitStore } from '@/store/unitStore'
import { msToMph, msToKmh } from '@/utils/units'

interface ComparisonTableProps {
  entries: ComparisonEntry[]
}

interface MetricRow {
  label: string
  /** Raw numeric value for each entry (null = not available) */
  rawValues: (number | null)[]
  /** Whether lower is better (true = time, false = speed) */
  lowerIsBetter: boolean
  /** Formatter for display */
  format: (v: number) => string
  /** Unit suffix for delta */
  deltaUnit: string
}

export default function ComparisonTable({ entries }: ComparisonTableProps) {
  const units = useUnitStore(state => state.units)
  const fmtSpeed = (ms: number | undefined) => {
    if (ms === undefined) return '—'
    return units === 'imperial'
      ? `${msToMph(ms).toFixed(1)} mph`
      : `${msToKmh(ms).toFixed(1)} km/h`
  }
  const speedDeltaUnit = units === 'imperial' ? ' mph' : ' km/h'
  const toDisplaySpeed = (ms: number) =>
    units === 'imperial' ? msToMph(ms) : msToKmh(ms)

  if (entries.length === 0) return null

  const metrics: MetricRow[] = [
    {
      label: '0–60 mph',
      rawValues: entries.map(e => e.result.performance.zeroTo60Mph ?? null),
      lowerIsBetter: true,
      format: v => fmtTime(v),
      deltaUnit: 's',
    },
    {
      label: '0–100 km/h',
      rawValues: entries.map(e => e.result.performance.zeroTo100Kmh ?? null),
      lowerIsBetter: true,
      format: v => fmtTime(v),
      deltaUnit: 's',
    },
    {
      label: '¼ Mile',
      rawValues: entries.map(e => e.result.performance.quarterMileS ?? null),
      lowerIsBetter: true,
      format: v => fmtTime(v),
      deltaUnit: 's',
    },
    {
      label: '¼ Mile Trap',
      rawValues: entries.map(e =>
        e.result.performance.quarterMileSpeedMs != null
          ? toDisplaySpeed(e.result.performance.quarterMileSpeedMs)
          : null
      ),
      lowerIsBetter: false,
      format: v => fmtSpeed(units === 'imperial' ? v / msToMph(1) : v / msToKmh(1)),
      deltaUnit: speedDeltaUnit,
    },
    {
      label: 'Top Speed',
      rawValues: entries.map(e =>
        e.result.performance.topSpeedMs != null
          ? toDisplaySpeed(e.result.performance.topSpeedMs)
          : null
      ),
      lowerIsBetter: false,
      format: v => fmtSpeed(units === 'imperial' ? v / msToMph(1) : v / msToKmh(1)),
      deltaUnit: speedDeltaUnit,
    },
  ]

  return (
    <div className="rounded-xl border border-line overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-line bg-lift">
            <th className="text-left px-4 py-3 min-w-32">
              <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-txt">
                Metric
              </span>
            </th>
            {entries.map((entry, i) => (
              <th key={entry.setup.id} className="text-right px-4 py-3">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-display text-sm font-semibold text-gray-200 truncate max-w-32">
                    {entry.setup.name}
                  </span>
                  {i === 0 && (
                    <span className="font-display text-[9px] tracking-widest uppercase text-muted-txt">
                      base
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map(row => {
            // Find best index
            let bestIdx = 0
            let bestVal: number | null = null
            row.rawValues.forEach((v, i) => {
              if (v === null) return
              if (bestVal === null) { bestIdx = i; bestVal = v; return }
              if (row.lowerIsBetter ? v < bestVal : v > bestVal) {
                bestIdx = i; bestVal = v
              }
            })

            return (
              <tr key={row.label} className="border-b border-faint last:border-0 hover:bg-raised transition-colors">
                <td className="px-4 py-3">
                  <span className="font-display text-xs font-medium tracking-wider text-label">
                    {row.label}
                  </span>
                </td>
                {row.rawValues.map((val, i) => {
                  const base = row.rawValues[0]
                  const delta = (i > 0 && val !== null && base !== null)
                    ? val - base
                    : null

                  return (
                    <td key={i} className="px-4 py-3 text-right">
                      <div className="flex items-baseline justify-end gap-2">
                        <span className={`font-data text-base tabular-nums ${i === bestIdx ? 'text-data font-semibold' : 'text-gray-400'}`}>
                          {val !== null ? row.format(val) : '—'}
                        </span>
                        {i === bestIdx && entries.length > 1 && (
                          <span className="font-display text-[9px] tracking-widest uppercase text-signal-hi border border-signal/30 px-1 py-0.5 rounded bg-signal-dim">
                            best
                          </span>
                        )}
                        {delta !== null && (
                          <span
                            className={`font-data text-xs tabular-nums ${
                              (row.lowerIsBetter ? delta > 0 : delta < 0) ? 'text-signal-hi' : 'text-green-400'
                            }`}
                          >
                            {delta >= 0 ? '+' : ''}{delta.toFixed(2)}{row.deltaUnit}
                          </span>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
