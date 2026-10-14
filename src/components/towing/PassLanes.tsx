import { useRef } from 'react'
import { useElementWidth } from '@/hooks/useElementWidth'
import { useUnitStore } from '@/store/unitStore'
import { LANE_CHANGE_S, PASS_GAP_M, SEMI_LENGTH_M } from '@/engine/towing'
import type { PlaybackSample } from '@/engine/playback'
import { TRAILER_SHAPES, TRUCK_LEN_M, TRUCK_WIDTH_M, HITCH_GAP_M, rigLengthM } from '@/data/rigGeometry'
import type { TrailerCategory } from '@/types/truck'
import LaneReadout from './LaneReadout'
import { fmtDistanceM } from './format'

/** One rig passing its own semi at the current playback time */
export interface PassLaneState {
  key: string
  name: string
  color: string
  sample: PlaybackSample
  heldGear?: number
  heldRedlineMs?: number
  /** Far enough ahead to start pulling back in (s), or null if it never gets there */
  clearTimeS: number | null
  /** Back in its lane (s) */
  passTimeS: number | null
  /** Shown once the pass is complete, e.g. "9.8 s · needs 1,420 ft clear" */
  resultLabel: string | null
}

interface PassLanesProps {
  lanes: PassLaneState[]
  timeS: number
  semiSpeedMs: number
  trailerCategory: TrailerCategory
}

/** Lane width (m), shoulder width (m) */
const LANE_W_M = 3.7
const SHOULDER_M = 1.2
/** Semi: 53 ft trailer + tractor, widths (m) */
const SEMI_TRAILER_M = 16.2
const SEMI_WIDTH_M = 2.6
/** Centre-line dash pattern: 10 ft dash, 30 ft gap */
const DASH_M = 3.05
const DASH_CYCLE_M = 12.19
/** Readout rows need at least this much height (px) */
const MIN_ROW_H = 52

/** Ease in and out over [0, 1] */
function smoothstep(f: number): number {
  const x = Math.max(0, Math.min(1, f))
  return x * x * (3 - 2 * x)
}

/**
 * Top-down view of every rig passing its own semi. The camera rides with the
 * semi, so the semi stays put and each rig moves up past it; the road markings
 * scroll by at the semi's speed. Everything is drawn to one scale.
 */
