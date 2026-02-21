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
import { useCarStore } from '@/store/carStore'
import { NM_TO_LBFT } from '@/utils/units'

const COMPARISON_COLORS = [
  '#ef4444', // red
  '#22c55e', // green
  '#06b6d4', // cyan
  '#f97316', // orange
  '#a855f7', // violet
  '#eab308', // amber
]

interface ComparisonDynoChartProps {
  entries: ComparisonEntry[]
}

interface ChartRow {
  rpm: number
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

export default function ComparisonDynoChart({ entries }: ComparisonDynoChartProps) {
  const cars = useCarStore(state => state.cars)

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-txt text-sm font-display tracking-wider uppercase">
        Select setups to compare
      </div>
    )
  }

  // Build per-entry torque map (RPM → lb·ft)
  const torqueMaps = entries.map(entry => {
    const car = cars.find(c => c.id === entry.setup.carId)
    if (!car) return new Map<number, number>()
    const m = new Map<number, number>()
    car.engine.torqueCurve.forEach(([rpm, nm]) => {
      m.set(rpm, parseFloat((nm * NM_TO_LBFT).toFixed(1)))
    })
    return m
  })

  // Collect all RPM points across all entries
  const allRpms = new Set<number>()
  torqueMaps.forEach(m => m.forEach((_, rpm) => allRpms.add(rpm)))

  const data: ChartRow[] = [...allRpms]
    .sort((a, b) => a - b)
    .map(rpm => {
      const row: ChartRow = { rpm }
      torqueMaps.forEach((m, i) => {
        row[`setup${i}`] = m.get(rpm)
      })
      return row
    })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 28, bottom: 28, left: 20 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#1a1a22" vertical={false} />
        <XAxis
          dataKey="rpm"
          type="number"
          domain={['auto', 'auto']}
          label={{
            value: 'RPM',
            position: 'insideBottom',
            offset: -14,
            style: AXIS_LABEL_STYLE,
            letterSpacing: '0.15em',
          }}
          tick={AXIS_TICK}
          axisLine={{ stroke: '#2a2a35' }}
          tickLine={{ stroke: '#2a2a35' }}
        />
        <YAxis
          label={{
            value: 'TORQUE (LB·FT)',
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
          formatter={(value: number) => [`${value.toFixed(0)} lb·ft`]}
          labelFormatter={(rpm: number) => `${rpm} RPM`}
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
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
