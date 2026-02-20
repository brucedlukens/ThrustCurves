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

const COMPARISON_COLORS = ['#f59e0b', '#06b6d4', '#10b981', '#8b5cf6', '#f43f5e', '#fb923c']

const CHART_FONT = "'Chakra Petch', system-ui, sans-serif"
const MONO_FONT = "'JetBrains Mono', monospace"

interface ComparisonChartProps {
  entries: ComparisonEntry[]
  height?: number
}

interface ChartRow {
  speedMph: number
  [key: string]: number | undefined
}

export default function ComparisonChart({ entries, height = 340 }: ComparisonChartProps) {
  if (entries.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-64 text-sm"
        style={{ fontFamily: CHART_FONT, color: '#55556a' }}
      >
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

  const tickStyle = { fontFamily: CHART_FONT, fontSize: 10, fill: '#8888aa' }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 24, bottom: 28, left: 16 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="#1e1e2e" />
        <XAxis
          dataKey="speedMph"
          type="number"
          domain={['auto', 'auto']}
          label={{
            value: 'Speed (mph)',
            position: 'insideBottom',
            offset: -14,
            fill: '#8888aa',
            fontSize: 11,
            fontFamily: CHART_FONT,
          }}
          tick={tickStyle}
        />
        <YAxis
          label={{
            value: 'Thrust (lbf)',
            angle: -90,
            position: 'insideLeft',
            offset: 8,
            fill: '#8888aa',
            fontSize: 11,
            fontFamily: CHART_FONT,
          }}
          tick={tickStyle}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#111118',
            border: '1px solid #3a3a50',
            borderRadius: '6px',
            fontFamily: MONO_FONT,
            fontSize: 11,
          }}
          labelStyle={{ fontFamily: CHART_FONT, color: '#f59e0b', fontSize: 11, marginBottom: 4 }}
          itemStyle={{ color: '#f0f0f8', fontSize: 11 }}
          formatter={(value: number) => [`${value.toFixed(0)} lbf`]}
          labelFormatter={(label: number) => `${label.toFixed(1)} mph`}
        />
        <Legend wrapperStyle={{ fontFamily: CHART_FONT, fontSize: 11, color: '#8888aa', paddingTop: 8 }} />
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
