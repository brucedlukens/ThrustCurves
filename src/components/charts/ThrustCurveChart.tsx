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

const GEAR_COLORS = ['#f59e0b', '#06b6d4', '#10b981', '#8b5cf6', '#f43f5e', '#fb923c']

const CHART_FONT = "'Chakra Petch', system-ui, sans-serif"
const MONO_FONT = "'JetBrains Mono', monospace"

interface ThrustCurveChartProps {
  gearCurves: GearThrustCurve[]
  envelope: EnvelopePoint[]
  height?: number
}

interface ChartRow {
  speedMph: number
  envelope: number | undefined
  envelopeGlow: number | undefined
  [key: string]: number | undefined
}

export default function ThrustCurveChart({ gearCurves, envelope, height = 340 }: ThrustCurveChartProps) {
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
        envelopeGlow: undefined,
      }
      gearCurves.forEach((_, i) => {
        const forceN = gearMaps[i].get(key)
        row[`gear${i + 1}`] = forceN !== undefined ? parseFloat((forceN * N_TO_LBF).toFixed(1)) : undefined
      })
      const envForce = envelopeMap.get(key)
      if (envForce !== undefined) {
        const lbf = parseFloat((envForce * N_TO_LBF).toFixed(1))
        row.envelope = lbf
        row.envelopeGlow = lbf
      }
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
          formatter={(value: unknown) =>
            typeof value === 'number' && isFinite(value) ? [`${value.toFixed(0)} lbf`] : ['—']
          }
          labelFormatter={(label: unknown) =>
            typeof label === 'number' && isFinite(label) ? `${label.toFixed(1)} mph` : '—'
          }
        />
        <Legend wrapperStyle={{ fontFamily: CHART_FONT, fontSize: 11, color: '#8888aa', paddingTop: 8 }} />

        {/* Gear lines */}
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

        {/* Envelope glow layer (wide, low opacity) */}
        <Line
          dataKey="envelopeGlow"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={10}
          dot={false}
          connectNulls={true}
          legendType="none"
          name="_glow"
        />

        {/* Envelope main line */}
        <Line
          dataKey="envelope"
          name="Envelope"
          stroke="#ffffff"
          dot={false}
          strokeWidth={2.5}
          strokeDasharray="4 3"
          connectNulls={true}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
