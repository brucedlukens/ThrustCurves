import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ReferenceArea,
} from 'recharts'
import type { TelemetryRun, WhatIfResult } from '@/types/telemetry'
import { useUnitStore } from '@/store/unitStore'
import { MS_TO_MPH, MS_TO_KMH, M_TO_FT } from '@/utils/units'
import { AXIS_LABEL_STYLE, AXIS_TICK, CHART_STYLE, LIMIT_COLORS, LIMIT_LABELS, LIMIT_ORDER } from './shared'

interface SpeedTraceChartProps {
  run: TelemetryRun
  result: WhatIfResult
}

interface Row {
  distance: number
  measured: number
  baseline: number
  modified: number
}

const MAX_POINTS = 800

export default function SpeedTraceChart({ run, result }: SpeedTraceChartProps) {
  const units = useUnitStore(state => state.units)
  const speedFactor = units === 'imperial' ? MS_TO_MPH : MS_TO_KMH
  const distFactor = units === 'imperial' ? M_TO_FT : 1
  const speedUnit = units === 'imperial' ? 'mph' : 'km/h'
  const distUnit = units === 'imperial' ? 'ft' : 'm'

  const step = Math.max(1, Math.ceil(run.samples.length / MAX_POINTS))
  const data: Row[] = []
  for (let i = 0; i < run.samples.length; i += step) {
    data.push({
      distance: parseFloat((run.samples[i].distanceM * distFactor).toFixed(1)),
      measured: parseFloat((result.measuredSpeedsMs[i] * speedFactor).toFixed(2)),
      baseline: parseFloat((result.baselineSpeedsMs[i] * speedFactor).toFixed(2)),
      modified: parseFloat((result.modifiedSpeedsMs[i] * speedFactor).toFixed(2)),
    })
  }

  const hasChange = result.modifiedSpeedsMs.some((v, i) => Math.abs(v - result.baselineSpeedsMs[i]) > 1e-6)

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {LIMIT_ORDER.map(kind => (
          <span key={kind} className="flex items-center gap-1.5 font-data text-[10px] text-label">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LIMIT_COLORS[kind], opacity: 0.6 }} />
            {LIMIT_LABELS[kind]}
          </span>
        ))}
      </div>
      <div className="flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 20, bottom: 28, left: 8 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1a1a22" vertical={false} />
            {result.segments.map(seg => (
              <ReferenceArea
                key={seg.index}
                x1={parseFloat((seg.startM * distFactor).toFixed(1))}
                x2={parseFloat((seg.endM * distFactor).toFixed(1))}
                fill={LIMIT_COLORS[seg.kind]}
                fillOpacity={seg.kind === 'driver' ? 0.06 : 0.12}
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />
            ))}
            <XAxis
              dataKey="distance"
              type="number"
              domain={[0, 'dataMax']}
              label={{ value: `DISTANCE (${distUnit.toUpperCase()})`, position: 'insideBottom', offset: -14, style: AXIS_LABEL_STYLE, letterSpacing: '0.1em' }}
              tick={AXIS_TICK}
              axisLine={{ stroke: '#2a2a35' }}
              tickLine={{ stroke: '#2a2a35' }}
            />
            <YAxis
              label={{ value: `SPEED (${speedUnit.toUpperCase()})`, angle: -90, position: 'insideLeft', offset: 12, style: AXIS_LABEL_STYLE, letterSpacing: '0.1em' }}
              tick={AXIS_TICK}
              axisLine={{ stroke: '#2a2a35' }}
              tickLine={{ stroke: '#2a2a35' }}
              width={52}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={CHART_STYLE}
              labelStyle={{ color: '#8888a0', fontSize: 11 }}
              itemStyle={{ fontSize: 11 }}
              formatter={(value: unknown, name: unknown) => [
                typeof value === 'number' ? `${value.toFixed(1)} ${speedUnit}` : '—',
                String(name),
              ]}
              labelFormatter={(label: unknown) => (typeof label === 'number' ? `${label.toFixed(0)} ${distUnit}` : '—')}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', paddingTop: 8 }} verticalAlign="top" height={24} />
            <Line type="monotone" dataKey="measured" name="Logged" stroke="#8888a0" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="baseline" name="Baseline model" stroke="#f0f0fa" strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
            {hasChange && (
              <Line type="monotone" dataKey="modified" name="Modified" stroke="#ef4444" strokeWidth={2.2} dot={false} isAnimationActive={false} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
