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

const GEAR_COLORS = ['#60a5fa', '#34d399', '#fb923c', '#f87171', '#a78bfa', '#fbbf24']

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
  // Build a speed → force map for each gear for O(1) lookup
  const gearMaps = gearCurves.map(gc => {
    const m = new Map<number, number>()
    gc.points.forEach(p => m.set(Math.round(p.speedMs * 1000), p.forceN))
    return m
  })
  const envelopeMap = new Map<number, number>()
  envelope.forEach(p => envelopeMap.set(Math.round(p.speedMs * 1000), p.forceN))

  // Collect all unique speed values (in milli-m/s integer keys)
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
        {gearCurves.map((gc, i) => (
          <Line
            key={`gear${gc.gear}`}
            dataKey={`gear${i + 1}`}
            name={`Gear ${gc.gear}`}
            stroke={GEAR_COLORS[i % GEAR_COLORS.length]}
            dot={false}
            strokeWidth={1.5}
            connectNulls={true}
          />
        ))}
        <Line
          dataKey="envelope"
          name="Envelope"
          stroke="#f9fafb"
          dot={false}
          strokeWidth={2}
          strokeDasharray="5 3"
          connectNulls={true}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
