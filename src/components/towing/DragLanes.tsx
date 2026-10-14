import { useRef } from 'react'
import { useElementWidth } from '@/hooks/useElementWidth'
import { useUnitStore } from '@/store/unitStore'
import { M_TO_FT } from '@/utils/units'
import type { PlaybackSample } from '@/engine/playback'
import type { TrailerCategory } from '@/types/truck'
import { fmtSpeedMs, gearLabel } from './format'

/** One rig's lane at the current playback time */
export interface LaneState {
  key: string
  name: string
  color: string
  sample: PlaybackSample
  /** Time the target speed was reached, or null if this rig never reaches it */
  finishTimeS: number | null
  /** Distance covered when the target speed was reached (m) */
  finishDistanceM: number | null
  /** Gear held for this run, if any */
  heldGear?: number
  /** Redline speed of the held gear (m/s) */
  heldRedlineMs?: number
}

/** Gear readout: shift in progress, bouncing off the limiter in a held gear, or the gear */
function gearReadout(lane: LaneState): { text: string; className: string } {
  const { sample, heldGear, heldRedlineMs } = lane
  if (sample.shifting) return { text: 'shift', className: 'text-signal-hi' }
  const inHeld = heldGear !== undefined && sample.gear === heldGear
  if (inHeld && heldRedlineMs !== undefined && sample.speedMs >= heldRedlineMs * 0.995) {
    return { text: `${gearLabel(sample.gear)} redline`, className: 'text-amber-400' }
  }
  return { text: inHeld ? `${gearLabel(sample.gear)} held` : gearLabel(sample.gear), className: 'text-muted-txt' }
}

interface DragLanesProps {
  lanes: LaneState[]
  timeS: number
  trailerCategory: TrailerCategory
}

const LANE_H = 52
const RULER_H = 22

/** Crew cab, short bed (m) */
const TRUCK_LEN_M = 6.2
/** Bumper-pull hitch gap between the truck and trailer (m) */
const HITCH_GAP_M = 0.9
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

/** Lane-divider dash pattern: 10 ft dash, 30 ft gap (US standard) */
const DASH_M = 3.05
const DASH_CYCLE_M = 12.19

interface TrailerShape {
  lengthM: number
  /** Fifth wheels and goosenecks ride over the bed instead of trailing behind it */
  overBedM: number
  body: 'box' | 'deck'
}

const TRAILER_SHAPES: Record<TrailerCategory, TrailerShape> = {
  flatbed: { lengthM: 6.1, overBedM: 0, body: 'deck' },
  enclosed: { lengthM: 7.3, overBedM: 0, body: 'box' },
  travel: { lengthM: 8.5, overBedM: 0, body: 'box' },
  fifthwheel: { lengthM: 10.4, overBedM: 1.8, body: 'box' },
  boat: { lengthM: 7.3, overBedM: 0, body: 'deck' },
  gooseneck: { lengthM: 9.8, overBedM: 1.8, body: 'deck' },
}

/** Overall rig length from front bumper to trailer tail (m) */
function rigLengthM(shape: TrailerShape): number {
  const gap = shape.overBedM > 0 ? -shape.overBedM : HITCH_GAP_M
  return TRUCK_LEN_M + gap + shape.lengthM
}

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
export default function DragLanes({ lanes, timeS, trailerCategory }: DragLanesProps) {
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

  const height = lanes.length * LANE_H + RULER_H

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
      <div className="w-36 sm:w-48 shrink-0" style={{ paddingBottom: RULER_H }}>
        {lanes.map((lane) => {
          const gap = lead - lane.sample.distanceM
          const finished = lane.finishTimeS !== null && timeS >= lane.finishTimeS
          return (
            <div key={lane.key} className="flex gap-2 items-center" style={{ height: LANE_H }}>
              <div className="w-1 self-stretch my-2 rounded-full" style={{ backgroundColor: lane.color }} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-[11px] tracking-wide text-label truncate" title={lane.name}>
                  {lane.name}
                </div>
                <div className="flex items-baseline gap-2 font-data tabular-nums">
                  <span className="text-sm text-data">{fmtSpeedMs(lane.sample.speedMs, units)}</span>
                  <span className={`text-[10px] ${gearReadout(lane).className}`} data-testid="lane-gear">
                    {gearReadout(lane).text}
                  </span>
                </div>
                <div className="font-data text-[10px] tabular-nums text-muted-txt">
                  {gap < 0.05 ? 'lead' : `−${fmtGap(gap)}`}
                  {finished && <span className="text-emerald-400"> · {lane.finishTimeS!.toFixed(1)} s</span>}
                </div>
              </div>
            </div>
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
            <rect
              key={`bg-${lane.key}`}
              x={0}
              y={i * LANE_H}
              width={width}
              height={LANE_H}
              fill={i % 2 === 0 ? '#111116' : '#131319'}
            />
          ))}

          {/* Lane dividers scroll past as the camera moves */}
          {lanes.slice(1).map((lane, i) =>
            dashes.map((d) => (
              <rect
                key={`dash-${lane.key}-${d}`}
                x={toX(d)}
                y={(i + 1) * LANE_H - 1}
                width={DASH_M * scale}
                height={2}
                fill="#3a3a48"
              />
            )),
          )}

          {/* Start line */}
          <line x1={toX(0)} y1={0} x2={toX(0)} y2={lanes.length * LANE_H} stroke="#8888a0" strokeWidth={2} />

          {lanes.map((lane, i) => {
            const y = (i + 1) * LANE_H - 6
            const finished = lane.finishTimeS !== null && timeS >= lane.finishTimeS
            return (
              <g key={lane.key}>
                {finished && lane.finishDistanceM !== null && (
                  <g>
                    <line
                      x1={toX(lane.finishDistanceM)}
                      y1={i * LANE_H + 4}
                      x2={toX(lane.finishDistanceM)}
                      y2={(i + 1) * LANE_H - 4}
                      stroke={lane.color}
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                    />
                    <text
                      x={toX(lane.finishDistanceM) + 3}
                      y={i * LANE_H + 12}
                      fill={lane.color}
                      fontSize={9}
                      fontFamily='"JetBrains Mono", monospace'
                    >
                      {lane.finishTimeS!.toFixed(1)}s
                    </text>
                  </g>
                )}
                <Rig x={toX(lane.sample.distanceM)} y={y} scale={rigScale} color={lane.color} shape={shape} />
              </g>
            )
          })}

          {/* Distance ruler */}
          <line x1={0} y1={lanes.length * LANE_H} x2={width} y2={lanes.length * LANE_H} stroke="#2a2a35" />
          {ticks.map((d) => (
            <g key={`tick-${d}`}>
              <line
                x1={toX(d)}
                y1={lanes.length * LANE_H}
                x2={toX(d)}
                y2={lanes.length * LANE_H + 4}
                stroke="#2a2a35"
              />
              <text
                x={toX(d)}
                y={lanes.length * LANE_H + 15}
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
