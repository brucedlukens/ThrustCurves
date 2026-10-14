import { useCallback, useEffect, useState } from 'react'

/** Longest wall-clock step applied per frame, so a backgrounded tab doesn't jump ahead (s) */
const MAX_FRAME_S = 0.1

export interface Playback {
  timeS: number
  playing: boolean
  rate: number
  play: () => void
  pause: () => void
  restart: () => void
  seek: (timeS: number) => void
  setRate: (rate: number) => void
}

/**
 * A requestAnimationFrame-driven clock over [0, durationS]. Stops at the end;
 * playing again from the end starts over. Changing `resetToken` rewinds and
 * pauses, e.g. when the underlying simulation is recomputed.
 */
export function usePlayback(durationS: number, resetToken: unknown): Playback {
  const [timeS, setTimeS] = useState(0)
  const [wantPlaying, setWantPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [token, setToken] = useState(resetToken)

  if (token !== resetToken) {
    setToken(resetToken)
    setTimeS(0)
    setWantPlaying(false)
  }

  const playing = wantPlaying && timeS < durationS

  // Stable so memoized consumers (e.g. a chart's click handler) don't re-render every frame
  const seek = useCallback(
    (t: number) => setTimeS(Math.max(0, Math.min(durationS, t))),
    [durationS],
  )

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last: number | null = null
    const tick = (now: number) => {
      const dt = last === null ? 0 : Math.min(MAX_FRAME_S, (now - last) / 1000)
      last = now
      setTimeS((t) => Math.min(durationS, t + dt * rate))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, rate, durationS])

  return {
    timeS: Math.min(timeS, durationS),
    playing,
    rate,
    play: () => {
      if (timeS >= durationS) setTimeS(0)
      setWantPlaying(true)
    },
    pause: () => setWantPlaying(false),
    restart: () => {
      setTimeS(0)
      setWantPlaying(true)
    },
    seek,
    setRate,
  }
}
