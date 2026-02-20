import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import type { TimeStep } from '@/types/simulation'
import { useUnitStore } from '@/store/unitStore'
import { MS_TO_MPH, MS_TO_KMH } from '@/utils/units'

const G = 9.80665

interface AccelerationChartProps {
  trace: TimeStep[]
}

const CHART_STYLE = {
  backgroundColor: 'transparent',
  border: '1px solid #2a2a35',
  borderRadius: '6px',
  fontFamily: '"JetBrains Mono", monospace',
}

const AXIS_TICK = { fill: '#8888a0', fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }
const AXIS_LABEL_STYLE = {
  fill: '#55556a',
  fontSize: 11,
  fontFamily: '"Barlow Condensed", sans-serif',
}

interface ChartRow {
  speed: number
  gForce: number
}

/** Downsample trace for chart performance — keep every Nth point */
function downsample(rows: ChartRow[], maxPoints = 300): ChartRow[] {
  if (rows.length <= maxPoints) return rows
  const step = Math.ceil(rows.length / maxPoints)
  return rows.filter((_, i) => i % step === 0)
}

export default function AccelerationChart({ trace }: AccelerationChartProps) {
  const units = useUnitStore(state => state.units)
  const speedFactor = units === 'imperial' ? MS_TO_MPH : MS_TO_KMH
  const speedLabel = units === 'imperial' ? 'MPH' : 'KM/H'
  const speedUnit = units === 'imperial' ? 'mph' : 'km/h'

  const rawData: ChartRow[] = trace
    .filter(step => step.accelerationMs2 > 0)
    .map(step => ({
      speed: parseFloat((step.speedMs * speedFactor).toFixed(2)),
      gForce: parseFloat((step.accelerationMs2 / G).toFixed(3)),
    }))

  const data = downsample(rawData)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-txt font-data text-sm">
        No acceleration data
      </div>
    )
  }

  const maxG = Math.max(...data.map(d => d.gForce))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 28, bottom: 28, left: 20 }}>
        <defs>
          <linearGradient id="gForceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="#1a1a22" vertical={false} />
        <XAxis
          dataKey="speed"
          type="number"
          domain={[0, 'auto']}
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
          formatter={(value: unknown) =>
            typeof value === 'number' && isFinite(value)
              ? [`${value.toFixed(3)} g`, 'G-Force']
              : ['—', 'G-Force']
          }
          labelFormatter={(label: unknown) =>
            typeof label === 'number' && isFinite(label)
              ? `${label.toFixed(1)} ${speedUnit}`
              : '—'
          }
        />
        {/* 1g reference line */}
        {maxG >= 0.9 && (
          <ReferenceLine
            y={1}
            stroke="#dc262640"
            strokeDasharray="4 3"
            label={{ value: '1g', position: 'right', fill: '#55556a', fontSize: 10 }}
          />
        )}
        <Area
          type="monotone"
          dataKey="gForce"
          name="G-Force"
          stroke="#dc2626"
          strokeWidth={2}
          fill="url(#gForceGradient)"
          dot={false}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
