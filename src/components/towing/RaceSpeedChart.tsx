import { memo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  ReferenceLine,
} from 'recharts'
import { MS_TO_MPH, MS_TO_KMH } from '@/utils/units'
import { useUnitStore } from '@/store/unitStore'
import { sampleTrace } from '@/engine/playback'
import type { TimeStep } from '@/types/simulation'

export interface RaceSeries {
  key: string
  name: string
  color: string
  trace: TimeStep[]
}

interface RaceSpeedChartProps {
  series: RaceSeries[]
  durationS: number
  /** Run target speed marker (m/s) */
  targetMs: number
  timeS: number
  onSeek: (timeS: number) => void
  /** Fit the speed axis to the data instead of starting at zero (small speed changes) */
  zoomSpeedAxis?: boolean
  /** Label on the reference speed line */
  targetLabel?: string
}

/** Chart sample interval (s) */
const STEP_S = 0.1

// Plot-area insets, needed to place the playhead over the chart without re-rendering it
const MARGIN = { top: 8, right: 28, bottom: 28, left: 20 }
const Y_AXIS_W = 56
const X_AXIS_H = 30

const AXIS_TICK = { fill: '#8888a0', fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }
const AXIS_LABEL_STYLE = { fill: '#55556a', fontSize: 11, fontFamily: '"Barlow Condensed", sans-serif' }
const TOOLTIP_STYLE = {
  backgroundColor: '#0f0f12',
  border: '1px solid #2a2a35',
  borderRadius: '6px',
  fontFamily: '"JetBrains Mono", monospace',
}

interface CurvesProps {
  series: RaceSeries[]
  durationS: number
  targetMs: number
  onSeek: (timeS: number) => void
  zoomSpeedAxis: boolean
  targetLabel: string
}

/** The curves alone, memoized so playback frames only move the playhead */
const Curves = memo(function Curves({
  series,
  durationS,
  targetMs,
  onSeek,
  zoomSpeedAxis,
  targetLabel,
}: CurvesProps) {
  const units = useUnitStore((s) => s.units)
  const factor = units === 'imperial' ? MS_TO_MPH : MS_TO_KMH
  const speedUnit = units === 'imperial' ? 'mph' : 'km/h'

  const data: Record<string, number>[] = []
  for (let i = 0; i * STEP_S <= durationS + 1e-9; i++) {
    const t = i * STEP_S
    const row: Record<string, number> = { t: parseFloat(t.toFixed(2)) }
    series.forEach((s, j) => {
      row[`v${j}`] = parseFloat((sampleTrace(s.trace, t).speedMs * factor).toFixed(2))
    })
    data.push(row)
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={MARGIN}
        onClick={(state) => {
          const label = state?.activeLabel
          if (label !== undefined) onSeek(Number(label))
        }}
      >
        <CartesianGrid strokeDasharray="2 4" stroke="#1a1a22" vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          domain={[0, durationS]}
          allowDataOverflow
          height={X_AXIS_H}
          tickFormatter={(v: number) => v.toFixed(0)}
          label={{ value: 'TIME (S)', position: 'insideBottom', offset: -14, style: AXIS_LABEL_STYLE }}
          tick={AXIS_TICK}
          axisLine={{ stroke: '#2a2a35' }}
          tickLine={{ stroke: '#2a2a35' }}
        />
        <YAxis
          width={Y_AXIS_W}
          domain={zoomSpeedAxis ? [(min: number) => Math.floor(min - 3), (max: number) => Math.ceil(max + 2)] : undefined}
          allowDecimals={false}
          label={{
            value: `SPEED (${speedUnit.toUpperCase()})`,
            angle: -90,
            position: 'insideLeft',
            offset: 8,
            style: AXIS_LABEL_STYLE,
          }}
          tick={AXIS_TICK}
          axisLine={{ stroke: '#2a2a35' }}
          tickLine={{ stroke: '#2a2a35' }}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: '#8888a0', fontSize: 11 }}
          itemStyle={{ fontSize: 11 }}
          formatter={(value: number, name: string) => [`${value.toFixed(1)} ${speedUnit}`, name]}
          labelFormatter={(label: number) => `${Number(label).toFixed(1)} s`}
        />
        <ReferenceLine
          y={parseFloat((targetMs * factor).toFixed(1))}
          stroke="#8888a0"
          strokeDasharray="4 4"
          label={{ value: targetLabel, position: 'insideTopLeft', style: { fill: '#8888a0', fontSize: 10 } }}
        />
        {series.map((s, j) => (
          <Line
            key={s.key}
            dataKey={`v${j}`}
            name={s.name}
            stroke={s.color}
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
})

/**
 * Speed vs time for every rig, with a playhead synced to the lane animation.
 * Clicking the chart seeks playback to that time.
 */
export default function RaceSpeedChart({
  series,
  durationS,
  targetMs,
  timeS,
  onSeek,
  zoomSpeedAxis = false,
  targetLabel = 'target',
}: RaceSpeedChartProps) {
  const frac = durationS > 0 ? timeS / durationS : 0
  const plotLeft = MARGIN.left + Y_AXIS_W
  const plotInset = plotLeft + MARGIN.right
  return (
    <div className="relative w-full h-full cursor-crosshair">
      <Curves series={series} durationS={durationS} targetMs={targetMs} onSeek={onSeek} zoomSpeedAxis={zoomSpeedAxis}
        targetLabel={targetLabel}
      />
      <div
        aria-hidden
        className="absolute w-px bg-data/60 pointer-events-none"
        style={{
          top: MARGIN.top,
          bottom: MARGIN.bottom + X_AXIS_H,
          left: `calc(${plotLeft}px + (100% - ${plotInset}px) * ${frac})`,
        }}
      />
    </div>
  )
}
