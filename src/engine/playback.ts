import type { TimeStep } from '@/types/simulation'

/** State of one vehicle at an arbitrary playback time */
export interface PlaybackSample {
  speedMs: number
  distanceM: number
  gear: number
  rpm: number
  /** Gear change in progress (no drive force) */
  shifting: boolean
}

/**
 * Sample a fixed-step integration trace at time `t`, interpolating speed and
 * distance between steps. Past the end of the trace the vehicle holds its last
 * speed, so a rig that reached its target keeps cruising and one that topped
 * out keeps rolling at its plateau speed.
 */
export function sampleTrace(trace: TimeStep[], t: number): PlaybackSample {
  if (trace.length === 0) return { speedMs: 0, distanceM: 0, gear: 1, rpm: 0, shifting: false }

  const first = trace[0]
  if (t <= first.timeS) {
    return { speedMs: first.speedMs, distanceM: first.distanceM, gear: first.gear, rpm: first.rpm, shifting: false }
  }

  const last = trace[trace.length - 1]
  if (t >= last.timeS) {
    return {
      speedMs: last.speedMs,
      distanceM: last.distanceM + last.speedMs * (t - last.timeS),
      gear: last.gear,
      rpm: last.rpm,
      shifting: false,
    }
  }

  // Last step at or before t
  let lo = 0
  let hi = trace.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (trace[mid].timeS <= t) lo = mid
    else hi = mid
  }
  const a = trace[lo]
  const b = trace[hi]
  const f = (t - a.timeS) / (b.timeS - a.timeS)
  return {
    speedMs: a.speedMs + f * (b.speedMs - a.speedMs),
    distanceM: a.distanceM + f * (b.distanceM - a.distanceM),
    gear: a.gear,
    // Within one gear rpm tracks speed; across a shift keep the step's own value
    rpm: a.gear === b.gear ? a.rpm + f * (b.rpm - a.rpm) : a.rpm,
    // The integrator cuts drive force to zero for the duration of a gear change
    shifting: a.thrustN === 0,
  }
}

/**
 * How long to play a comparison: until the last rig that reaches the target
 * does so, plus a short tail so the finish is visible. When no rig reaches the
 * target, play until every trace has ended (they stop once speed plateaus).
 */
export function playbackDurationS(
  runs: { trace: TimeStep[]; finishTimeS: number | null }[],
  tailS = 1.5,
): number {
  const finishes = runs.map((r) => r.finishTimeS).filter((t): t is number => t !== null)
  if (finishes.length > 0) return Math.max(...finishes) + tailS
  return Math.max(0, ...runs.map((r) => r.trace.at(-1)?.timeS ?? 0))
}
