import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DynoCanvas from '@/components/dyno/DynoCanvas'
import ExtractedCurveChart from '@/components/dyno/ExtractedCurveChart'
import { extractCurveFromImageData, tracedPointsToCurve } from '@/engine/dynoReader'
import type { DynoCalibrationPoint, DynoYUnit, DynoStep, TracedPixelPoint } from '@/types/dyno'
import type { CurvePoint } from '@/types/car'

// ── Shared input style ───────────────────────────────────────────────────────
const INPUT_CLS =
  'bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors ' +
  'placeholder:text-muted-txt w-full'

const SELECT_CLS =
  'bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors w-full'

// ── Wizard step metadata ─────────────────────────────────────────────────────
const STEPS: { id: DynoStep; label: string; num: number }[] = [
  { id: 'upload', label: 'Upload', num: 1 },
  { id: 'calibrate-x', label: 'X-Axis', num: 2 },
  { id: 'calibrate-y', label: 'Y-Axis', num: 3 },
  { id: 'color', label: 'Color', num: 4 },
  { id: 'trace', label: 'Trace', num: 5 },
  { id: 'export', label: 'Export', num: 6 },
]

const DOT_COLORS = ['#f97316', '#06b6d4', '#a855f7', '#22c55e']

// ── Sub-components ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: DynoStep }) {
  const currentIdx = STEPS.findIndex(s => s.id === current)
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STEPS.map((s, i) => {
        const done = i < currentIdx
        const active = s.id === current
        return (
          <div key={s.id} className="flex items-center gap-1">
            <div
              className={[
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-display font-semibold tracking-wide',
                active ? 'bg-signal text-white' : done ? 'bg-signal-dim text-signal-hi' : 'bg-raised text-muted-txt',
              ].join(' ')}
            >
              <span>{s.num}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={['w-4 h-px', done ? 'bg-signal/40' : 'bg-line'].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-signal/60" />
        <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function DynoReaderPage() {
  const navigate = useNavigate()

  // Image state
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageWidth, setImageWidth] = useState(0)
  const [imageHeight, setImageHeight] = useState(0)
  const [step, setStep] = useState<DynoStep>('upload')
  const [isDragging, setIsDragging] = useState(false)

  // X-axis calibration
  const [xDots, setXDots] = useState<DynoCalibrationPoint[]>([])
  const [xValues, setXValues] = useState<[string, string]>(['1000', '7000'])

  // Y-axis calibration
  const [yDots, setYDots] = useState<DynoCalibrationPoint[]>([])
  const [yValues, setYValues] = useState<[string, string]>(['100', '500'])
  const [yUnit, setYUnit] = useState<DynoYUnit>('Nm')

  // Color sampling
  const [sampledColor, setSampledColor] = useState<[number, number, number] | null>(null)
  const [colorTolerance, setColorTolerance] = useState(30)

  // Tracing
  const [tracedPoints, setTracedPoints] = useState<TracedPixelPoint[]>([])
  const [idleRpm, setIdleRpm] = useState('800')
  const [redlineRpm, setRedlineRpm] = useState('7000')
  const [traceError, setTraceError] = useState<string | null>(null)

  // Export
  const [extractedCurve, setExtractedCurve] = useState<CurvePoint[]>([])

  // Hidden canvas for pixel access
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  // Draw image into hidden canvas when loaded
  useEffect(() => {
    if (!imageUrl || imageWidth === 0 || imageHeight === 0) return
    const canvas = hiddenCanvasRef.current
    if (!canvas) return
    canvas.width = imageWidth
    canvas.height = imageHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.src = imageUrl
    img.onload = () => ctx.drawImage(img, 0, 0)
  }, [imageUrl, imageWidth, imageHeight])

  // ── File handling ──────────────────────────────────────────────────────────
  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setImageUrl(url)
    setImageWidth(0)
    setImageHeight(0)
    setStep('calibrate-x')
    setXDots([])
    setYDots([])
    setSampledColor(null)
    setTracedPoints([])
    setExtractedCurve([])
    setTraceError(null)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) loadFile(file)
  }

  // ── Canvas interaction ─────────────────────────────────────────────────────
  const handleCanvasClick = (pixelX: number, pixelY: number) => {
    if (step === 'calibrate-x') {
      const dot: DynoCalibrationPoint = { pixelX, pixelY, value: 0 }
      if (xDots.length < 2) {
        setXDots(prev => [...prev, dot])
      } else {
        setXDots(prev => [prev[0], dot])
      }
    } else if (step === 'calibrate-y') {
      const dot: DynoCalibrationPoint = { pixelX, pixelY, value: 0 }
      if (yDots.length < 2) {
        setYDots(prev => [...prev, dot])
      } else {
        setYDots(prev => [prev[0], dot])
      }
    } else if (step === 'color') {
      const canvas = hiddenCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      try {
        const data = ctx.getImageData(pixelX, pixelY, 1, 1).data
        setSampledColor([data[0], data[1], data[2]])
      } catch {
        // getImageData may fail for cross-origin images (not expected with blob URLs)
      }
    }
  }

  // ── Tracing ────────────────────────────────────────────────────────────────
  const handleTrace = () => {
    setTraceError(null)
    if (!sampledColor || xDots.length < 2 || yDots.length < 2) return

    const canvas = hiddenCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const [r, g, b] = sampledColor
    const points = extractCurveFromImageData(
      imgData.data, imgData.width, imgData.height,
      r, g, b, colorTolerance,
    )
    setTracedPoints(points)

    if (points.length === 0) {
      setTraceError('No pixels matched. Try increasing tolerance or re-sample the color.')
      return
    }

    const idle = Number(idleRpm)
    const redline = Number(redlineRpm)
    if (isNaN(idle) || isNaN(redline) || idle >= redline) {
      setTraceError('Invalid idle / redline RPM values.')
      return
    }

    const xCal: [DynoCalibrationPoint, DynoCalibrationPoint] = [
      { ...xDots[0], value: Number(xValues[0]) },
      { ...xDots[1], value: Number(xValues[1]) },
    ]
    const yCal: [DynoCalibrationPoint, DynoCalibrationPoint] = [
      { ...yDots[0], value: Number(yValues[0]) },
      { ...yDots[1], value: Number(yValues[1]) },
    ]

    const curve = tracedPointsToCurve(points, xCal, yCal, yUnit, idle, redline)
    if (curve.length < 2) {
      setTraceError('Could not extract a valid curve. Check axis calibration and RPM range.')
      return
    }

    setExtractedCurve(curve)
    setStep('export')
  }

  // ── Step navigation ────────────────────────────────────────────────────────
  const STEP_ORDER: DynoStep[] = ['upload', 'calibrate-x', 'calibrate-y', 'color', 'trace', 'export']

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step)
    if (idx > 0) setStep(STEP_ORDER[idx - 1] as DynoStep)
  }

  const xValid =
    xDots.length === 2 &&
    xDots[0].pixelX !== xDots[1].pixelX &&
    !isNaN(Number(xValues[0])) &&
    !isNaN(Number(xValues[1])) &&
    Number(xValues[0]) !== Number(xValues[1])

  const yValid =
    yDots.length === 2 &&
    xDots[0]?.pixelY !== xDots[1]?.pixelY &&
    !isNaN(Number(yValues[0])) &&
    !isNaN(Number(yValues[1])) &&
    Number(yValues[0]) !== Number(yValues[1])

  // ── Build dot overlays ─────────────────────────────────────────────────────
  const xDotMarks = xDots.map((dot, i) => ({
    pixelX: dot.pixelX,
    pixelY: dot.pixelY,
    color: DOT_COLORS[i],
    label: `X${i + 1}`,
  }))
  const yDotMarks = yDots.map((dot, i) => ({
    pixelX: dot.pixelX,
    pixelY: dot.pixelY,
    color: DOT_COLORS[i + 2],
    label: `Y${i + 1}`,
  }))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5 pb-10">
      {/* Hidden canvas for pixel access */}
      <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-wide text-gray-100">
            Dyno Graph Reader
          </h1>
          <p className="font-data text-sm text-muted-txt mt-0.5">
            Import torque / power curves from a dyno graph image
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-xs font-display font-medium tracking-wide uppercase text-label hover:text-gray-100 hover:border-line/80 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* ── Step: Upload ───────────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={[
            'flex flex-col items-center justify-center gap-4 p-12 rounded-xl border-2 border-dashed transition-colors',
            isDragging ? 'border-signal bg-signal-dim/30' : 'border-line bg-panel',
          ].join(' ')}
        >
          <svg className="w-12 h-12 text-muted-txt" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-gray-200 tracking-wide">
              Drop a dyno graph image
            </p>
            <p className="font-data text-sm text-muted-txt mt-1">
              PNG, JPG, or WEBP — any format with a visible curve
            </p>
          </div>
          <label className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-signal text-white text-sm font-display font-semibold tracking-wide uppercase hover:bg-signal/80 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Choose Image
            <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
          </label>
        </div>
      )}

      {/* ── Steps with canvas ──────────────────────────────────────────────── */}
      {step !== 'upload' && step !== 'export' && imageUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          {/* Canvas */}
          <div>
            <DynoCanvas
              imageUrl={imageUrl}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              dots={[
                ...(step === 'calibrate-x' || step === 'calibrate-y' || step === 'color' || step === 'trace' ? xDotMarks : []),
                ...(step === 'calibrate-y' || step === 'color' || step === 'trace' ? yDotMarks : []),
              ]}
              tracedPoints={step === 'trace' ? tracedPoints : []}
              onClick={step !== 'trace' ? handleCanvasClick : undefined}
              onImageLoad={(w, h) => { setImageWidth(w); setImageHeight(h) }}
              interactive={step !== 'trace'}
            />
            {imageWidth > 0 && (
              <p className="font-data text-[10px] text-muted-txt mt-1">
                {imageWidth} × {imageHeight} px
              </p>
            )}
          </div>

          {/* Controls panel */}
          <div className="flex flex-col gap-3">
            {/* X-axis calibration */}
            {step === 'calibrate-x' && (
              <Section title="X-Axis Calibration (RPM)">
                <p className="font-data text-xs text-muted-txt mb-3">
                  {xDots.length === 0
                    ? 'Click on a known RPM point on the X-axis (e.g. 2000 RPM tick mark).'
                    : xDots.length === 1
                    ? 'Click on a second RPM point, farther along the X-axis.'
                    : 'Both points placed. Enter the RPM values below.'}
                </p>
                {xDots.map((_, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: DOT_COLORS[i] }} />
                    <label className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt whitespace-nowrap">
                      Point {i + 1}
                    </label>
                    <input
                      type="number"
                      value={xValues[i]}
                      onChange={e => {
                        const next: [string, string] = [...xValues] as [string, string]
                        next[i] = e.target.value
                        setXValues(next)
                      }}
                      placeholder="RPM"
                      className={INPUT_CLS}
                    />
                  </div>
                ))}
                {xDots.length === 2 && !xValid && xDots[0].pixelX === xDots[1].pixelX && (
                  <p className="font-data text-xs text-signal-hi">Points must be at different X positions.</p>
                )}
                <button
                  type="button"
                  disabled={!xValid}
                  onClick={() => setStep('calibrate-y')}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-signal text-white text-sm font-display font-semibold tracking-wide uppercase hover:bg-signal/80 disabled:opacity-40 transition-colors"
                >
                  Next: Y-Axis
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Section>
            )}

            {/* Y-axis calibration */}
            {step === 'calibrate-y' && (
              <Section title="Y-Axis Calibration">
                <p className="font-data text-xs text-muted-txt mb-3">
                  {yDots.length === 0
                    ? 'Click on a known value on the Y-axis (e.g. a grid line).'
                    : yDots.length === 1
                    ? 'Click on a second Y-axis reference point.'
                    : 'Both points placed. Enter their values below.'}
                </p>
                <div className="mb-3">
                  <label className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt block mb-1">
                    Y-Axis Unit
                  </label>
                  <select
                    value={yUnit}
                    onChange={e => setYUnit(e.target.value as DynoYUnit)}
                    className={SELECT_CLS}
                  >
                    <option value="Nm">Torque — Nm</option>
                    <option value="lb-ft">Torque — lb·ft</option>
                    <option value="kW">Power — kW</option>
                    <option value="hp">Power — hp</option>
                  </select>
                </div>
                {yDots.map((_, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: DOT_COLORS[i + 2] }} />
                    <label className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt whitespace-nowrap">
                      Point {i + 1}
                    </label>
                    <input
                      type="number"
                      value={yValues[i]}
                      onChange={e => {
                        const next: [string, string] = [...yValues] as [string, string]
                        next[i] = e.target.value
                        setYValues(next)
                      }}
                      placeholder={yUnit}
                      className={INPUT_CLS}
                    />
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex-1 px-4 py-2 rounded-lg border border-line text-sm font-display font-medium tracking-wide uppercase text-label hover:text-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!yValid}
                    onClick={() => setStep('color')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-signal text-white text-sm font-display font-semibold tracking-wide uppercase hover:bg-signal/80 disabled:opacity-40 transition-colors"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </Section>
            )}

            {/* Color sampling */}
            {step === 'color' && (
              <Section title="Sample Curve Color">
                <p className="font-data text-xs text-muted-txt mb-3">
                  Click directly on the torque or power curve line to sample its color.
                </p>
                {sampledColor ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-lift border border-line mb-3">
                    <div
                      className="w-10 h-10 rounded-md border border-line shrink-0"
                      style={{ background: `rgb(${sampledColor[0]},${sampledColor[1]},${sampledColor[2]})` }}
                    />
                    <div>
                      <p className="font-data text-xs text-gray-200">
                        RGB ({sampledColor[0]}, {sampledColor[1]}, {sampledColor[2]})
                      </p>
                      <p className="font-data text-[10px] text-muted-txt">Click again to re-sample</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-lift border border-faint mb-3">
                    <div className="w-10 h-10 rounded-md border border-dashed border-line shrink-0" />
                    <p className="font-data text-xs text-muted-txt">No color sampled yet</p>
                  </div>
                )}
                <div>
                  <label className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt block mb-1">
                    Tolerance: {colorTolerance}
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={colorTolerance}
                    onChange={e => setColorTolerance(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between font-data text-[10px] text-muted-txt mt-0.5">
                    <span>Precise</span>
                    <span>Loose</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex-1 px-4 py-2 rounded-lg border border-line text-sm font-display font-medium tracking-wide uppercase text-label hover:text-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!sampledColor}
                    onClick={() => setStep('trace')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-signal text-white text-sm font-display font-semibold tracking-wide uppercase hover:bg-signal/80 disabled:opacity-40 transition-colors"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </Section>
            )}

            {/* Trace */}
            {step === 'trace' && (
              <Section title="Trace & Extract">
                <p className="font-data text-xs text-muted-txt mb-3">
                  Set the RPM range, then click Trace Curve to extract data points.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt block mb-1">
                      Idle RPM
                    </label>
                    <input
                      type="number"
                      value={idleRpm}
                      onChange={e => setIdleRpm(e.target.value)}
                      min={100}
                      max={5000}
                      step={100}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt block mb-1">
                      Redline RPM
                    </label>
                    <input
                      type="number"
                      value={redlineRpm}
                      onChange={e => setRedlineRpm(e.target.value)}
                      min={1000}
                      max={20000}
                      step={100}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>
                {traceError && (
                  <p className="font-data text-xs text-signal-hi mb-2">{traceError}</p>
                )}
                {tracedPoints.length > 0 && !traceError && (
                  <p className="font-data text-xs text-green-400 mb-2">
                    {tracedPoints.length} pixels traced
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex-1 px-4 py-2 rounded-lg border border-line text-sm font-display font-medium tracking-wide uppercase text-label hover:text-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleTrace}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-signal text-white text-sm font-display font-semibold tracking-wide uppercase hover:bg-signal/80 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                    </svg>
                    Trace Curve
                  </button>
                </div>
              </Section>
            )}
          </div>
        </div>
      )}

      {/* ── Step: Export ───────────────────────────────────────────────────── */}
      {step === 'export' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="font-data text-sm text-green-400">
                {extractedCurve.length} points extracted
              </span>
            </div>
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-xs font-display font-medium tracking-wide uppercase text-label hover:text-gray-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Re-trace
            </button>
          </div>

          {/* Chart */}
          <div className="chart-frame h-72">
            <ExtractedCurveChart curve={extractedCurve} />
          </div>

          {/* Data table (first/last 5 points) */}
          <Section title="Extracted Data">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-data">
                <thead>
                  <tr className="border-b border-faint">
                    <th className="text-left text-muted-txt font-semibold pb-1.5 pr-4">RPM</th>
                    <th className="text-left text-muted-txt font-semibold pb-1.5 pr-4">Torque (Nm)</th>
                    <th className="text-left text-muted-txt font-semibold pb-1.5">Power (kW)</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedCurve.slice(0, 5).map(([rpm, nm]) => (
                    <tr key={rpm} className="border-b border-faint/40">
                      <td className="py-1 pr-4 tabular-nums text-gray-200">{rpm}</td>
                      <td className="py-1 pr-4 tabular-nums text-orange-400">{nm}</td>
                      <td className="py-1 tabular-nums text-cyan-400">
                        {Math.round((nm * rpm) / 9549)}
                      </td>
                    </tr>
                  ))}
                  {extractedCurve.length > 10 && (
                    <tr>
                      <td colSpan={3} className="py-1 text-muted-txt text-center">
                        ⋯ {extractedCurve.length - 10} more points ⋯
                      </td>
                    </tr>
                  )}
                  {extractedCurve.slice(-5).map(([rpm, nm]) => (
                    <tr key={rpm} className="border-b border-faint/40">
                      <td className="py-1 pr-4 tabular-nums text-gray-200">{rpm}</td>
                      <td className="py-1 pr-4 tabular-nums text-orange-400">{nm}</td>
                      <td className="py-1 tabular-nums text-cyan-400">
                        {Math.round((nm * rpm) / 9549)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Export action */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate('/custom-car', { state: { importedTorqueCurve: extractedCurve } })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-signal text-white text-sm font-display font-semibold tracking-wide uppercase hover:bg-signal/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Custom Car with This Curve
            </button>
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="px-4 py-2 rounded-lg border border-line text-sm font-display font-medium tracking-wide uppercase text-label hover:text-gray-200 transition-colors"
            >
              New Image
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
