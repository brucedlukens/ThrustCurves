/**
 * Telemetry What-If: pure functions, zero React dependencies.
 */
export { parseCsv, numericColumn, detectDelimiter, splitLine } from './csv'
export { autoDetectMapping, mappingErrors, splitHeader } from './mapping'
export { buildRun, movingAverage, derivative, interpolateOnGrid, DEFAULT_STEP_M } from './resample'
export { computeGripEnvelope, longitudinalAvailableG, percentile, G, DEFAULT_LAT_G } from './envelope'
export { classifySamples, smoothKinds, segmentRun } from './classify'
export { inferRoadDyno, impliedTractiveForceN } from './roadDyno'
export type { RoadLoadParams } from './roadDyno'
export {
  buildPowertrainModel,
  thrustAtSpeed,
  detectGear,
  computeCalibrationFactor,
  computeCeiling,
  simulateTrace,
  traceTimeS,
  runWhatIf,
} from './whatif'
export type { PowertrainModel, WhatIfInput } from './whatif'

import type { CarSpec } from '@/types/car'
import type { CarModifications } from '@/types/config'
import { DEFAULT_MODIFICATIONS } from '@/types/config'
import type { GripEnvelope, TelemetryRun, WhatIfOptions, WhatIfResult } from '@/types/telemetry'
import { computeGripEnvelope } from './envelope'
import { classifySamples, segmentRun, smoothKinds } from './classify'
import { buildPowertrainModel, runWhatIf } from './whatif'

export interface AnalyzeOptions extends WhatIfOptions {
  /** Manual overrides for the measured envelope (e.g. lateral g when the log has none) */
  envelopeOverrides?: Partial<GripEnvelope>
}

/**
 * Convenience: classify a run and compare the car as-specced (baseline) against
 * the car with modifications applied. Altitude is shared by both.
 */
export function analyzeWhatIf(
  run: TelemetryRun,
  car: CarSpec,
  mods: CarModifications,
  options: AnalyzeOptions,
): WhatIfResult {
  const envelope = computeGripEnvelope(run.samples, run.hasLatAccel, options.envelopeOverrides)
  const kinds = smoothKinds(classifySamples(run.samples, envelope, { hasThrottle: run.hasThrottle }), run.stepM)
  const segments = segmentRun(run.samples, kinds)
  const baselineMods: CarModifications = { ...DEFAULT_MODIFICATIONS, altitudeM: mods.altitudeM }
  const baseline = buildPowertrainModel(car, baselineMods)
  const modified = buildPowertrainModel(car, mods)
  return runWhatIf({ run, kinds, segments, envelope, baseline, modified, options })
}
