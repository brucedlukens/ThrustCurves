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
import { MS_TO_MPH, MS_TO_KMH } from '@/utils/units'
import { useUnitStore } from '@/store/unitStore'

const COMPARISON_COLORS = [
  '#ef4444', // red
  '#22c55e', // green
  '#06b6d4', // cyan
  '#f97316', // orange
  '#a855f7', // violet
  '#eab308', // amber
]

const G = 9.80665

interface ComparisonAccelerationChartProps {
  entries: ComparisonEntry[]
}

interface ChartRow {
  speed: number
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

/** Sample a trace to at most maxPoints and build a speed→gForce map (speed keyed as integer tenths) */
function buildGForceMap(entry: ComparisonEntry, speedFactor: number, maxPoints = 200): Map<number, number> {
  const filtered = entry.result.trace.filter(step => step.accelerationMs2 > 0)
  const step = Math.max(1, Math.ceil(filtered.length / maxPoints))
  const m = new Map<number, number>()
  filtered.forEach((s, i) => {
    if (i % step !== 0) return
    // Key: speed in display units × 10, rounded to integer (gives 0.1-unit resolution)
    const speedKey = Math.round(s.speedMs * speedFactor * 10)
    m.set(speedKey, parseFloat((s.accelerationMs2 / G).toFixed(3)))
  })
  return m
}

export default function ComparisonAccelerationChart({ entries }: ComparisonAccelerationChartProps) {
  const units = useUnitStore(state => state.units)
  const speedFactor = units === 'imperial' ? MS_TO_MPH : MS_TO_KMH
  const speedLabel = units === 'imperial' ? 'MPH' : 'KM/H'
  const speedUnit = units === 'imperial' ? 'mph' : 'km/h'

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-txt text-sm font-display tracking-wider uppercase">
        Select setups to compare
      </div>
    )
  }

  const traceMaps = entries.map(entry => buildGForceMap(entry, speedFactor))

  const allSpeedKeys = new Set<number>()
  traceMaps.forEach(m => m.forEach((_, k) => allSpeedKeys.add(k)))

  const data: ChartRow[] = [...allSpeedKeys]
    .sort((a, b) => a - b)
    .map(key => {
      const row: ChartRow = { speed: parseFloat((key / 10).toFixed(1)) }
      traceMaps.forEach((m, i) => {
        row[`setup${i}`] = m.get(key)
      })
      return row
    })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 28, bottom: 28, left: 20 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#1a1a22" vertical={false} />
        <XAxis
          dataKey="speed"
          type="number"
          domain={['auto', 'auto']}
          label={{
            value: `SPEED (${speedLabel})`,
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
            value: 'ACCEL (G)',
            angle: -90,
            position: 'insideLeft',
            offset: 12,
            style: AXIS_LABEL_STYLE,
            letterSpacing: '0.1em',
          }}
          tick={AXIS_TICK}
          axisLine={{ stroke: '#2a2a35' }}
          tickLine={{ stroke: '#2a2a35' }}
          width={58}
          domain={[0, 'auto']}
        />
        <Tooltip
          contentStyle={CHART_STYLE}
          labelStyle={{ color: '#8888a0', fontSize: 11 }}
          itemStyle={{ color: '#eeeef2', fontSize: 11 }}
          formatter={(value: number) => [`${value.toFixed(3)} g`]}
          labelFormatter={(label: number) => `${label.toFixed(1)} ${speedUnit}`}
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
