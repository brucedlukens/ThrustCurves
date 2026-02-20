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
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Performance Metrics
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-lg font-bold text-gray-100">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
