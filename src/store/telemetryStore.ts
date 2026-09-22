import { create } from 'zustand'
import type { ColumnMapping, GripEnvelope, ParsedTable, TelemetryRun, WhatIfOptions } from '@/types/telemetry'
import { DEFAULT_WHATIF_OPTIONS } from '@/types/telemetry'
import { parseCsv } from '@/engine/telemetry/csv'
import { autoDetectMapping, mappingErrors } from '@/engine/telemetry/mapping'
import { buildRun } from '@/engine/telemetry/resample'

interface TelemetryStore {
  fileName: string | null
  table: ParsedTable | null
  mapping: ColumnMapping | null
  run: TelemetryRun | null
  error: string | null
  options: WhatIfOptions
  envelopeOverrides: Partial<GripEnvelope>
  /** Parse CSV text, auto-map columns and build the run */
  loadCsvText: (text: string, fileName: string) => void
  /** Replace the mapping and rebuild the run */
  setMapping: (mapping: ColumnMapping) => void
  setOptions: (patch: Partial<WhatIfOptions>) => void
  setEnvelopeOverride: (key: keyof GripEnvelope, value: number | undefined) => void
  clear: () => void
}

function tryBuild(table: ParsedTable, mapping: ColumnMapping, fileName: string): { run: TelemetryRun | null; error: string | null } {
  const errs = mappingErrors(mapping)
  if (errs.length > 0) return { run: null, error: errs.join(' ') }
  try {
    return { run: buildRun(table, mapping, { sourceName: fileName }), error: null }
  } catch (err) {
    return { run: null, error: err instanceof Error ? err.message : 'Could not build run' }
  }
}

export const useTelemetryStore = create<TelemetryStore>((set, get) => ({
  fileName: null,
  table: null,
  mapping: null,
  run: null,
  error: null,
  options: { ...DEFAULT_WHATIF_OPTIONS },
  envelopeOverrides: {},

  loadCsvText: (text, fileName) => {
    const table = parseCsv(text)
    if (table.rows.length === 0) {
      set({ fileName, table, mapping: null, run: null, error: 'No numeric rows found in this file.' })
      return
    }
    const mapping = autoDetectMapping(table.headers, table)
    const { run, error } = tryBuild(table, mapping, fileName)
    // Autocrossers hold a gear; with an rpm channel that is the better default
    set(state => ({
      fileName,
      table,
      mapping,
      run,
      error,
      envelopeOverrides: {},
      options: { ...state.options, gearStrategy: run?.hasRpm ? 'hold' : 'optimal' },
    }))
  },

  setMapping: mapping => {
    const { table, fileName } = get()
    if (!table) return
    const { run, error } = tryBuild(table, mapping, fileName ?? 'log')
    set({ mapping, run, error })
  },

  setOptions: patch => set(state => ({ options: { ...state.options, ...patch } })),

  setEnvelopeOverride: (key, value) =>
    set(state => {
      const next = { ...state.envelopeOverrides }
      if (value === undefined || !Number.isFinite(value) || value <= 0) delete next[key]
      else next[key] = value
      return { envelopeOverrides: next }
    }),

  clear: () => set({ fileName: null, table: null, mapping: null, run: null, error: null, envelopeOverrides: {} }),
}))
