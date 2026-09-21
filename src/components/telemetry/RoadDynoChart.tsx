import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Scatter,
} from 'recharts'
import type { RoadDynoPoint } from '@/types/telemetry'
import type { EnvelopePoint } from '@/types/simulation'
import { useUnitStore } from '@/store/unitStore'
import { MS_TO_MPH, MS_TO_KMH, N_TO_LBF } from '@/utils/units'
import { AXIS_LABEL_STYLE, AXIS_TICK, CHART_STYLE } from './shared'

interface RoadDynoChartProps {
  points: RoadDynoPoint[]
  baselineEnvelope: EnvelopePoint[]
  modifiedEnvelope: EnvelopePoint[]
  calibrationFactor: number
  maxSpeedMs: number
}

export default function RoadDynoChart({ points, baselineEnvelope, modifiedEnvelope, calibrationFactor, maxSpeedMs }: RoadDynoChartProps) {
  const units = useUnitStore(state => state.units)
  const speedFactor = units === 'imperial' ? MS_TO_MPH : MS_TO_KMH
  const forceFactor = units === 'imperial' ? N_TO_LBF : 1
  const speedUnit = units === 'imperial' ? 'mph' : 'km/h'
  const forceUnit = units === 'imperial' ? 'lbf' : 'N'

  const limit = maxSpeedMs * 1.15
  const measured = points.map(p => ({
    speed: parseFloat((p.speedMs * speedFactor).toFixed(1)),
    measured: parseFloat((p.forceN * forceFactor).toFixed(0)),
  }))
  const toLine = (env: EnvelopePoint[], key: string) =>
    env
      .filter(p => p.speedMs <= limit)
      .map(p => ({ speed: parseFloat((p.speedMs * speedFactor).toFixed(1)), [key]: parseFloat((p.forceN * calibrationFactor * forceFactor).toFixed(0)) }))

  const data = [...measured, ...toLine(baselineEnvelope, 'baseline'), ...toLine(modifiedEnvelope, 'modified')].sort((a, b) => a.speed - b.speed)

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-txt font-data text-sm">
        No power-limited samples to infer wheel force from
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 20, bottom: 28, left: 8 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#1a1a22" vertical={false} />
        <XAxis
          dataKey="speed"
          type="number"
          domain={[0, 'dataMax']}
          label={{ value: `SPEED (${speedUnit.toUpperCase()})`, position: 'insideBottom', offset: -14, style: AXIS_LABEL_STYLE, letterSpacing: '0.1em' }}
          tick={AXIS_TICK}
          axisLine={{ stroke: '#2a2a35' }}
          tickLine={{ stroke: '#2a2a35' }}
        />
        <YAxis
          label={{ value: `WHEEL FORCE (${forceUnit.toUpperCase()})`, angle: -90, position: 'insideLeft', offset: 12, style: AXIS_LABEL_STYLE, letterSpacing: '0.1em' }}
          tick={AXIS_TICK}
          axisLine={{ stroke: '#2a2a35' }}
          tickLine={{ stroke: '#2a2a35' }}
          width={58}
          domain={[0, 'auto']}
        />
        <Tooltip
          contentStyle={CHART_STYLE}
          labelStyle={{ color: '#8888a0', fontSize: 11 }}
          itemStyle={{ fontSize: 11 }}
          formatter={(value: unknown, name: unknown) => [typeof value === 'number' ? `${value.toFixed(0)} ${forceUnit}` : '—', String(name)]}
          labelFormatter={(label: unknown) => (typeof label === 'number' ? `${label.toFixed(1)} ${speedUnit}` : '—')}
        />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', paddingTop: 8 }} verticalAlign="top" height={24} />
        <Line type="monotone" dataKey="baseline" name="Baseline model" stroke="#f0f0fa" strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls isAnimationActive={false} />
        <Line type="monotone" dataKey="modified" name="Modified model" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
        <Scatter dataKey="measured" name="From log" fill="#f97316" isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
