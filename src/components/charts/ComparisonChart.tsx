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

// Distinctive palette for comparison overlays
const COMPARISON_COLORS = [
  '#00D4C8', // teal
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EF4444', // red
  '#3B82F6', // blue
  '#10B981', // emerald
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
      <div
        className="flex items-center justify-center h-64 font-ui text-sm"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Select setups from the panel to overlay their thrust envelopes
      </div>
    )
  }

  const envelopeMaps = entries.map(entry => {
    const m = new Map<number, number>()
    entry.result.envelope.forEach(p => m.set(Math.round(p.speedMs * 1000), p.forceN))
    return m
  })

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

  const tickStyle = { fill: '#6B8BA4', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }
  const axisLabelBase = {
    fontSize: 11,
    fontFamily: "'Barlow Condensed', sans-serif",
    letterSpacing: '0.08em',
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 24, bottom: 28, left: 16 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#1e2d3d" />
        <XAxis
          dataKey="speedMph"
          type="number"
          domain={['auto', 'auto']}
          label={{
            value: 'Speed (mph)',
            position: 'insideBottom',
            offset: -14,
            fill: '#3D5568',
            ...axisLabelBase,
          }}
          tick={tickStyle}
        />
        <YAxis
          label={{
            value: 'Thrust (lbf)',
            angle: -90,
            position: 'insideLeft',
            offset: 8,
            fill: '#3D5568',
            ...axisLabelBase,
          }}
          tick={tickStyle}
          width={64}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#111820',
            border: '1px solid #1e2d3d',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
          labelStyle={{
            color: '#6B8BA4',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 4,
          }}
          itemStyle={{
            color: '#E8EFF5',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
          }}
          formatter={(value: number) => [`${value.toFixed(0)} lbf`]}
          labelFormatter={(label: number) => `${label.toFixed(1)} mph`}
        />
        <Legend
          wrapperStyle={{
            color: '#6B8BA4',
            fontSize: 11,
            fontFamily: "'Barlow Condensed', sans-serif",
            paddingTop: 12,
            letterSpacing: '0.04em',
          }}
        />
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
