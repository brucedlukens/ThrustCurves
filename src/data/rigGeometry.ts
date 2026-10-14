import type { TrailerCategory } from '@/types/truck'

/** Crew cab, short bed (m) */
export const TRUCK_LEN_M = 6.2
/** Truck width, mirrors folded (m) */
export const TRUCK_WIDTH_M = 2.0
/** Bumper-pull hitch gap between the truck and trailer (m) */
export const HITCH_GAP_M = 0.9

/** Representative trailer body per category, for drawing and rig length */
export interface TrailerShape {
  lengthM: number
  widthM: number
  /** Fifth wheels and goosenecks ride over the bed instead of trailing behind it */
  overBedM: number
  body: 'box' | 'deck'
}

export const TRAILER_SHAPES: Record<TrailerCategory, TrailerShape> = {
  flatbed: { lengthM: 6.1, widthM: 2.4, overBedM: 0, body: 'deck' },
  enclosed: { lengthM: 7.3, widthM: 2.6, overBedM: 0, body: 'box' },
  travel: { lengthM: 8.5, widthM: 2.6, overBedM: 0, body: 'box' },
  fifthwheel: { lengthM: 10.4, widthM: 2.6, overBedM: 1.8, body: 'box' },
  boat: { lengthM: 7.3, widthM: 2.6, overBedM: 0, body: 'deck' },
  gooseneck: { lengthM: 9.8, widthM: 2.6, overBedM: 1.8, body: 'deck' },
}

/** Overall rig length from front bumper to trailer tail (m) */
export function rigLengthM(shape: TrailerShape): number {
  const gap = shape.overBedM > 0 ? -shape.overBedM : HITCH_GAP_M
  return TRUCK_LEN_M + gap + shape.lengthM
}
