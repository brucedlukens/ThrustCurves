import type { WhatIfSegmentResult } from '@/types/telemetry'
import { useUnitStore } from '@/store/unitStore'
import { MS_TO_MPH, MS_TO_KMH, M_TO_FT } from '@/utils/units'
import { fmtDelta } from './shared'

interface SegmentTableProps {
  results: WhatIfSegmentResult[]
  hasChange: boolean
}

export default function SegmentTable({ results, hasChange }: SegmentTableProps) {
  const units = useUnitStore(state => state.units)
  const speedFactor = units === 'imperial' ? MS_TO_MPH : MS_TO_KMH
  const distFactor = units === 'imperial' ? M_TO_FT : 1
  const distUnit = units === 'imperial' ? 'ft' : 'm'

  const spd = (ms: number) => (ms * speedFactor).toFixed(1)
  const dist = (m: number) => `${(m * distFactor).toFixed(0)} ${distUnit}`

  if (results.length === 0) {
    return (
      <p className="font-data text-xs text-muted-txt">
        No power-limited stretches found. The car was at a grip, braking or driver limit for the whole run.
      </p>
    )
  }

  const th = 'px-2 py-1.5 text-left font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt whitespace-nowrap'
  const td = 'px-2 py-1.5 font-data text-xs text-gray-200 tabular-nums whitespace-nowrap'

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-line">
            <th className={th}>#</th>
            <th className={th}>Stretch</th>
            <th className={th}>Entry</th>
            <th className={th}>Peak (base → mod)</th>
            <th className={th}>Exit (base → mod)</th>
            <th className={th}>Δ time</th>
            <th className={th}>Limit hit</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => {
            const flags: string[] = []
            if (r.gripLimitedAtM !== undefined) flags.push(`grip @ ${dist(r.gripLimitedAtM)}`)
            if (r.brakingLimitedAtM !== undefined) flags.push(`brake zone @ ${dist(r.brakingLimitedAtM)}`)
            if (r.revLimitedAtM !== undefined) flags.push(`rev limiter @ ${dist(r.revLimitedAtM)}`)
            const headroom = Number.isFinite(r.lineHeadroomRatio)
              ? `line headroom ×${r.lineHeadroomRatio.toFixed(2)}`
              : 'straight'
            return (
              <tr key={r.segment.index} className="border-b border-faint hover:bg-lift/60">
                <td className={td}>{i + 1}</td>
                <td className={td}>
                  {dist(r.segment.startM)} → {dist(r.segment.endM)}
                </td>
                <td className={td}>{spd(r.segment.entrySpeedMs)}</td>
                <td className={td}>
                  {spd(r.baselinePeakMs)}
                  {hasChange && <> → <span className={r.modifiedPeakMs > r.baselinePeakMs + 0.05 ? 'text-signal-hi' : ''}>{spd(r.modifiedPeakMs)}</span></>}
                </td>
                <td className={td}>
                  {spd(r.baselineExitMs)}
                  {hasChange && <> → {spd(r.modifiedExitMs)}</>}
                </td>
                <td className={`${td} ${r.deltaS < -0.0005 ? 'text-green-400' : r.deltaS > 0.0005 ? 'text-signal-hi' : 'text-label'}`}>
                  {hasChange ? fmtDelta(r.deltaS) : '—'}
                </td>
                <td className={`${td} text-label`}>
                  {hasChange && (flags.length > 0 ? flags.join(', ') : 'none')}
                  <span className="text-muted-txt">{hasChange ? ' · ' : ''}{headroom}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
