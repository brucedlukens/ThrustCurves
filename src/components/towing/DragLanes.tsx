import { useRef } from 'react'
import { useElementWidth } from '@/hooks/useElementWidth'
import { useUnitStore } from '@/store/unitStore'
import { M_TO_FT } from '@/utils/units'
import type { PlaybackSample } from '@/engine/playback'
import type { TrailerCategory } from '@/types/truck'
import { HITCH_GAP_M, TRAILER_SHAPES, TRUCK_LEN_M, rigLengthM } from '@/data/rigGeometry'
import type { TrailerShape } from '@/data/rigGeometry'
import LaneReadout from './LaneReadout'

/** One rig's lane at the current playback time */
export interface LaneState {
  key: string
  name: string
  color: string
  sample: PlaybackSample
  /** Time the target speed was reached, or null if this rig never reaches it */
  finishTimeS: number | null
  /** Where to mark the finish in the lane (m), or null for no marker */
  finishDistanceM: number | null
  /** Shown in the readout (and on the marker) once `finishTimeS` passes, e.g. "14.5 s" */
  finishLabel: string | null
  /** Gear held for this run, if any */
  heldGear?: number
  /** Redline speed of the held gear (m/s) */
  heldRedlineMs?: number
}

interface DragLanesProps {
  lanes: LaneState[]
  timeS: number
  trailerCategory: TrailerCategory
  /** Road grade from the start line on (%); drawn steeper than life so it reads */
  gradePercent?: number
}

const LANE_H = 52
const RULER_H = 22

/** Heights above the ground (m) */
const WHEEL_R_M = 0.4
const BODY_BOTTOM_M = 0.55
const HOOD_TOP_M = 1.35
const ROOF_M = 1.95
const BOX_TOP_M = 3.0
const DECK_TOP_M = 0.85

/** Rig drawing scale cap (px/m); rigs keep true proportions at one fixed size */
const MAX_RIG_PX_PER_M = 9
/** Track padding left of the last rig and right of the leader (px) */
const PAD_L = 12
const PAD_R = 24

/** Grades are drawn this many times steeper than life, up to MAX_VISUAL_SLOPE_DEG */
const GRADE_EXAGGERATION = 3
const MAX_VISUAL_SLOPE_DEG = 20

/** Lane-divider dash pattern: 10 ft dash, 30 ft gap (US standard) */
const DASH_M = 3.05
const DASH_CYCLE_M = 12.19

