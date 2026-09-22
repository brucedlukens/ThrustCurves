import { useRef, useState } from 'react'
import { useTelemetryStore } from '@/store/telemetryStore'
import { CARD_CLS, LABEL_CLS } from './shared'

export const SAMPLE_LOG_URL = '/samples/autocross-mx5-sample.csv'

export default function LogUploader() {
  const fileName = useTelemetryStore(state => state.fileName)
  const table = useTelemetryStore(state => state.table)
  const run = useTelemetryStore(state => state.run)
  const error = useTelemetryStore(state => state.error)
  const loadCsvText = useTelemetryStore(state => state.loadCsvText)
  const clear = useTelemetryStore(state => state.clear)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [loadingSample, setLoadingSample] = useState(false)
  const [sampleError, setSampleError] = useState<string | null>(null)

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => loadCsvText(String(reader.result ?? ''), file.name)
    reader.readAsText(file)
  }

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) readFile(file)
  }

  const loadSample = async () => {
    setLoadingSample(true)
    setSampleError(null)
    try {
      const res = await fetch(SAMPLE_LOG_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      loadCsvText(await res.text(), 'autocross-mx5-sample.csv')
    } catch (err) {
      setSampleError(err instanceof Error ? err.message : 'Could not load sample')
    } finally {
      setLoadingSample(false)
    }
  }

  return (
    <div className={CARD_CLS}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-signal" />
        <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
          Run Log
        </span>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a CSV log"
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={e => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={[
          'rounded-lg border border-dashed px-3 py-4 text-center cursor-pointer transition-colors',
          dragging ? 'border-signal bg-signal-dim/40' : 'border-line hover:border-gray-500 bg-lift',
        ].join(' ')}
      >
        <p className="font-data text-xs text-label">
          {fileName ? fileName : 'Drop a CSV here or click to browse'}
        </p>
        <p className="font-data text-[10px] text-muted-txt mt-1">
          RaceCapture, AiM, RaceChrono, TrackAddict, Solostorm… any CSV with time + speed
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,text/csv"
          className="hidden"
          aria-label="CSV file"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={loadSample}
          disabled={loadingSample}
          className="px-3 py-1.5 rounded border border-line bg-lift hover:bg-raised text-xs font-display tracking-wide uppercase text-gray-200 transition-colors disabled:opacity-50"
        >
          {loadingSample ? 'Loading…' : 'Load sample run'}
        </button>
        {fileName && (
          <button
            type="button"
            onClick={clear}
            className="px-3 py-1.5 rounded border border-transparent hover:border-line text-xs font-display tracking-wide uppercase text-label hover:text-gray-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {(error || sampleError) && (
        <p role="alert" className="font-data text-xs text-signal-hi mt-3">
          {error ?? sampleError}
        </p>
      )}

      {table && run && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat label="Rows" value={String(table.rows.length)} />
          <Stat label="Rate" value={`${run.sourceRateHz.toFixed(0)} Hz`} />
          <Stat label="Distance" value={`${run.totalDistanceM.toFixed(0)} m`} />
          <Stat label="Duration" value={`${run.totalTimeS.toFixed(2)} s`} />
          <Stat label="Throttle" value={run.hasThrottle ? 'yes' : 'no'} />
          <Stat label="RPM" value={run.hasRpm ? 'yes' : 'no'} />
          {run.elevationM !== undefined && <Stat label="Elevation" value={`${run.elevationM.toFixed(0)} m`} />}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className={LABEL_CLS}>{label}</span>
      <span className="font-data text-sm text-data tabular-nums">{value}</span>
    </div>
  )
}
