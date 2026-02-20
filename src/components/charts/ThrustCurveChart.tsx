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

// Intentional motorsport palette — not rainbow defaults
const GEAR_COLORS = [
  '#00D4C8', // teal (gear 1)
  '#3B82F6', // blue (gear 2)
  '#8B5CF6', // violet (gear 3)
  '#F59E0B', // amber (gear 4)
  '#EF4444', // red (gear 5)
  '#10B981', // emerald (gear 6)
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

  const tickStyle = { fill: '#6B8BA4', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }

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
            fontSize: 11,
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.08em',
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
            fontSize: 11,
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.08em',
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
          formatter={(value: unknown) =>
            typeof value === 'number' && isFinite(value) ? [`${value.toFixed(0)} lbf`] : ['—']
          }
          labelFormatter={(label: unknown) =>
            typeof label === 'number' && isFinite(label) ? `${label.toFixed(1)} mph` : '—'
          }
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
        {gearCurves.map((gc, i) => (
          <Line
            key={`gear${gc.gear}`}
            dataKey={`gear${i + 1}`}
            name={`Gear ${gc.gear}`}
            stroke={GEAR_COLORS[i % GEAR_COLORS.length]}
            dot={false}
            strokeWidth={1.75}
            strokeOpacity={0.85}
            connectNulls={true}
          />
        ))}
        <Line
          dataKey="envelope"
          name="Envelope"
          stroke="rgba(232,239,245,0.9)"
          dot={false}
          strokeWidth={2.5}
          connectNulls={true}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
