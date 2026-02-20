import type { ComparisonEntry } from '@/hooks/useComparison'
import { fmtTime, fmtSpeed } from '@/utils/formatting'

interface ComparisonTableProps {
  entries: ComparisonEntry[]
}

interface MetricRow {
  label: string
  values: string[]
  deltas: (string | null)[]
  /** Index of best (lowest for time, highest for speed) */
  bestIndex: number
}

function parseSeconds(s: string): number | null {
  const m = s.match(/^([\d.]+)s$/)
  return m ? parseFloat(m[1]) : null
}

function parseMph(s: string): number | null {
  const m = s.match(/^([\d.]+) mph$/)
  return m ? parseFloat(m[1]) : null
}

function calcDelta(
  values: string[],
  i: number,
  parser: (s: string) => number | null,
  unit: string,
): string | null {
  if (i === 0) return null
  const base = parser(values[0])
  const cur = parser(values[i])
  if (base === null || cur === null) return null
  const diff = cur - base
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(2)}${unit}`
}

function findBestIndex(values: string[], parser: (s: string) => number | null, lowerIsBetter: boolean): number {
  let bestIdx = 0
  let bestVal: number | null = null
  values.forEach((v, i) => {
    const parsed = parser(v)
    if (parsed === null) return
    if (bestVal === null) { bestIdx = i; bestVal = parsed; return }
    if (lowerIsBetter ? parsed < bestVal : parsed > bestVal) {
      bestIdx = i
      bestVal = parsed
    }
  })
  return bestIdx
}

export default function ComparisonTable({ entries }: ComparisonTableProps) {
  if (entries.length === 0) return null

  const metrics: MetricRow[] = [
    {
      label: '0–60 mph',
      values: entries.map(e => fmtTime(e.result.performance.zeroTo60Mph)),
      deltas: entries.map((_, i) =>
        calcDelta(entries.map(e => fmtTime(e.result.performance.zeroTo60Mph)), i, parseSeconds, 's')
      ),
      bestIndex: findBestIndex(entries.map(e => fmtTime(e.result.performance.zeroTo60Mph)), parseSeconds, true),
    },
    {
      label: '0–100 km/h',
      values: entries.map(e => fmtTime(e.result.performance.zeroTo100Kmh)),
      deltas: entries.map((_, i) =>
        calcDelta(entries.map(e => fmtTime(e.result.performance.zeroTo100Kmh)), i, parseSeconds, 's')
      ),
      bestIndex: findBestIndex(entries.map(e => fmtTime(e.result.performance.zeroTo100Kmh)), parseSeconds, true),
    },
    {
      label: '¼ Mile',
      values: entries.map(e => fmtTime(e.result.performance.quarterMileS)),
      deltas: entries.map((_, i) =>
        calcDelta(entries.map(e => fmtTime(e.result.performance.quarterMileS)), i, parseSeconds, 's')
      ),
      bestIndex: findBestIndex(entries.map(e => fmtTime(e.result.performance.quarterMileS)), parseSeconds, true),
    },
    {
      label: '¼ Mile Trap',
      values: entries.map(e => fmtSpeed(e.result.performance.quarterMileSpeedMs)),
      deltas: entries.map((_, i) =>
        calcDelta(entries.map(e => fmtSpeed(e.result.performance.quarterMileSpeedMs)), i, parseMph, ' mph')
      ),
      bestIndex: findBestIndex(entries.map(e => fmtSpeed(e.result.performance.quarterMileSpeedMs)), parseMph, false),
    },
    {
      label: 'Top Speed',
      values: entries.map(e => fmtSpeed(e.result.performance.topSpeedMs)),
      deltas: entries.map((_, i) =>
        calcDelta(entries.map(e => fmtSpeed(e.result.performance.topSpeedMs)), i, parseMph, ' mph')
      ),
      bestIndex: findBestIndex(entries.map(e => fmtSpeed(e.result.performance.topSpeedMs)), parseMph, false),
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
              <th
                key={entry.setup.id}
                className="text-right px-4 py-3"
              >
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
          {metrics.map(row => (
            <tr key={row.label} className="border-b border-faint last:border-0 hover:bg-raised transition-colors">
              <td className="px-4 py-3">
                <span className="font-display text-xs font-medium tracking-wider text-label">
                  {row.label}
                </span>
              </td>
              {row.values.map((val, i) => (
                <td key={i} className="px-4 py-3 text-right">
                  <div className="flex items-baseline justify-end gap-2">
                    <span className={`font-data text-base tabular-nums ${i === row.bestIndex ? 'text-data font-semibold' : 'text-gray-400'}`}>
                      {val}
                    </span>
                    {/* Winner badge */}
                    {i === row.bestIndex && entries.length > 1 && (
                      <span className="font-display text-[9px] tracking-widest uppercase text-signal-hi border border-signal/30 px-1 py-0.5 rounded bg-signal-dim">
                        best
                      </span>
                    )}
                    {/* Delta vs base */}
                    {row.deltas[i] && (
                      <span
                        className={`font-data text-xs tabular-nums ${
                          row.deltas[i]!.startsWith('+') ? 'text-signal-hi' : 'text-green-400'
                        }`}
                      >
                        {row.deltas[i]}
                      </span>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
