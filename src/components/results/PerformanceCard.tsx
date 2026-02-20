import type { PerformanceMetrics } from '@/types/simulation'
import { fmtTime, fmtSpeed } from '@/utils/formatting'

interface PerformanceCardProps {
  performance: PerformanceMetrics
}

/** Split a formatted value string into numeric part and unit suffix */
function splitValue(v: string): { num: string; unit: string } {
  if (v === '—') return { num: '—', unit: '' }
  // "4.23s" → num="4.23", unit="s"
  // "125.5 mph" → num="125.5", unit=" mph"
  const match = v.match(/^([0-9.]+)(\s?.+)$/)
  if (match) return { num: match[1], unit: match[2].trim() }
  return { num: v, unit: '' }
}

interface MetricItem {
  label: string
  value: string
}

function MetricGauge({ label, value }: MetricItem) {
  const { num, unit } = splitValue(value)
  return (
    <div
      className="flex flex-col justify-between p-4 rounded-xl min-w-28 shrink-0"
      style={{
        background: 'var(--surface-3)',
        border: '1px solid var(--border)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <span
        className="font-ui text-xs font-semibold tracking-widest uppercase block mb-2"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span
          className="font-data text-3xl font-semibold leading-none"
          style={{ color: 'var(--text-primary)' }}
        >
          {num}
        </span>
        {unit && (
          <span
            className="font-data text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

export default function PerformanceCard({ performance }: PerformanceCardProps) {
  const metrics: MetricItem[] = [
    { label: '0–60 mph', value: fmtTime(performance.zeroTo60Mph) },
    { label: '0–100 km/h', value: fmtTime(performance.zeroTo100Kmh) },
    { label: '¼ Mile', value: fmtTime(performance.quarterMileS) },
    { label: '¼ Trap', value: fmtSpeed(performance.quarterMileSpeedMs) },
    { label: 'Top Speed', value: fmtSpeed(performance.topSpeedMs) },
  ]

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="inline-block w-0.5 h-4 rounded-full"
          style={{ background: 'var(--accent)' }}
        />
        <h2
          className="font-display text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--text-secondary)' }}
        >
          Performance Metrics
        </h2>
      </div>

      {/* Mobile: horizontal scroll. Desktop: grid */}
      <div className="flex overflow-x-auto gap-3 pb-1 md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
        {metrics.map(m => (
          <MetricGauge key={m.label} label={m.label} value={m.value} />
        ))}
      </div>
    </div>
  )
}
