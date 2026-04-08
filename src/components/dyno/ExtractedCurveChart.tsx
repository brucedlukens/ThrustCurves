import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from 'recharts'
import type { CurvePoint } from '@/types/car'

interface ExtractedCurveChartProps {
  curve: CurvePoint[]
}

interface ChartRow {
  rpm: number
  torqueNm: number
  powerKw: number
}

const CHART_STYLE = {
  backgroundColor: 'transparent',
  border: '1px solid #2a2a35',
  borderRadius: '6px',
  fontFamily: '"JetBrains Mono", monospace',
}

const AXIS_TICK = { fill: '#8888a0', fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }
const AXIS_LABEL = { fill: '#55556a', fontSize: 11, fontFamily: '"Barlow Condensed", sans-serif' }

export default function ExtractedCurveChart({ curve }: ExtractedCurveChartProps) {
  const data: ChartRow[] = curve.map(([rpm, nm]) => ({
    rpm,
    torqueNm: nm,
    powerKw: Math.round((nm * rpm) / 9549),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 60, bottom: 28, left: 20 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#1a1a22" vertical={false} />
        <XAxis
          dataKey="rpm"
          type="number"
          domain={['auto', 'auto']}
          label={{
            value: 'RPM',
            position: 'insideBottom',
            offset: -14,
            style: AXIS_LABEL,
            letterSpacing: '0.15em',
          }}
          tick={AXIS_TICK}
          axisLine={{ stroke: '#2a2a35' }}
          tickLine={{ stroke: '#2a2a35' }}
        />
        <YAxis
          yAxisId="torque"
          orientation="left"
          label={{
            value: 'TORQUE (NM)',
            angle: -90,
            position: 'insideLeft',
            offset: 12,
            style: { ...AXIS_LABEL, fill: '#f97316' },
            letterSpacing: '0.1em',
          }}
          tick={AXIS_TICK}
          axisLine={{ stroke: '#2a2a35' }}
          tickLine={{ stroke: '#2a2a35' }}
          width={64}
        />
        <YAxis
          yAxisId="power"
          orientation="right"
          label={{
            value: 'POWER (KW)',
            angle: 90,
            position: 'insideRight',
            offset: 12,
            style: { ...AXIS_LABEL, fill: '#06b6d4' },
            letterSpacing: '0.1em',
          }}
          tick={AXIS_TICK}
          axisLine={{ stroke: '#2a2a35' }}
          tickLine={{ stroke: '#2a2a35' }}
          width={56}
        />
        <Tooltip
          contentStyle={CHART_STYLE}
          labelStyle={{ color: '#8888a0', fontSize: 11 }}
          itemStyle={{ color: '#eeeef2', fontSize: 11 }}
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
        <Line
          yAxisId="torque"
          dataKey="torqueNm"
          name="Torque (Nm)"
          stroke="#f97316"
          dot={false}
          strokeWidth={2}
        />
        <Line
          yAxisId="power"
          dataKey="powerKw"
          name="Power (kW)"
          stroke="#06b6d4"
          dot={false}
          strokeWidth={2}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
