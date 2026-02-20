import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from 'recharts'
import type { ComparisonEntry } from '@/hooks/useComparison'
import { MS_TO_MPH, N_TO_LBF } from '@/utils/units'

const COMPARISON_COLORS = [
  '#60a5fa', // blue
  '#34d399', // green
  '#fb923c', // orange
  '#f87171', // red
  '#a78bfa', // purple
  '#fbbf24', // yellow
]

interface ComparisonChartProps {
  entries: ComparisonEntry[]
}

interface ChartRow {
  speedMph: number
  [key: string]: number | undefined
}

export default function ComparisonChart({ entries }: ComparisonChartProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Select setups to compare
      </div>
    )
  }

  // Build per-entry envelope maps
  const envelopeMaps = entries.map(entry => {
    const m = new Map<number, number>()
    entry.result.envelope.forEach(p => m.set(Math.round(p.speedMs * 1000), p.forceN))
    return m
  })

  // Collect all unique speed keys
  const speedKeys = new Set<number>()
  entries.forEach(entry =>
    entry.result.envelope.forEach(p => speedKeys.add(Math.round(p.speedMs * 1000)))
  )

  const data: ChartRow[] = [...speedKeys]
    .sort((a, b) => a - b)
    .map(key => {
      const speedMs = key / 1000
      const row: ChartRow = { speedMph: parseFloat((speedMs * MS_TO_MPH).toFixed(2)) }
      entries.forEach((_entry, i) => {
        const forceN = envelopeMaps[i].get(key)
        row[`setup${i}`] = forceN !== undefined
          ? parseFloat((forceN * N_TO_LBF).toFixed(1))
          : undefined
      })
      return row
    })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 24, bottom: 24, left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="speedMph"
          type="number"
          domain={['auto', 'auto']}
          label={{
            value: 'Speed (mph)',
            position: 'insideBottom',
            offset: -12,
            fill: '#9ca3af',
            fontSize: 12,
          }}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
        />
        <YAxis
          label={{
            value: 'Thrust (lbf)',
            angle: -90,
            position: 'insideLeft',
            offset: 8,
            fill: '#9ca3af',
            fontSize: 12,
          }}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
          }}
          labelStyle={{ color: '#9ca3af', fontSize: 11 }}
          itemStyle={{ color: '#e5e7eb', fontSize: 11 }}
          formatter={(value: number) => [`${value.toFixed(0)} lbf`]}
          labelFormatter={(label: number) => `${label.toFixed(1)} mph`}
        />
        <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12, paddingTop: 8 }} />
        {entries.map((entry, i) => (
          <Line
            key={entry.setup.id}
            dataKey={`setup${i}`}
            name={entry.setup.name}
            stroke={COMPARISON_COLORS[i % COMPARISON_COLORS.length]}
            dot={false}
            strokeWidth={2}
            connectNulls={true}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
