import type { PerformanceMetrics } from '@/types/simulation'
import { fmtTime, fmtSpeed } from '@/utils/formatting'

interface PerformanceCardProps {
  performance: PerformanceMetrics
}

interface MetricDef {
  label: string
  value: string
}

function splitValue(formatted: string): { number: string; unit: string } {
  // Split "4.32s" → { number: "4.32", unit: "s" }
  // Split "153.2 mph" → { number: "153.2", unit: "mph" }
  const m = formatted.match(/^([\d.]+)\s*(.*)$/)
  if (m) return { number: m[1], unit: m[2] }
  return { number: formatted, unit: '' }
}

export default function PerformanceCard({ performance }: PerformanceCardProps) {
  const metrics: MetricDef[] = [
    { label: '0–60 mph', value: fmtTime(performance.zeroTo60Mph) },
    { label: '0–100 km/h', value: fmtTime(performance.zeroTo100Kmh) },
    { label: '¼ Mile', value: fmtTime(performance.quarterMileS) },
    { label: '¼ Trap Speed', value: fmtSpeed(performance.quarterMileSpeedMs) },
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
        {metrics.map(({ label, value }) => {
          const { number, unit } = splitValue(value)
          return (
            <div key={label} className="flex flex-col gap-1">
              <span className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt">
                {label}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-data text-3xl font-semibold text-data leading-none tabular-nums">
                  {number}
                </span>
                {unit && (
                  <span className="font-data text-sm text-label">{unit}</span>
                )}
              </div>
              {/* Red underline accent */}
              <div className="h-px w-8 bg-signal/40 rounded-full" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
