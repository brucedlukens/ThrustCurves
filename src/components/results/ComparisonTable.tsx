import type { ComparisonEntry } from '@/hooks/useComparison'
import { fmtTime, fmtSpeed } from '@/utils/formatting'

interface ComparisonTableProps {
  entries: ComparisonEntry[]
}

interface MetricRow {
  label: string
  values: string[]
  deltas: (string | null)[]
  /** Lower is better (time) vs higher is better (speed) */
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

export default function ComparisonTable({ entries }: ComparisonTableProps) {
  if (entries.length === 0) return null

  const metrics: MetricRow[] = [
    {
      label: '0–60 mph',
      lowerIsBetter: true,
      values: entries.map(e => fmtTime(e.result.performance.zeroTo60Mph)),
      deltas: entries.map((_, i) =>
        calcDelta(entries.map(e => fmtTime(e.result.performance.zeroTo60Mph)), i, parseSeconds, 's')
      ),
    },
    {
      label: '0–100 km/h',
      lowerIsBetter: true,
      values: entries.map(e => fmtTime(e.result.performance.zeroTo100Kmh)),
      deltas: entries.map((_, i) =>
        calcDelta(entries.map(e => fmtTime(e.result.performance.zeroTo100Kmh)), i, parseSeconds, 's')
      ),
    },
    {
      label: '¼ Mile',
      lowerIsBetter: true,
      values: entries.map(e => fmtTime(e.result.performance.quarterMileS)),
      deltas: entries.map((_, i) =>
        calcDelta(entries.map(e => fmtTime(e.result.performance.quarterMileS)), i, parseSeconds, 's')
      ),
    },
    {
      label: '¼ Mile Trap',
      lowerIsBetter: false,
      values: entries.map(e => fmtSpeed(e.result.performance.quarterMileSpeedMs)),
      deltas: entries.map((_, i) =>
        calcDelta(entries.map(e => fmtSpeed(e.result.performance.quarterMileSpeedMs)), i, parseMph, ' mph')
      ),
    },
    {
      label: 'Top Speed',
      lowerIsBetter: false,
      values: entries.map(e => fmtSpeed(e.result.performance.topSpeedMs)),
      deltas: entries.map((_, i) =>
        calcDelta(entries.map(e => fmtSpeed(e.result.performance.topSpeedMs)), i, parseMph, ' mph')
      ),
    },
  ]

  return (
    <div
      className="rounded-xl overflow-x-auto"
      style={{ border: '1px solid var(--border)' }}
    >
      <table className="w-full">
        <thead>
          <tr style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border)' }}>
            <th
              className="text-left px-4 py-2.5 font-ui text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Metric
            </th>
            {entries.map((entry, i) => (
              <th
                key={entry.setup.id}
                className="text-right px-4 py-2.5 font-ui text-xs font-semibold truncate max-w-32"
                style={{ color: i === 0 ? 'var(--accent-text)' : 'var(--text-secondary)' }}
              >
                {i === 0 ? `${entry.setup.name} (base)` : entry.setup.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((row, rowIdx) => (
            <tr
              key={row.label}
              style={{
                background: rowIdx % 2 === 0 ? 'var(--surface-2)' : 'transparent',
                borderTop: '1px solid var(--border)',
              }}
            >
              <td
                className="px-4 py-2.5 font-ui text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {row.label}
              </td>
              {row.values.map((val, i) => {
                const delta = row.deltas[i]
                // Positive delta = worse for time metrics, better for speed metrics
                const isPositiveDelta = delta ? delta.startsWith('+') : false
                const deltaIsBetter = row.lowerIsBetter ? !isPositiveDelta : isPositiveDelta
                const deltaColor = deltaIsBetter ? 'var(--success)' : 'var(--danger)'

                return (
                  <td key={i} className="px-4 py-2.5 text-right">
                    <span
                      className="font-data text-sm font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {val}
                    </span>
                    {delta && (
                      <span
                        className="ml-2 font-data text-xs"
                        style={{ color: deltaColor }}
                      >
                        {delta}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
