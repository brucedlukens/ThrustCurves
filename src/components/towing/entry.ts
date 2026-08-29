import type { TowingAnalysis } from '@/engine/towing'
import type { TruckModel, TruckPowertrain } from '@/types/truck'

/** One selected truck in the Towing page UI */
export interface TowTruckState {
  key: string
  truckId: string
  powertrainId: string
  axleRatio: number
  /** kg; undefined = powertrain baseline weight */
  weightOverrideKg?: number
}

/** A selected truck resolved and analyzed for the current scenario */
export interface TowingEntry {
  key: string
  name: string
  color: string
  truck: TruckModel
  powertrain: TruckPowertrain
  analysis: TowingAnalysis
}

/** Distinct comparison colors (same family as the Compare page) */
export const TOWING_COLORS = [
  '#ef4444', // red
  '#22c55e', // green
  '#06b6d4', // cyan
  '#f97316', // orange
  '#a855f7', // violet
  '#eab308', // amber
]
