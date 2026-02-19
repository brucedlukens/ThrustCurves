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

export default function PowerTorqueChart({ car }: PowerTorqueChartProps) {
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

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 56, bottom: 24, left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="rpm"
          type="number"
          domain={['auto', 'auto']}
          label={{
            value: 'RPM',
            position: 'insideBottom',
            offset: -12,
            fill: '#9ca3af',
            fontSize: 12,
          }}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
        />
        <YAxis
          yAxisId="torque"
          orientation="left"
          label={{
            value: 'Torque (lb·ft)',
            angle: -90,
            position: 'insideLeft',
            offset: 8,
            fill: '#fb923c',
            fontSize: 12,
          }}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
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
            fill: '#60a5fa',
            fontSize: 12,
          }}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          width={52}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
          }}
          labelStyle={{ color: '#9ca3af', fontSize: 11 }}
          itemStyle={{ color: '#e5e7eb', fontSize: 11 }}
          labelFormatter={(rpm: number) => `${rpm} RPM`}
        />
        <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12, paddingTop: 8 }} />
        <Line
          yAxisId="torque"
          dataKey="torqueLbft"
          name="Torque (lb·ft)"
          stroke="#fb923c"
          dot={false}
          strokeWidth={2}
          connectNulls={false}
        />
        <Line
          yAxisId="power"
          dataKey="powerHp"
          name="Power (hp)"
          stroke="#60a5fa"
          dot={false}
          strokeWidth={2}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
