import type { PerformanceMetrics } from '@/types/simulation'
import { fmtTime, fmtSpeed } from '@/utils/formatting'

interface PerformanceCardProps {
  performance: PerformanceMetrics
}

interface MetricDef {
  label: string
  value: string
}

export default function PerformanceCard({ performance }: PerformanceCardProps) {
  const metrics: MetricDef[] = [
    { label: '0–60 mph', value: fmtTime(performance.zeroTo60Mph) },
    { label: '0–100 km/h', value: fmtTime(performance.zeroTo100Kmh) },
    { label: '¼ Mile', value: fmtTime(performance.quarterMileS) },
    { label: '¼ Mile Trap', value: fmtSpeed(performance.quarterMileSpeedMs) },
    { label: 'Top Speed', value: fmtSpeed(performance.topSpeedMs) },
  ]

  return (
    <div className="rounded-xl border border-line bg-panel p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full bg-signal" />
        <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
          Performance Metrics
        </span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt">
              {label}
            </span>
            <span className="font-data text-3xl font-semibold text-data leading-none tabular-nums">
              {value}
            </span>
            {/* Red underline accent */}
            <div className="h-px w-8 bg-signal/40 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
