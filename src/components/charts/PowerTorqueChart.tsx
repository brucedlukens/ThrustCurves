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
import type { CarSpec } from '@/types/car'
import { NM_TO_LBFT, KW_TO_HP } from '@/utils/units'

interface PowerTorqueChartProps {
  car: CarSpec
}

interface ChartRow {
  rpm: number
  torqueLbft: number | undefined
  powerHp: number | undefined
}

const CHART_STYLE = {
  backgroundColor: 'transparent',
  border: '1px solid #2a2a35',
  borderRadius: '6px',
  fontFamily: '"JetBrains Mono", monospace',
}

const AXIS_TICK = { fill: '#8888a0', fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }
const AXIS_LABEL_STYLE = { fill: '#55556a', fontSize: 11, fontFamily: '"Barlow Condensed", sans-serif' }

export default function PowerTorqueChart({ car }: PowerTorqueChartProps) {
  const allRpms = new Set<number>()
  car.engine.torqueCurve.forEach(([rpm]) => allRpms.add(rpm))
  car.engine.powerCurve.forEach(([rpm]) => allRpms.add(rpm))

  const torqueMap = new Map(car.engine.torqueCurve.map(([rpm, t]) => [rpm, t]))
  const powerMap = new Map(car.engine.powerCurve.map(([rpm, p]) => [rpm, p]))

  const data: ChartRow[] = [...allRpms].sort((a, b) => a - b).map(rpm => {
    const t = torqueMap.get(rpm)
    const p = powerMap.get(rpm)
    return {
      rpm,
      torqueLbft: t !== undefined ? parseFloat((t * NM_TO_LBFT).toFixed(1)) : undefined,
      powerHp: p !== undefined ? parseFloat((p * KW_TO_HP).toFixed(1)) : undefined,
    }
  })

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
            style: AXIS_LABEL_STYLE,
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
            value: 'TORQUE (LB·FT)',
            angle: -90,
            position: 'insideLeft',
            offset: 12,
            style: { ...AXIS_LABEL_STYLE, fill: '#f97316' },
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
            value: 'POWER (HP)',
            angle: 90,
            position: 'insideRight',
            offset: 12,
            style: { ...AXIS_LABEL_STYLE, fill: '#06b6d4' },
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
          dataKey="torqueLbft"
          name="Torque (lb·ft)"
          stroke="#f97316"
          dot={false}
          strokeWidth={2}
          connectNulls={false}
        />
        <Line
          yAxisId="power"
          dataKey="powerHp"
          name="Power (hp)"
          stroke="#06b6d4"
          dot={false}
          strokeWidth={2}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
