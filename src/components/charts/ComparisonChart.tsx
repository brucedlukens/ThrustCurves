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

// Distinct, intentional comparison colors
const COMPARISON_COLORS = [
  '#ef4444', // red
  '#22c55e', // green
  '#06b6d4', // cyan
  '#f97316', // orange
  '#a855f7', // violet
  '#eab308', // amber
]

interface ComparisonChartProps {
  entries: ComparisonEntry[]
}

interface ChartRow {
  speedMph: number
  [key: string]: number | undefined
}

const CHART_STYLE = {
  backgroundColor: 'transparent',
  border: '1px solid #2a2a35',
  borderRadius: '6px',
  fontFamily: '"JetBrains Mono", monospace',
}

const AXIS_TICK = { fill: '#8888a0', fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }
const AXIS_LABEL_STYLE = { fill: '#55556a', fontSize: 11, fontFamily: '"Barlow Condensed", sans-serif' }

export default function ComparisonChart({ entries }: ComparisonChartProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-txt text-sm font-display tracking-wider uppercase">
        Select setups to compare
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

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 28, bottom: 28, left: 20 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#1a1a22" vertical={false} />
        <XAxis
          dataKey="speedMph"
          type="number"
          domain={['auto', 'auto']}
          label={{
            value: 'SPEED (MPH)',
            position: 'insideBottom',
            offset: -14,
            style: AXIS_LABEL_STYLE,
            letterSpacing: '0.1em',
          }}
          tick={AXIS_TICK}
          axisLine={{ stroke: '#2a2a35' }}
          tickLine={{ stroke: '#2a2a35' }}
        />
        <YAxis
          label={{
            value: 'THRUST (LBF)',
            angle: -90,
            position: 'insideLeft',
            offset: 12,
            style: AXIS_LABEL_STYLE,
            letterSpacing: '0.1em',
          }}
          tick={AXIS_TICK}
          axisLine={{ stroke: '#2a2a35' }}
          tickLine={{ stroke: '#2a2a35' }}
          width={64}
        />
        <Tooltip
          contentStyle={CHART_STYLE}
          labelStyle={{ color: '#8888a0', fontSize: 11 }}
          itemStyle={{ color: '#eeeef2', fontSize: 11 }}
          formatter={(value: number) => [`${value.toFixed(0)} lbf`]}
          labelFormatter={(label: number) => `${label.toFixed(1)} mph`}
        />
        <Legend
          wrapperStyle={{
            color: '#8888a0',
            fontSize: 11,
            paddingTop: 12,
            fontFamily: '"Barlow Condensed", sans-serif',
            letterSpacing: '0.05em',
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
