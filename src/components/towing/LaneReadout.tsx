import type { ReactNode } from 'react'
import { useUnitStore } from '@/store/unitStore'
import type { PlaybackSample } from '@/engine/playback'
import { fmtSpeedMs, gearLabel } from './format'

interface LaneReadoutProps {
  name: string
  color: string
  sample: PlaybackSample
  /** Gear held for this run, if any */
  heldGear?: number
  /** Redline speed of the held gear (m/s) */
  heldRedlineMs?: number
  /** Row height (px), to line up with the lane it describes */
  height: number
  /** Third line: gap, status, result */
  detail: ReactNode
  /** Full text of `detail` for the tooltip when it's truncated */
  detailTitle?: string
}

/** Gear readout: shift in progress, bouncing off the limiter in a held gear, or the gear */
function gearReadout(sample: PlaybackSample, heldGear?: number, heldRedlineMs?: number) {
  if (sample.shifting) return { text: 'shift', className: 'text-signal-hi' }
  const inHeld = heldGear !== undefined && sample.gear === heldGear
  if (inHeld && heldRedlineMs !== undefined && sample.speedMs >= heldRedlineMs * 0.995) {
    return { text: `${gearLabel(sample.gear)} redline`, className: 'text-amber-400' }
  }
  return { text: inHeld ? `${gearLabel(sample.gear)} held` : gearLabel(sample.gear), className: 'text-muted-txt' }
}

/** One lane's live readout: name, speed, gear, rpm, and a detail line */
export default function LaneReadout({
  name,
  color,
  sample,
  heldGear,
  heldRedlineMs,
  height,
  detail,
  detailTitle,
}: LaneReadoutProps) {
  const units = useUnitStore((s) => s.units)
  const gear = gearReadout(sample, heldGear, heldRedlineMs)
  return (
    <div className="flex gap-2 items-center" style={{ height }}>
      <div className="w-1 self-stretch my-2 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-[11px] tracking-wide text-label truncate" title={name}>
          {name}
        </div>
        <div className="flex items-baseline gap-2 font-data tabular-nums">
          <span className="text-sm text-data">{fmtSpeedMs(sample.speedMs, units)}</span>
          <span className={`text-[10px] ${gear.className}`} data-testid="lane-gear">
            {gear.text}
          </span>
          <span className="hidden sm:inline text-[10px] text-muted-txt">
            {Math.round(sample.rpm).toLocaleString()} rpm
          </span>
        </div>
        <div
          className="font-data text-[10px] tabular-nums text-muted-txt whitespace-nowrap overflow-hidden text-ellipsis"
          title={detailTitle}
        >
          {detail}
        </div>
      </div>
    </div>
  )
}
