import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useCarStore } from '@/store/carStore'
import { useUnitStore } from '@/store/unitStore'
import { nmToLbft, lbftToNm, kwToHp } from '@/utils/units'
import type { CarSpec, CurvePoint, DrivetrainType, TransmissionType } from '@/types/car'

// ── Shared input style ──────────────────────────────────────────────────────
const INPUT_CLS =
  'bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors ' +
  'placeholder:text-muted-txt w-full'

const SELECT_CLS =
  'bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors w-full'

// ── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full bg-signal/60" />
        <span className="font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-label">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

// ── Field wrapper ───────────────────────────────────────────────────────────
function Field({
  label,
  unit,
  children,
}: {
  label: string
  unit?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt">
        {label}
        {unit && <span className="text-muted-txt/60 normal-case ml-1">({unit})</span>}
      </label>
      {children}
    </div>
  )
}

// ── Validation ──────────────────────────────────────────────────────────────
interface ValidationErrors {
  [key: string]: string
}

function validateCar(
  fields: FormFields,
  torqueCurve: CurvePoint[],
  gearRatios: string[],
): ValidationErrors {
  const errs: ValidationErrors = {}

  if (!fields.make.trim()) errs.make = 'Required'
  if (!fields.model.trim()) errs.model = 'Required'
  const year = Number(fields.year)
  if (isNaN(year) || year < 1886 || year > 2100) errs.year = 'Enter a valid year'
  const weight = Number(fields.curbWeightKg)
  if (isNaN(weight) || weight <= 0) errs.curbWeightKg = 'Must be > 0'
  const displ = Number(fields.displacementL)
  if (isNaN(displ) || displ <= 0) errs.displacementL = 'Must be > 0'
  const idle = Number(fields.idleRpm)
  if (isNaN(idle) || idle <= 0) errs.idleRpm = 'Must be > 0'
  const redline = Number(fields.redlineRpm)
  if (isNaN(redline) || redline <= idle) errs.redlineRpm = 'Must be > idle RPM'

  if (torqueCurve.length < 2) {
    errs.torqueCurve = 'Need at least 2 points'
  } else {
    const maxCurveRpm = Math.max(...torqueCurve.map(p => p[0]))
    if (maxCurveRpm > redline) errs.torqueCurve = 'Curve RPM exceeds redline'
    const rpms = torqueCurve.map(p => p[0])
    if (new Set(rpms).size !== rpms.length) errs.torqueCurve = 'Duplicate RPM values'
  }

  const finalDrive = Number(fields.finalDriveRatio)
  if (isNaN(finalDrive) || finalDrive <= 0) errs.finalDriveRatio = 'Must be > 0'
  const shiftTime = Number(fields.shiftTimeMs)
  if (isNaN(shiftTime) || shiftTime < 0) errs.shiftTimeMs = 'Must be ≥ 0'
  const dtLoss = Number(fields.drivetrainLossPct)
  if (isNaN(dtLoss) || dtLoss < 0 || dtLoss >= 100) errs.drivetrainLoss = 'Must be 0–99%'

  gearRatios.forEach((r, i) => {
    const v = Number(r)
    if (isNaN(v) || v <= 0) errs[`gear${i}`] = 'Must be > 0'
  })

  const tireW = Number(fields.tireWidthMm)
  if (isNaN(tireW) || tireW <= 0) errs.tireWidthMm = 'Must be > 0'
  const tireAR = Number(fields.tireAspectRatio)
  if (isNaN(tireAR) || tireAR <= 0) errs.tireAspectRatio = 'Must be > 0'
  const tireRim = Number(fields.tireRimDiameterIn)
  if (isNaN(tireRim) || tireRim <= 0) errs.tireRimDiameterIn = 'Must be > 0'

  const cd = Number(fields.cd)
  if (isNaN(cd) || cd <= 0) errs.cd = 'Must be > 0'
  const fa = Number(fields.frontalAreaM2)
  if (isNaN(fa) || fa <= 0) errs.frontalAreaM2 = 'Must be > 0'

  return errs
}

