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
  if (entries.length === 0) {
    return null
  }

  const metrics: MetricRow[] = [
    {
      label: '0–60 mph',
      values: entries.map(e => fmtTime(e.result.performance.zeroTo60Mph)),
      deltas: entries.map((_, i) =>
        calcDelta(
          entries.map(e => fmtTime(e.result.performance.zeroTo60Mph)),
          i,
          parseSeconds,
          's',
        )
      ),
    },
    {
      label: '0–100 km/h',
      values: entries.map(e => fmtTime(e.result.performance.zeroTo100Kmh)),
      deltas: entries.map((_, i) =>
        calcDelta(
          entries.map(e => fmtTime(e.result.performance.zeroTo100Kmh)),
          i,
          parseSeconds,
          's',
        )
      ),
    },
    {
      label: '¼ Mile',
      values: entries.map(e => fmtTime(e.result.performance.quarterMileS)),
      deltas: entries.map((_, i) =>
        calcDelta(
          entries.map(e => fmtTime(e.result.performance.quarterMileS)),
          i,
          parseSeconds,
          's',
        )
      ),
    },
    {
      label: '¼ Mile Trap',
      values: entries.map(e => fmtSpeed(e.result.performance.quarterMileSpeedMs)),
      deltas: entries.map((_, i) =>
        calcDelta(
          entries.map(e => fmtSpeed(e.result.performance.quarterMileSpeedMs)),
          i,
          parseMph,
          ' mph',
        )
      ),
    },
    {
      label: 'Top Speed',
      values: entries.map(e => fmtSpeed(e.result.performance.topSpeedMs)),
      deltas: entries.map((_, i) =>
        calcDelta(
          entries.map(e => fmtSpeed(e.result.performance.topSpeedMs)),
          i,
          parseMph,
          ' mph',
        )
      ),
    },
  ]

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Metric
            </th>
            {entries.map((entry, i) => (
              <th
                key={entry.setup.id}
                className="text-right px-4 py-2 text-xs font-semibold text-gray-300 truncate max-w-32"
              >
                {i === 0 ? `${entry.setup.name} (base)` : entry.setup.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map(row => (
            <tr key={row.label} className="border-b border-gray-700/50 last:border-0">
              <td className="px-4 py-2 text-gray-400">{row.label}</td>
              {row.values.map((val, i) => (
                <td key={i} className="px-4 py-2 text-right">
                  <span className="text-gray-100 font-medium">{val}</span>
                  {row.deltas[i] && (
                    <span
                      className={`ml-2 text-xs ${
                        row.deltas[i]!.startsWith('+') ? 'text-red-400' : 'text-green-400'
                      }`}
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
