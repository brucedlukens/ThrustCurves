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

  const tickStyle = { fill: '#6B8BA4', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }
  const axisLabelBase = {
    fontSize: 11,
    fontFamily: "'Barlow Condensed', sans-serif",
    letterSpacing: '0.08em',
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 60, bottom: 28, left: 16 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#1e2d3d" />
        <XAxis
          dataKey="rpm"
          type="number"
          domain={['auto', 'auto']}
          label={{
            value: 'RPM',
            position: 'insideBottom',
            offset: -14,
            fill: '#3D5568',
            ...axisLabelBase,
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
            fill: '#F59E0B',
            ...axisLabelBase,
          }}
          tick={tickStyle}
          width={64}
        />
        <YAxis
          yAxisId="power"
          orientation="right"
          label={{
            value: 'Power (hp)',
            angle: 90,
            position: 'insideRight',
            offset: 8,
            fill: '#00D4C8',
            ...axisLabelBase,
          }}
          tick={tickStyle}
          width={56}
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
          labelFormatter={(rpm: number) => `${rpm} RPM`}
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
        <Line
          yAxisId="torque"
          dataKey="torqueLbft"
          name="Torque (lb·ft)"
          stroke="#F59E0B"
          dot={false}
          strokeWidth={2}
          connectNulls={false}
        />
        <Line
          yAxisId="power"
          dataKey="powerHp"
          name="Power (hp)"
          stroke="#00D4C8"
          dot={false}
          strokeWidth={2}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