/** A 1/2/5 × 10ⁿ step giving roughly `targetTicks` ticks across `span` */
function niceStep(span: number, targetTicks: number): number {
  const raw = span / targetTicks
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  return (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag
}

interface RigProps {
  /** Front bumper x (px) */
  x: number
  /** Ground line y (px) */
  y: number
  /** px per metre */
  scale: number
  color: string
  shape: TrailerShape
}

function Rig({ x, y, scale, color, shape }: RigProps) {
  // Uniform scale in both directions so proportions never change
  const m = (metres: number) => metres * scale
  const h = (metres: number) => y - metres * scale
  const axleY = h(WHEEL_R_M)
  const bodyBottom = h(BODY_BOTTOM_M)

  // Truck, facing right: hood, cab, bed
  const hoodEnd = x - m(1.7)
  const cabEnd = x - m(3.4)
  const bedEnd = x - m(TRUCK_LEN_M)
  const truckPath = [
    `M ${x} ${bodyBottom}`,
    `L ${x} ${h(HOOD_TOP_M - 0.2)}`,
    `L ${x - m(0.3)} ${h(HOOD_TOP_M)}`,
    `L ${hoodEnd} ${h(HOOD_TOP_M)}`,
    `L ${hoodEnd - m(0.6)} ${h(ROOF_M)}`,
    `L ${cabEnd} ${h(ROOF_M)}`,
    `L ${cabEnd} ${h(HOOD_TOP_M)}`,
    `L ${bedEnd} ${h(HOOD_TOP_M)}`,
    `L ${bedEnd} ${bodyBottom}`,
    'Z',
  ].join(' ')

  const trailerFront = shape.overBedM > 0 ? bedEnd + m(shape.overBedM) : bedEnd - m(HITCH_GAP_M)
  const trailerTail = trailerFront - m(shape.lengthM)
  const trailerAxle = trailerTail + m(shape.lengthM * 0.3)
  const trailerTop = h(shape.body === 'box' ? BOX_TOP_M : DECK_TOP_M)

  return (
    <g>
      {/* Tongue / neck */}
      {shape.overBedM === 0 ? (
        <line
          x1={trailerFront}
          y1={h(BODY_BOTTOM_M + 0.2)}
          x2={bedEnd}
          y2={h(BODY_BOTTOM_M + 0.2)}
          stroke="#55556a"
          strokeWidth={1.5}
        />
      ) : (
        <line x1={trailerFront} y1={trailerTop} x2={trailerFront} y2={h(HOOD_TOP_M)} stroke="#55556a" strokeWidth={2} />
      )}
      <rect
        x={trailerTail}
        y={trailerTop}
        width={Math.max(1, trailerFront - trailerTail)}
        height={Math.max(1, bodyBottom - trailerTop)}
        rx={1.5}
        fill="#2a2a35"
        stroke={color}
        strokeOpacity={0.5}
      />
      <path d={truckPath} fill={color} />
      {/* Windows */}
      <rect
        x={cabEnd + m(0.2)}
        y={h(ROOF_M - 0.12)}
        width={Math.max(0, hoodEnd - m(0.5) - cabEnd - m(0.2))}
        height={m(0.4)}
        fill="#0f0f12"
        opacity={0.7}
      />
      {[x - m(1.0), x - m(4.9), trailerAxle].map((wx, i) => (
        <circle key={i} cx={wx} cy={axleY} r={m(WHEEL_R_M)} fill="#0f0f12" stroke="#8888a0" strokeWidth={1} />
      ))}
    </g>
  )
}

/**
 * Side-by-side lanes. Rigs are drawn at one fixed, true-proportion size; the
 * road and distance ruler zoom instead. At the start the road is at the same
 * scale as the rigs, and the camera zooms out as the pack spreads so everyone
 * stays in view.
 */
export default function DragLanes({ lanes, timeS, trailerCategory, gradePercent = 0 }: DragLanesProps) {
  const units = useUnitStore((s) => s.units)
  const imperial = units === 'imperial'
  const trackRef = useRef<HTMLDivElement>(null)
  const width = useElementWidth(trackRef, 600)

  const shape = TRAILER_SHAPES[trailerCategory]
  const rigLen = rigLengthM(shape)

  const rigScale = Math.min(MAX_RIG_PX_PER_M, width / (rigLen * 3))
  const rigPx = rigLen * rigScale

  // Camera: fit the pack, from the rear of the last rig to the front of the
  // leader. The road starts at the rigs' own scale and only zooms out from there.
  const distances = lanes.map((l) => l.sample.distanceM)
  const lead = Math.max(0, ...distances)
  const tail = Math.min(lead, ...distances)
  const roadPx = Math.max(1, width - PAD_L - PAD_R - rigPx)
  const spreadM = lead - tail
  const scale = Math.min(rigScale, roadPx / Math.max(spreadM, 1e-6))
  // Spare room while the pack is tight goes mostly ahead of the leader
  const spareM = roadPx / scale - spreadM
  const leftM = tail - (PAD_L + rigPx) / scale - spareM * 0.3
  const windowM = width / scale
  const rightM = leftM + windowM
  const toX = (d: number) => (d - leftM) * scale

  // Grade: the road is flat before the start line and climbs (or falls) after
  // it at a fixed on-screen slope. `lift` is the road's height at screen x,
  // relative to the left edge, so the camera follows the road vertically too.
  const maxSlope = Math.tan((MAX_VISUAL_SLOPE_DEG * Math.PI) / 180)
  const slope = Math.max(-maxSlope, Math.min(maxSlope, (gradePercent / 100) * GRADE_EXAGGERATION))
  const x0 = toX(0)
  const lift = (x: number) => slope * (Math.max(x, x0) - Math.max(0, x0))
  // Constant headroom for the steepest the view can get, so the layout never jumps
  const extraH = Math.abs(slope) * width
  const topPad = slope > 0 ? extraH : 0
  const laneTop = (i: number, x: number) => topPad + i * LANE_H - lift(x)
  const lanesH = lanes.length * LANE_H
  const height = lanesH + extraH + RULER_H
  const rulerY = lanesH + extraH
  // Polyline breakpoints across the view: left edge, start line, right edge
  const xs = [0, Math.min(width, Math.max(0, x0)), width]

  const dashes: number[] = []
  for (let k = Math.floor(leftM / DASH_CYCLE_M); k * DASH_CYCLE_M < rightM; k++) dashes.push(k * DASH_CYCLE_M)

  const unitPerM = imperial ? M_TO_FT : 1
  const distUnit = imperial ? 'ft' : 'm'
  const tickStepM = niceStep(windowM * unitPerM, Math.max(3, Math.floor(width / 110))) / unitPerM
  const ticks: number[] = []
  for (let k = Math.ceil(leftM / tickStepM); k * tickStepM <= rightM; k++) ticks.push(k * tickStepM)

  const fmtGap = (m: number) => `${Math.round(m * unitPerM).toLocaleString()} ${distUnit}`

  return (
    <div className="flex gap-3">
      {/* Per-lane readouts */}
      <div className="w-36 sm:w-48 shrink-0" style={{ paddingTop: topPad }}>
        {lanes.map((lane) => {
          const gap = lead - lane.sample.distanceM
          const finished = lane.finishTimeS !== null && timeS >= lane.finishTimeS
          return (
            <LaneReadout
              key={lane.key}
              name={lane.name}
              color={lane.color}
              sample={lane.sample}
              heldGear={lane.heldGear}
              heldRedlineMs={lane.heldRedlineMs}
              height={LANE_H}
              detailTitle={finished && lane.finishLabel ? lane.finishLabel : undefined}
              detail={
                <>
                  {gap < 0.05 ? 'lead' : `−${fmtGap(gap)}`}
                  {finished && lane.finishLabel && (
                    <span className="text-emerald-400" data-testid="lane-finish">
                      {' '}
                      · {lane.finishLabel}
                    </span>
                  )}
                </>
              }
            />
          )
        })}
      </div>

      {/* Track */}
      <div ref={trackRef} className="flex-1 min-w-0">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="Rigs accelerating side by side"
          className="block"
        >
          {lanes.map((lane, i) => (
            <polygon
              key={`bg-${lane.key}`}
              points={[
                ...xs.map((x) => `${x},${laneTop(i, x)}`),
                ...[...xs].reverse().map((x) => `${x},${laneTop(i + 1, x)}`),
              ].join(' ')}
              fill={i % 2 === 0 ? '#111116' : '#131319'}
            />
          ))}

          {/* Lane dividers scroll past as the camera moves */}
          {lanes.slice(1).map((lane, i) =>
            dashes.map((d) => {
              const xa = toX(d)
              const xb = toX(d + DASH_M)
              return (
                <line
                  key={`dash-${lane.key}-${d}`}
                  x1={xa}
                  y1={laneTop(i + 1, xa)}
                  x2={xb}
                  y2={laneTop(i + 1, xb)}
                  stroke="#3a3a48"
                  strokeWidth={2}
                />
              )
            }),
          )}

          {/* Start line (where the grade begins) */}
          <line x1={x0} y1={laneTop(0, x0)} x2={x0} y2={laneTop(lanes.length, x0)} stroke="#8888a0" strokeWidth={2} />
          {/* Grade caption in the empty corner above the road: top-left uphill, top-right downhill */}
          {gradePercent !== 0 && (
            <text
              x={slope > 0 ? 4 : width - 4}
              y={11}
              textAnchor={slope > 0 ? 'start' : 'end'}
              fill="#8888a0"
              fontSize={9}
              fontFamily='"JetBrains Mono", monospace'
            >
              {gradePercent > 0 ? '+' : ''}
              {gradePercent}% grade (drawn {GRADE_EXAGGERATION}× steeper)
            </text>
          )}

          {lanes.map((lane, i) => {
            const finished = lane.finishTimeS !== null && timeS >= lane.finishTimeS
            const xFront = toX(lane.sample.distanceM)
            const yFront = laneTop(i + 1, xFront) - 6
            // Tilt the rig along the road under it (partly on the grade while crossing the start)
            const tiltDeg = (Math.atan2(lift(xFront) - lift(xFront - rigPx), rigPx) * 180) / Math.PI
            const xFinish = lane.finishDistanceM !== null ? toX(lane.finishDistanceM) : 0
            return (
              <g key={lane.key}>
                {finished && lane.finishDistanceM !== null && (
                  <g>
                    <line
                      x1={xFinish}
                      y1={laneTop(i, xFinish) + 4}
                      x2={xFinish}
                      y2={laneTop(i + 1, xFinish) - 4}
                      stroke={lane.color}
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                    />
                    <text
                      x={xFinish + 3}
                      y={laneTop(i, xFinish) + 12}
                      fill={lane.color}
                      fontSize={9}
                      fontFamily='"JetBrains Mono", monospace'
                    >
                      {lane.finishLabel}
                    </text>
                  </g>
                )}
                <g transform={tiltDeg !== 0 ? `rotate(${-tiltDeg} ${xFront} ${yFront})` : undefined}>
                  <Rig x={xFront} y={yFront} scale={rigScale} color={lane.color} shape={shape} />
                </g>
              </g>
            )
          })}

          {/* Distance ruler */}
          <line x1={0} y1={rulerY} x2={width} y2={rulerY} stroke="#2a2a35" />
          {ticks.map((d) => (
            <g key={`tick-${d}`}>
              <line
                x1={toX(d)}
                y1={rulerY}
                x2={toX(d)}
                y2={rulerY + 4}
                stroke="#2a2a35"
              />
              <text
                x={toX(d)}
                y={rulerY + 15}
                textAnchor="middle"
                fill="#55556a"
                fontSize={9}
                fontFamily='"JetBrains Mono", monospace'
              >
                {/* + 0 normalizes -0 so the start tick never reads "-0" */}
                {(Math.round(d * unitPerM) + 0).toLocaleString()} {distUnit}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