export default function PassLanes({ lanes, timeS, semiSpeedMs, trailerCategory }: PassLanesProps) {
  const units = useUnitStore((s) => s.units)
  const trackRef = useRef<HTMLDivElement>(null)
  const width = useElementWidth(trackRef, 600)

  const shape = TRAILER_SHAPES[trailerCategory]
  const rigLen = rigLengthM(shape)

  // Frame, in metres relative to the semi's rear (forward = +): from behind the
  // rig's starting spot to just past where it pulls back in
  const leftM = -(PASS_GAP_M + rigLen) - 4
  const rightM = SEMI_LENGTH_M + PASS_GAP_M + rigLen + 6
  const scale = width / (rightM - leftM)
  const toX = (m: number) => (m - leftM) * scale

  const roadH = (2 * LANE_W_M + 2 * SHOULDER_M) * scale
  const rowH = Math.max(MIN_ROW_H, roadH + 8)
  const height = lanes.length * rowH

  // Centre-line dashes are fixed to the road, which moves back past the semi
  const roadOffsetM = semiSpeedMs * timeS
  const dashes: number[] = []
  for (let k = Math.floor((leftM + roadOffsetM) / DASH_CYCLE_M); k * DASH_CYCLE_M - roadOffsetM < rightM; k++) {
    dashes.push(k * DASH_CYCLE_M - roadOffsetM)
  }


  return (
    <div className="flex gap-3">
      <div className="w-36 sm:w-48 shrink-0">
        {lanes.map((lane) => {
          const done = lane.passTimeS !== null && timeS >= lane.passTimeS
          const pullingIn = lane.clearTimeS !== null && timeS >= lane.clearTimeS && !done
          return (
            <LaneReadout
              key={lane.key}
              name={lane.name}
              color={lane.color}
              sample={lane.sample}
              heldGear={lane.heldGear}
              heldRedlineMs={lane.heldRedlineMs}
              height={rowH}
              detailTitle={done && lane.resultLabel ? lane.resultLabel : undefined}
              detail={
                done && lane.resultLabel ? (
                  <span className="text-emerald-400" data-testid="lane-finish">
                    {lane.resultLabel}
                  </span>
                ) : lane.clearTimeS === null && timeS > LANE_CHANGE_S ? (
                  <span className="text-red-400" data-testid="lane-finish">
                    can't get by
                  </span>
                ) : (
                  `${pullingIn ? 'pulling in' : 'passing'} · ${timeS.toFixed(1)} s`
                )
              }
            />
          )
        })}
      </div>

      <div ref={trackRef} className="flex-1 min-w-0">
        <svg width={width} height={height} role="img" aria-label="Rigs passing a semi" className="block">
          {lanes.map((lane, i) => {
            const roadTop = i * rowH + (rowH - roadH) / 2
            const passLaneY = roadTop + (SHOULDER_M + LANE_W_M / 2) * scale
            const ownLaneY = roadTop + (SHOULDER_M + LANE_W_M * 1.5) * scale
            const centreY = roadTop + (SHOULDER_M + LANE_W_M) * scale

            // Rig front relative to the semi's rear
            const frontM = -PASS_GAP_M + (lane.sample.distanceM - semiSpeedMs * timeS)
            const out = smoothstep(timeS / LANE_CHANGE_S)
            const back = lane.clearTimeS !== null ? smoothstep((timeS - lane.clearTimeS) / LANE_CHANGE_S) : 0
            const y = ownLaneY + (passLaneY - ownLaneY) * (out - back)

            const xFront = toX(frontM)
            const truckRear = xFront - TRUCK_LEN_M * scale
            const trailerFront =
              shape.overBedM > 0 ? truckRear + shape.overBedM * scale : truckRear - HITCH_GAP_M * scale
            const trailerLen = shape.lengthM * scale
            const semiTractorM = SEMI_LENGTH_M - SEMI_TRAILER_M

            return (
              <g key={lane.key}>
                {/* Road: shoulders, edge lines, centre line */}
                <rect x={0} y={roadTop} width={width} height={roadH} fill="#141419" />
                <line x1={0} x2={width} y1={roadTop + SHOULDER_M * scale} y2={roadTop + SHOULDER_M * scale} stroke="#55556a" strokeWidth={1} />
                <line
                  x1={0}
                  x2={width}
                  y1={roadTop + roadH - SHOULDER_M * scale}
                  y2={roadTop + roadH - SHOULDER_M * scale}
                  stroke="#55556a"
                  strokeWidth={1}
                />
                {dashes.map((d) => (
                  <rect
                    key={`c-${lane.key}-${d}`}
                    x={toX(d)}
                    y={centreY - 1}
                    width={DASH_M * scale}
                    height={2}
                    fill="#a3832a"
                  />
                ))}

                {/* Semi, holding its lane and speed */}
                <rect
                  x={toX(0)}
                  y={ownLaneY - (SEMI_WIDTH_M / 2) * scale}
                  width={SEMI_TRAILER_M * scale}
                  height={SEMI_WIDTH_M * scale}
                  rx={1}
                  fill="#2a2a35"
                  stroke="#55556a"
                />
                <rect
                  x={toX(SEMI_TRAILER_M + 0.4)}
                  y={ownLaneY - (SEMI_WIDTH_M / 2) * scale}
                  width={(semiTractorM - 0.4) * scale}
                  height={SEMI_WIDTH_M * scale}
                  rx={1.5}
                  fill="#3a3a48"
                />

                {/* The rig: trailer, hitch, truck with windshield */}
                <rect
                  x={trailerFront - trailerLen}
                  y={y - (shape.widthM / 2) * scale}
                  width={trailerLen}
                  height={shape.widthM * scale}
                  rx={1}
                  fill="#23232c"
                  stroke={lane.color}
                  strokeOpacity={0.6}
                />
                {shape.overBedM === 0 && (
                  <line x1={trailerFront} x2={truckRear} y1={y} y2={y} stroke="#55556a" strokeWidth={1.5} />
                )}
                <rect
                  x={truckRear}
                  y={y - (TRUCK_WIDTH_M / 2) * scale}
                  width={TRUCK_LEN_M * scale}
                  height={TRUCK_WIDTH_M * scale}
                  rx={1.5}
                  fill={lane.color}
                />
                <rect
                  x={xFront - 2.3 * scale}
                  y={y - (TRUCK_WIDTH_M / 2 - 0.2) * scale}
                  width={0.5 * scale}
                  height={(TRUCK_WIDTH_M - 0.4) * scale}
                  fill="#0f0f12"
                  opacity={0.7}
                />
              </g>
            )
          })}
        </svg>
        <p className="font-data text-[10px] text-muted-txt mt-1">
          Semi {fmtDistanceM(SEMI_LENGTH_M, units)}; pull out {fmtDistanceM(PASS_GAP_M, units)} behind it, pull back in {fmtDistanceM(PASS_GAP_M, units)}{' '}
          ahead. Drawn to scale.
        </p>
      </div>
    </div>
  )
}
