import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ReferenceLine,
} from 'recharts'
import { MS_TO_MPH, MS_TO_KMH, N_TO_LBF } from '@/utils/units'
import { useUnitStore } from '@/store/unitStore'
import type { TowingEntry } from './entry'

interface TowingChartProps {
  entries: TowingEntry[]
  /** Scenario speed marker (m/s) */
  speedMs: number
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

/**
 * Thrust envelope (solid) vs towing road load (dashed) for each truck.
 * Where the solid line sits above its dashed line, the truck can hold or gain
 * speed; the crossing is its max sustainable speed for the scenario.
 */
export default function TowingChart({ entries, speedMs }: TowingChartProps) {
  const units = useUnitStore(state => state.units)
  const imperial = units === 'imperial'
  const speedFactor = imperial ? MS_TO_MPH : MS_TO_KMH
  const forceFactor = imperial ? N_TO_LBF : 1
  const forceUnit = imperial ? 'lbf' : 'N'
  const speedUnit = imperial ? 'mph' : 'km/h'

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-txt text-sm font-display tracking-wider uppercase">
        Add trucks to compare
      </div>
    )
  }

  // Envelope and road-load curves share the same 0.5 m/s sampling grid
  const rowsByKey = new Map<number, ChartRow>()
  const rowFor = (ms: number): ChartRow => {
    const key = Math.round(ms * 1000)
    let row = rowsByKey.get(key)
    if (!row) {
      row = { speed: parseFloat((ms * speedFactor).toFixed(2)) }
      rowsByKey.set(key, row)
    }
    return row
  }

  entries.forEach((entry, i) => {
    for (const pt of entry.analysis.envelope) {
      rowFor(pt.speedMs)[`env${i}`] = parseFloat((pt.forceN * forceFactor).toFixed(1))
    }
    for (const pt of entry.analysis.roadLoadCurve) {
      rowFor(pt.speedMs)[`load${i}`] = parseFloat((pt.forceN * forceFactor).toFixed(1))
    }
  })

  const data = [...rowsByKey.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, row]) => row)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 28, bottom: 28, left: 20 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#1a1a22" vertical={false} />
        <XAxis
          dataKey="speed"
          type="number"
          domain={['auto', 'auto']}
          label={{
            value: `SPEED (${speedUnit.toUpperCase()})`,
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
            value: `FORCE (${forceUnit.toUpperCase()})`,
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
          itemStyle={{ fontSize: 11 }}
          formatter={(value: number) => [`${value.toFixed(0)} ${forceUnit}`]}
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
        <ReferenceLine
          x={parseFloat((speedMs * speedFactor).toFixed(2))}
          stroke="#8888a0"
          strokeDasharray="4 4"
          label={{ value: 'target', position: 'top', style: { fill: '#8888a0', fontSize: 10 } }}
        />
        {entries.map((entry, i) => (
          <Line
            key={`env-${entry.key}`}
            dataKey={`env${i}`}
            name={`${entry.name} thrust`}
            stroke={entry.color}
            dot={false}
            strokeWidth={2}
            connectNulls={true}
          />
        ))}
        {entries.map((entry, i) => (
          <Line
            key={`load-${entry.key}`}
            dataKey={`load${i}`}
            name={`${entry.name} load`}
            stroke={entry.color}
            strokeOpacity={0.55}
            strokeDasharray="6 4"
            dot={false}
            strokeWidth={1.5}
            connectNulls={true}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
