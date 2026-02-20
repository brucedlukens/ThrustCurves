import type { PerformanceMetrics } from '@/types/simulation'
import { fmtTime, fmtSpeed } from '@/utils/formatting'

interface PerformanceCardProps {
  performance: PerformanceMetrics
}

export default function PerformanceCard({ performance }: PerformanceCardProps) {
  const metrics = [
    { label: '0–60 mph', value: fmtTime(performance.zeroTo60Mph) },
    { label: '0–100 km/h', value: fmtTime(performance.zeroTo100Kmh) },
    { label: '¼ Mile', value: fmtTime(performance.quarterMileS) },
    { label: '¼ Mile Trap', value: fmtSpeed(performance.quarterMileSpeedMs) },
    { label: 'Top Speed', value: fmtSpeed(performance.topSpeedMs) },
  ]

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderTop: '2px solid var(--color-accent)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <h3
          className="text-[10px] uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}
        >
          Performance Metrics
        </h3>
      </div>

      {/* Mobile: horizontal scroll row */}
      <div className="flex overflow-x-auto snap-x md:hidden divide-x" style={{ '--tw-divide-opacity': '1' } as React.CSSProperties}>
        {metrics.map(({ label, value }) => (
          <div
            key={label}
            className="min-w-[120px] shrink-0 snap-start flex flex-col gap-1 p-4"
            style={{ borderRightColor: 'var(--color-border)' }}
          >
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
            >
              {label}
            </span>
            <span
              className="text-2xl font-medium leading-none"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-1)' }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop: 5-column grid */}
      <div className="hidden md:grid grid-cols-5 divide-x" style={{ '--tw-divide-opacity': '1' } as React.CSSProperties}>
        {metrics.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-2 p-4"
            style={{ borderRightColor: 'var(--color-border)' }}
          >
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
            >
              {label}
            </span>
            <span
              className="text-3xl font-medium leading-none"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-1)' }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