// ── Form state type ─────────────────────────────────────────────────────────
interface FormFields {
  make: string
  model: string
  year: string
  trim: string
  drivetrain: DrivetrainType
  curbWeightKg: string
  displacementL: string
  forcedInduction: boolean
  idleRpm: string
  redlineRpm: string
  transmissionType: TransmissionType
  numGears: string
  finalDriveRatio: string
  drivetrainLossPct: string
  shiftTimeMs: string
  tireWidthMm: string
  tireAspectRatio: string
  tireRimDiameterIn: string
  cd: string
  frontalAreaM2: string
}

// ── Default form values ─────────────────────────────────────────────────────
function defaultFields(): FormFields {
  return {
    make: '',
    model: '',
    year: String(new Date().getFullYear()),
    trim: '',
    drivetrain: 'RWD',
    curbWeightKg: '1500',
    displacementL: '2.0',
    forcedInduction: false,
    idleRpm: '800',
    redlineRpm: '7000',
    transmissionType: 'manual',
    numGears: '6',
    finalDriveRatio: '3.73',
    drivetrainLossPct: '15',
    shiftTimeMs: '150',
    tireWidthMm: '235',
    tireAspectRatio: '45',
    tireRimDiameterIn: '18',
    cd: '0.32',
    frontalAreaM2: '2.20',
  }
}

function defaultGearRatios(n: number): string[] {
  // Sensible defaults for common gear counts
  const presets: Record<number, number[]> = {
    4: [3.54, 2.13, 1.36, 1.03],
    5: [3.31, 1.95, 1.33, 1.00, 0.78],
    6: [3.82, 2.26, 1.54, 1.16, 0.86, 0.69],
    7: [4.17, 2.34, 1.52, 1.14, 0.87, 0.69, 0.58],
    8: [4.71, 3.14, 2.11, 1.67, 1.29, 1.00, 0.84, 0.67],
    9: [5.01, 3.39, 2.24, 1.67, 1.29, 1.00, 0.84, 0.67, 0.56],
    10: [5.25, 3.03, 2.15, 1.77, 1.52, 1.27, 1.00, 0.85, 0.69, 0.63],
  }
  const vals = presets[n] ?? Array.from({ length: n }, (_, i) => (4.0 / (i + 1)).toFixed(2))
  return vals.slice(0, n).map(v => String(v))
}

function defaultTorqueCurve(redlineRpm: number): CurvePoint[] {
  const points: CurvePoint[] = []
  const idle = 800
  const step = 500
  for (let rpm = idle; rpm <= redlineRpm; rpm += step) {
    // Simple bell-curve approximation peaking at ~60% of rev range
    const t = (rpm - idle) / (redlineRpm - idle)
    const torque = Math.round(150 + 150 * Math.sin(t * Math.PI))
    points.push([rpm, torque])
  }
  if (points.length === 0 || points[points.length - 1][0] < redlineRpm) {
    points.push([redlineRpm, 100])
  }
  return points
}

function torqueToPowerCurve(torqueCurve: CurvePoint[]): CurvePoint[] {
  return torqueCurve.map(([rpm, nm]) => [rpm, Math.round((nm * rpm) / 9549)])
}

