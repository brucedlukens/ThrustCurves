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
import type { GearThrustCurve, EnvelopePoint } from '@/types/simulation'
import { MS_TO_MPH, N_TO_LBF } from '@/utils/units'

// Intentional gear color palette: low→high speed progression
const GEAR_COLORS = [
  '#ef4444', // G1 — signal red
  '#f97316', // G2 — orange
  '#eab308', // G3 — amber
  '#22c55e', // G4 — green
  '#06b6d4', // G5 — cyan
  '#6366f1', // G6 — indigo
  '#a855f7', // G7 — violet
  '#ec4899', // G8 — pink
]

interface ThrustCurveChartProps {
  gearCurves: GearThrustCurve[]
  envelope: EnvelopePoint[]
}

interface ChartRow {
  speedMph: number
  envelope: number | undefined
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

export default function ThrustCurveChart({ gearCurves, envelope }: ThrustCurveChartProps) {
  const gearMaps = gearCurves.map(gc => {
    const m = new Map<number, number>()
    gc.points.forEach(p => m.set(Math.round(p.speedMs * 1000), p.forceN))
    return m
  })
  const envelopeMap = new Map<number, number>()
  envelope.forEach(p => envelopeMap.set(Math.round(p.speedMs * 1000), p.forceN))

  const speedKeys = new Set<number>()
  gearCurves.forEach(gc => gc.points.forEach(p => speedKeys.add(Math.round(p.speedMs * 1000))))
  envelope.forEach(p => speedKeys.add(Math.round(p.speedMs * 1000)))

  const data: ChartRow[] = [...speedKeys]
    .sort((a, b) => a - b)
    .map(key => {
      const speedMs = key / 1000
      const row: ChartRow = {
        speedMph: parseFloat((speedMs * MS_TO_MPH).toFixed(2)),
        envelope: undefined,
      }
      gearCurves.forEach((_, i) => {
        const forceN = gearMaps[i].get(key)
        row[`gear${i + 1}`] = forceN !== undefined ? parseFloat((forceN * N_TO_LBF).toFixed(1)) : undefined
      })
      const envForce = envelopeMap.get(key)
      row.envelope = envForce !== undefined ? parseFloat((envForce * N_TO_LBF).toFixed(1)) : undefined
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
          formatter={(value: unknown) =>
            typeof value === 'number' && isFinite(value) ? [`${value.toFixed(0)} lbf`] : ['—']
          }
          labelFormatter={(label: unknown) =>
            typeof label === 'number' && isFinite(label) ? `${label.toFixed(1)} mph` : '—'
          }
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
        {gearCurves.map((gc, i) => (
          <Line
            key={`gear${gc.gear}`}
            dataKey={`gear${i + 1}`}
            name={`Gear ${gc.gear}`}
            stroke={GEAR_COLORS[i % GEAR_COLORS.length]}
            dot={false}
            strokeWidth={1.5}
            strokeOpacity={0.75}
            connectNulls={true}
          />
        ))}
        {/* Envelope — the line that matters */}
        <Line
          dataKey="envelope"
          name="Envelope"
          stroke="#f0f0fa"
          dot={false}
          strokeWidth={2.5}
          strokeOpacity={1}
          connectNulls={true}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
