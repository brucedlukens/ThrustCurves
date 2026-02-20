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

const CHART_FONT = "'Chakra Petch', system-ui, sans-serif"
const MONO_FONT = "'JetBrains Mono', monospace"

interface PowerTorqueChartProps {
  car: CarSpec
  height?: number
}

interface ChartRow {
  rpm: number
  torqueLbft: number | undefined
  powerHp: number | undefined
}

export default function PowerTorqueChart({ car, height = 300 }: PowerTorqueChartProps) {
  // Collect all unique RPM values from both curves
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

  const tickStyle = { fontFamily: CHART_FONT, fontSize: 10, fill: '#8888aa' }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 56, bottom: 28, left: 16 }}>
        <CartesianGrid strokeDasharray="2 6" stroke="#1e1e2e" />
        <XAxis
          dataKey="rpm"
          type="number"
          domain={['auto', 'auto']}
          label={{
            value: 'RPM',
            position: 'insideBottom',
            offset: -14,
            fill: '#8888aa',
            fontSize: 11,
            fontFamily: CHART_FONT,
          }}
          tick={tickStyle}
        />
        <YAxis
          yAxisId="torque"
          orientation="left"
          label={{
            value: 'Torque (lb·ft)',
            angle: -90,
            position: 'insideLeft',
            offset: 8,
            fill: '#f59e0b',
            fontSize: 11,
            fontFamily: CHART_FONT,
          }}
          tick={tickStyle}
          width={60}
        />
        <YAxis
          yAxisId="power"
          orientation="right"
          label={{
            value: 'Power (hp)',
            angle: 90,
            position: 'insideRight',
            offset: 8,
            fill: '#06b6d4',
            fontSize: 11,
            fontFamily: CHART_FONT,
          }}
          tick={tickStyle}
          width={52}
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
          labelFormatter={(rpm: number) => `${rpm} RPM`}
        />
        <Legend wrapperStyle={{ fontFamily: CHART_FONT, fontSize: 11, color: '#8888aa', paddingTop: 8 }} />
        <Line
          yAxisId="torque"
          dataKey="torqueLbft"
          name="Torque (lb·ft)"
          stroke="#f59e0b"
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
