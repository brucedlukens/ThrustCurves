import type { ComparisonEntry } from '@/hooks/useComparison'
import { fmtTime, fmtSpeed } from '@/utils/formatting'

interface ComparisonTableProps {
  entries: ComparisonEntry[]
}

interface MetricRow {
  label: string
  values: string[]
  /** Delta string relative to first entry (e.g. "+0.6s") */
  deltas: (string | null)[]
  /** Index of best-performing value in this row */
  bestIndex: number
  /** True if lower is better (time metrics) */
  lowerIsBetter: boolean
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
  let bestVal = parser(values[0])
  for (let i = 1; i < values.length; i++) {
    const v = parser(values[i])
    if (v === null) continue
    if (bestVal === null || (lowerIsBetter ? v < bestVal : v > bestVal)) {
      bestVal = v
      bestIdx = i
    }
  }
  return bestIdx
}

export default function ComparisonTable({ entries }: ComparisonTableProps) {
  if (entries.length === 0) {
    return null
  }

  const buildRow = (
    label: string,
    valuesFn: (e: ComparisonEntry) => string,
    parser: (s: string) => number | null,
    unit: string,
    lowerIsBetter: boolean,
  ): MetricRow => {
    const values = entries.map(valuesFn)
    return {
      label,
      values,
      deltas: entries.map((_, i) => calcDelta(values, i, parser, unit)),
      bestIndex: findBestIndex(values, parser, lowerIsBetter),
      lowerIsBetter,
    }
  }

  const metrics: MetricRow[] = [
    buildRow('0–60 mph', e => fmtTime(e.result.performance.zeroTo60Mph), parseSeconds, 's', true),
    buildRow('0–100 km/h', e => fmtTime(e.result.performance.zeroTo100Kmh), parseSeconds, 's', true),
    buildRow('¼ Mile', e => fmtTime(e.result.performance.quarterMileS), parseSeconds, 's', true),
    buildRow('¼ Mile Trap', e => fmtSpeed(e.result.performance.quarterMileSpeedMs), parseMph, ' mph', false),
    buildRow('Top Speed', e => fmtSpeed(e.result.performance.topSpeedMs), parseMph, ' mph', false),
  ]

  return (
    <div
      className="rounded-lg overflow-x-auto"
      style={{
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th
              className="text-left px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
            >
              Metric
            </th>
            {entries.map((entry, i) => (
              <th
                key={entry.setup.id}
                className="text-right px-4 py-2.5 text-xs font-medium truncate max-w-32"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-2)' }}
              >
                {i === 0 ? `${entry.setup.name}` : entry.setup.name}
                {i === 0 && (
                  <span className="ml-1 text-[10px]" style={{ color: 'var(--color-text-3)' }}>
                    (BASE)
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map(row => (
            <tr
              key={row.label}
              className="last:border-0"
              style={{ borderBottom: '1px solid rgba(42,42,56,0.5)' }}
            >
              <td
                className="px-4 py-2.5 text-[10px] uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
              >
                {row.label}
              </td>
              {row.values.map((val, i) => (
                <td key={i} className="px-4 py-2.5 text-right">
                  <span
                    className="font-medium"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: i === row.bestIndex && entries.length > 1 ? 'var(--color-accent)' : 'var(--color-text-1)',
                    }}
                  >
                    {val}
                  </span>
                  {row.deltas[i] && (
                    <span
                      className="ml-2 text-xs"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: row.deltas[i]!.startsWith('+')
                          ? (row.lowerIsBetter ? 'var(--color-danger)' : 'var(--color-success)')
                          : (row.lowerIsBetter ? 'var(--color-success)' : 'var(--color-danger)'),
                      }}
                    >
                      {row.deltas[i]}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