// ── Torque Curve Editor ─────────────────────────────────────────────────────
function TorqueCurveEditor({
  curve,
  onChange,
  error,
}: {
  curve: CurvePoint[]
  onChange: (c: CurvePoint[]) => void
  error?: string
}) {
  const { units } = useUnitStore()
  const imperial = units === 'imperial'

  const handleRpm = (i: number, val: string) => {
    const updated = curve.map((p, idx) =>
      idx === i ? ([Number(val) || 0, p[1]] as CurvePoint) : p,
    )
    onChange(updated)
  }
  const handleTorque = (i: number, val: string) => {
    const nm = imperial ? lbftToNm(Number(val) || 0) : Number(val) || 0
    const updated = curve.map((p, idx) =>
      idx === i ? ([p[0], nm] as CurvePoint) : p,
    )
    onChange(updated)
  }
  const addRow = () => {
    const lastRpm = curve.length > 0 ? curve[curve.length - 1][0] : 0
    onChange([...curve, [lastRpm + 500, 200]])
  }
  const removeRow = (i: number) => {
    onChange(curve.filter((_, idx) => idx !== i))
  }

  const torqueLabel = imperial ? 'Torque (lb·ft)' : 'Torque (Nm)'
  const powerLabel = imperial ? 'Power (hp)' : 'Power (kW)'

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-data">
          <thead>
            <tr className="border-b border-faint">
              <th className="text-left text-muted-txt font-semibold pb-1.5 pr-3">RPM</th>
              <th className="text-left text-muted-txt font-semibold pb-1.5 pr-3">{torqueLabel}</th>
              <th className="text-left text-muted-txt font-semibold pb-1.5 pr-3">{powerLabel}</th>
              <th className="pb-1.5" />
            </tr>
          </thead>
          <tbody>
            {curve.map((pt, i) => {
              const powerKw = Math.round((pt[1] * pt[0]) / 9549)
              const powerDisplay = imperial ? Math.round(kwToHp(powerKw)) : powerKw
              const torqueDisplay = imperial
                ? Math.round(nmToLbft(pt[1]) * 10) / 10
                : pt[1]
              return (
                <tr key={i} className="border-b border-faint/40">
                  <td className="pr-2 py-1">
                    <input
                      type="number"
                      value={pt[0]}
                      onChange={e => handleRpm(i, e.target.value)}
                      min={0}
                      step={100}
                      className="w-20 bg-lift border border-line rounded px-2 py-1 text-xs text-gray-100 font-data focus:outline-none focus:ring-1 focus:ring-signal"
                    />
                  </td>
                  <td className="pr-2 py-1">
                    <input
                      type="number"
                      value={torqueDisplay}
                      onChange={e => handleTorque(i, e.target.value)}
                      min={0}
                      step={imperial ? 0.5 : 5}
                      className="w-20 bg-lift border border-line rounded px-2 py-1 text-xs text-gray-100 font-data focus:outline-none focus:ring-1 focus:ring-signal"
                    />
                  </td>
                  <td className="pr-2 py-1">
                    <span className="text-muted-txt tabular-nums">{powerDisplay}</span>
                  </td>
                  <td className="py-1">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      disabled={curve.length <= 2}
                      className="p-1 rounded text-muted-txt hover:text-signal transition-colors disabled:opacity-30"
                      aria-label="Remove row"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-xs font-display font-medium tracking-wide uppercase text-label hover:text-gray-100 hover:border-signal/60 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add point
      </button>
      {error && <p className="font-data text-xs text-signal-hi">{error}</p>}
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function CustomCarPage() {
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id?: string }>()

  const cars = useCarStore(state => state.cars)
  const saveCustomCar = useCarStore(state => state.saveCustomCar)
  const deleteCustomCar = useCarStore(state => state.deleteCustomCar)
  const selectCar = useCarStore(state => state.selectCar)

  // When editing, find the existing car
  const existingCar = editId ? cars.find(c => c.id === editId) : undefined

  const [fields, setFields] = useState<FormFields>(() => {
    if (existingCar) {
      return {
        make: existingCar.make,
        model: existingCar.model,
        year: String(existingCar.year),
        trim: existingCar.trim,
        drivetrain: existingCar.drivetrain,
        curbWeightKg: String(existingCar.curbWeightKg),
        displacementL: String(existingCar.engine.displacementL),
        forcedInduction: existingCar.engine.forcedInduction,
        idleRpm: String(existingCar.engine.idleRpm),
        redlineRpm: String(existingCar.engine.redlineRpm),
        transmissionType: existingCar.transmission.type,
        numGears: String(existingCar.transmission.gearRatios.length),
        finalDriveRatio: String(existingCar.transmission.finalDriveRatio),
        drivetrainLossPct: String(existingCar.transmission.drivetrainLoss * 100),
        shiftTimeMs: String(existingCar.transmission.shiftTimeMs),
        tireWidthMm: String(existingCar.tireSize.widthMm),
        tireAspectRatio: String(existingCar.tireSize.aspectRatio),
        tireRimDiameterIn: String(existingCar.tireSize.rimDiameterIn),
        cd: String(existingCar.aero.cd),
        frontalAreaM2: String(existingCar.aero.frontalAreaM2),
      }
    }
    return defaultFields()
  })

  const [gearRatios, setGearRatios] = useState<string[]>(() => {
    if (existingCar) {
      return existingCar.transmission.gearRatios.map(String)
    }
    return defaultGearRatios(6)
  })

  const [torqueCurve, setTorqueCurve] = useState<CurvePoint[]>(() => {
    if (existingCar) return existingCar.engine.torqueCurve
    return defaultTorqueCurve(7000)
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const setField = useCallback(
    <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
      setFields(prev => ({ ...prev, [key]: value }))
    },
    [],
  )

  // Keep gear ratio array in sync with numGears
  const handleNumGearsChange = (val: string) => {
    setField('numGears', val)
    const n = Number(val)
    if (!isNaN(n) && n >= 1 && n <= 12) {
      const current = gearRatios.slice(0, n)
      const defaults = defaultGearRatios(n)
      // Fill in defaults for any new gears beyond current length
      while (current.length < n) {
        current.push(defaults[current.length] ?? '1.00')
      }
      setGearRatios(current)
    }
  }

  const handleSave = async () => {
    const errs = validateCar(fields, torqueCurve, gearRatios)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      const id = editId ?? `custom-${uuidv4()}`
      const sortedTorque = [...torqueCurve].sort((a, b) => a[0] - b[0])
      const sortedPower = torqueToPowerCurve(sortedTorque)

      const car: CarSpec = {
        id,
        make: fields.make.trim(),
        model: fields.model.trim(),
        year: Number(fields.year),
        trim: fields.trim.trim() || 'Custom',
        curbWeightKg: Number(fields.curbWeightKg),
        drivetrain: fields.drivetrain,
        engine: {
          torqueCurve: sortedTorque,
          powerCurve: sortedPower,
          redlineRpm: Number(fields.redlineRpm),
          idleRpm: Number(fields.idleRpm),
          displacementL: Number(fields.displacementL),
          forcedInduction: fields.forcedInduction,
        },
        transmission: {
          gearRatios: gearRatios.map(Number),
          finalDriveRatio: Number(fields.finalDriveRatio),
          shiftTimeMs: Number(fields.shiftTimeMs),
          drivetrainLoss: Number(fields.drivetrainLossPct) / 100,
          type: fields.transmissionType,
        },
        tireSize: {
          widthMm: Number(fields.tireWidthMm),
          aspectRatio: Number(fields.tireAspectRatio),
          rimDiameterIn: Number(fields.tireRimDiameterIn),
        },
        aero: {
          cd: Number(fields.cd),
          frontalAreaM2: Number(fields.frontalAreaM2),
        },
      }

      await saveCustomCar(car)
      selectCar(car.id)
      navigate('/simulator')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editId) return
    await deleteCustomCar(editId)
    navigate('/simulator')
  }

  const isEditing = Boolean(editId && existingCar)

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="font-display text-xl font-bold tracking-wide text-gray-100">
            {isEditing ? 'Edit Custom Car' : 'New Custom Car'}
          </h1>
          <p className="font-data text-sm text-muted-txt mt-0.5">
            {isEditing
              ? `Editing: ${existingCar!.make} ${existingCar!.model}`
              : 'Build a car from scratch — all specs are yours to define'}
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

      {/* ── Basic Info ────────────────────────────────────────────── */}
      <Section title="Basic Info">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Make">
            <input
              type="text"
              value={fields.make}
              onChange={e => setField('make', e.target.value)}
              placeholder="e.g. Toyota"
              className={INPUT_CLS}
            />
            {errors.make && <span className="font-data text-xs text-signal-hi">{errors.make}</span>}
          </Field>
          <Field label="Model">
            <input
              type="text"
              value={fields.model}
              onChange={e => setField('model', e.target.value)}
              placeholder="e.g. Supra"
              className={INPUT_CLS}
            />
            {errors.model && <span className="font-data text-xs text-signal-hi">{errors.model}</span>}
          </Field>
          <Field label="Year">
            <input
              type="number"
              value={fields.year}
              onChange={e => setField('year', e.target.value)}
              min={1886}
              max={2100}
              className={INPUT_CLS}
            />
            {errors.year && <span className="font-data text-xs text-signal-hi">{errors.year}</span>}
          </Field>
          <Field label="Trim">
            <input
              type="text"
              value={fields.trim}
              onChange={e => setField('trim', e.target.value)}
              placeholder="e.g. 3.0 Premium"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Drivetrain">
            <select
              value={fields.drivetrain}
              onChange={e => setField('drivetrain', e.target.value as DrivetrainType)}
              className={SELECT_CLS}
            >
              <option value="RWD">RWD</option>
              <option value="FWD">FWD</option>
              <option value="AWD">AWD</option>
            </select>
          </Field>
          <Field label="Curb Weight" unit="kg">
            <input
              type="number"
              value={fields.curbWeightKg}
              onChange={e => setField('curbWeightKg', e.target.value)}
              min={200}
              max={10000}
              step={10}
              className={INPUT_CLS}
            />
            {errors.curbWeightKg && (
              <span className="font-data text-xs text-signal-hi">{errors.curbWeightKg}</span>
            )}
          </Field>
        </div>
      </Section>

      {/* ── Engine ────────────────────────────────────────────────── */}
      <Section title="Engine">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Displacement" unit="L">
            <input
              type="number"
              value={fields.displacementL}
              onChange={e => setField('displacementL', e.target.value)}
              min={0.1}
              max={20}
              step={0.1}
              className={INPUT_CLS}
            />
            {errors.displacementL && (
              <span className="font-data text-xs text-signal-hi">{errors.displacementL}</span>
            )}
          </Field>
          <Field label="Forced Induction">
            <label className="flex items-center gap-2 h-[34px] cursor-pointer">
              <input
                type="checkbox"
                checked={fields.forcedInduction}
                onChange={e => setField('forcedInduction', e.target.checked)}
                className="w-4 h-4 rounded border-line bg-lift accent-signal"
              />
              <span className="font-data text-sm text-gray-200">
                {fields.forcedInduction ? 'Turbo / Supercharged' : 'Naturally Aspirated'}
              </span>
            </label>
          </Field>
          <Field label="Idle RPM">
            <input
              type="number"
              value={fields.idleRpm}
              onChange={e => setField('idleRpm', e.target.value)}
              min={300}
              max={3000}
              step={50}
              className={INPUT_CLS}
            />
            {errors.idleRpm && (
              <span className="font-data text-xs text-signal-hi">{errors.idleRpm}</span>
            )}
          </Field>
          <Field label="Redline RPM">
            <input
              type="number"
              value={fields.redlineRpm}
              onChange={e => setField('redlineRpm', e.target.value)}
              min={1000}
              max={20000}
              step={100}
              className={INPUT_CLS}
            />
            {errors.redlineRpm && (
              <span className="font-data text-xs text-signal-hi">{errors.redlineRpm}</span>
            )}
          </Field>
        </div>

        <div className="border-t border-faint pt-3">
          <p className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt mb-2">
            Torque Curve
          </p>
          <TorqueCurveEditor
            curve={torqueCurve}
            onChange={setTorqueCurve}
            error={errors.torqueCurve}
          />
          <p className="font-data text-[10px] text-muted-txt mt-2">
            Points are sorted by RPM on save. Power is auto-computed from torque × RPM / 9549.
          </p>
        </div>
      </Section>

      {/* ── Transmission ─────────────────────────────────────────── */}
      <Section title="Transmission">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Type">
            <select
              value={fields.transmissionType}
              onChange={e => setField('transmissionType', e.target.value as TransmissionType)}
              className={SELECT_CLS}
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
              <option value="dct">DCT</option>
              <option value="cvt">CVT</option>
            </select>
          </Field>
          <Field label="Number of Gears">
            <input
              type="number"
              value={fields.numGears}
              onChange={e => handleNumGearsChange(e.target.value)}
              min={1}
              max={12}
              step={1}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Final Drive Ratio">
            <input
              type="number"
              value={fields.finalDriveRatio}
              onChange={e => setField('finalDriveRatio', e.target.value)}
              min={0.1}
              max={10}
              step={0.001}
              className={INPUT_CLS}
            />
            {errors.finalDriveRatio && (
              <span className="font-data text-xs text-signal-hi">{errors.finalDriveRatio}</span>
            )}
          </Field>
          <Field label="Drivetrain Loss" unit="%">
            <input
              type="number"
              value={fields.drivetrainLossPct}
              onChange={e => setField('drivetrainLossPct', e.target.value)}
              min={0}
              max={50}
              step={0.5}
              className={INPUT_CLS}
            />
            {errors.drivetrainLoss && (
              <span className="font-data text-xs text-signal-hi">{errors.drivetrainLoss}</span>
            )}
          </Field>
          <Field label="Shift Time" unit="ms">
            <input
              type="number"
              value={fields.shiftTimeMs}
              onChange={e => setField('shiftTimeMs', e.target.value)}
              min={0}
              max={2000}
              step={10}
              className={INPUT_CLS}
            />
            {errors.shiftTimeMs && (
              <span className="font-data text-xs text-signal-hi">{errors.shiftTimeMs}</span>
            )}
          </Field>
        </div>

        {/* Gear ratios grid */}
        <div className="border-t border-faint pt-3">
          <p className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt mb-2">
            Gear Ratios
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {gearRatios.map((ratio, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <label className="font-display text-[9px] font-medium tracking-wider uppercase text-muted-txt">
                  G{i + 1}
                </label>
                <input
                  type="number"
                  value={ratio}
                  onChange={e => {
                    const updated = [...gearRatios]
                    updated[i] = e.target.value
                    setGearRatios(updated)
                  }}
                  min={0.1}
                  max={12}
                  step={0.001}
                  className={`${INPUT_CLS} text-right tabular-nums`}
                  aria-label={`Gear ${i + 1} ratio`}
                />
                {errors[`gear${i}`] && (
                  <span className="font-data text-[9px] text-signal-hi">{errors[`gear${i}`]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Tires ─────────────────────────────────────────────────── */}
      <Section title="Tires">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Width" unit="mm">
            <input
              type="number"
              value={fields.tireWidthMm}
              onChange={e => setField('tireWidthMm', e.target.value)}
              min={100}
              max={400}
              step={5}
              className={INPUT_CLS}
            />
            {errors.tireWidthMm && (
              <span className="font-data text-xs text-signal-hi">{errors.tireWidthMm}</span>
            )}
          </Field>
          <Field label="Aspect Ratio">
            <input
              type="number"
              value={fields.tireAspectRatio}
              onChange={e => setField('tireAspectRatio', e.target.value)}
              min={20}
              max={100}
              step={5}
              className={INPUT_CLS}
            />
            {errors.tireAspectRatio && (
              <span className="font-data text-xs text-signal-hi">{errors.tireAspectRatio}</span>
            )}
          </Field>
          <Field label="Rim Diameter" unit="in">
            <input
              type="number"
              value={fields.tireRimDiameterIn}
              onChange={e => setField('tireRimDiameterIn', e.target.value)}
              min={10}
              max={30}
              step={1}
              className={INPUT_CLS}
            />
            {errors.tireRimDiameterIn && (
              <span className="font-data text-xs text-signal-hi">{errors.tireRimDiameterIn}</span>
            )}
          </Field>
        </div>
        <p className="font-data text-[11px] text-muted-txt mt-2">
          Format: {fields.tireWidthMm}/{fields.tireAspectRatio}R{fields.tireRimDiameterIn}
        </p>
      </Section>

      {/* ── Aero ──────────────────────────────────────────────────── */}
      <Section title="Aerodynamics">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Drag Coefficient (Cd)">
            <input
              type="number"
              value={fields.cd}
              onChange={e => setField('cd', e.target.value)}
              min={0.1}
              max={2.0}
              step={0.01}
              className={INPUT_CLS}
            />
            {errors.cd && <span className="font-data text-xs text-signal-hi">{errors.cd}</span>}
          </Field>
          <Field label="Frontal Area" unit="m²">
            <input
              type="number"
              value={fields.frontalAreaM2}
              onChange={e => setField('frontalAreaM2', e.target.value)}
              min={0.5}
              max={10}
              step={0.01}
              className={INPUT_CLS}
            />
            {errors.frontalAreaM2 && (
              <span className="font-data text-xs text-signal-hi">{errors.frontalAreaM2}</span>
            )}
          </Field>
        </div>
      </Section>

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex gap-2">
          {isEditing && !showDeleteConfirm && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-lg border border-signal/40 text-sm font-display font-medium tracking-wide uppercase text-signal hover:bg-signal-dim transition-colors"
            >
              Delete Car
            </button>
          )}
          {isEditing && showDeleteConfirm && (
            <div className="flex items-center gap-2">
              <span className="font-data text-sm text-signal-hi">Confirm delete?</span>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg bg-signal text-white text-sm font-display font-medium tracking-wide uppercase hover:bg-signal/80 transition-colors"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-line text-sm font-display font-medium tracking-wide uppercase text-label hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-signal text-white text-sm font-display font-semibold tracking-wide uppercase hover:bg-signal/80 disabled:opacity-60 transition-colors"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {isEditing ? 'Save Changes' : 'Create & Simulate'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
