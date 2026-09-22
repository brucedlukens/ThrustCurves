import { useTelemetryStore } from '@/store/telemetryStore'
import type { ColumnMapping, TelemetryChannel } from '@/types/telemetry'
import { INPUT_CLS, LABEL_CLS } from './shared'

const CHANNELS: { key: TelemetryChannel; label: string; required?: boolean; hint?: string }[] = [
  { key: 'time', label: 'Time', required: true },
  { key: 'speed', label: 'Speed', required: true },
  { key: 'distance', label: 'Distance', hint: 'integrated from speed if absent' },
  { key: 'longAccel', label: 'Long. accel', hint: 'derived from speed if absent' },
  { key: 'latAccel', label: 'Lat. accel', hint: 'derived from GPS if absent' },
  { key: 'throttle', label: 'Throttle', hint: 'makes power-limited a measurement' },
  { key: 'rpm', label: 'RPM', hint: 'needed for hold-gear mode' },
  { key: 'lat', label: 'Latitude' },
  { key: 'lon', label: 'Longitude' },
  { key: 'elevation', label: 'Elevation', hint: 'suggests the altitude setting' },
]

export default function ChannelMapper() {
  const table = useTelemetryStore(state => state.table)
  const mapping = useTelemetryStore(state => state.mapping)
  const setMapping = useTelemetryStore(state => state.setMapping)

  if (!table || !mapping) return null

  const setColumn = (ch: TelemetryChannel, header: string) => {
    const columns = { ...mapping.columns }
    if (header === '') delete columns[ch]
    else columns[ch] = header
    setMapping({ ...mapping, columns })
  }

  const setUnit = <K extends keyof ColumnMapping>(key: K, value: ColumnMapping[K]) => {
    setMapping({ ...mapping, [key]: value })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center">
        {CHANNELS.map(({ key, label, required, hint }) => (
          <ChannelRow key={key}>
            <label htmlFor={`map-${key}`} className={LABEL_CLS}>
              {label}
              {required && <span className="text-signal"> *</span>}
            </label>
            <div className="flex flex-col gap-0.5">
              <select
                id={`map-${key}`}
                value={mapping.columns[key] ?? ''}
                onChange={e => setColumn(key, e.target.value)}
                className={INPUT_CLS}
                aria-label={`${label} column`}
              >
                <option value="">— none —</option>
                {table.headers.map(h => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              {hint && !mapping.columns[key] && (
                <span className="font-data text-[10px] text-muted-txt">{hint}</span>
              )}
            </div>
          </ChannelRow>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-faint">
        <UnitSelect label="Speed unit" value={mapping.speedUnit} onChange={v => setUnit('speedUnit', v as ColumnMapping['speedUnit'])} options={[['mph', 'mph'], ['kmh', 'km/h'], ['ms', 'm/s']]} />
        <UnitSelect label="Time unit" value={mapping.timeUnit} onChange={v => setUnit('timeUnit', v as ColumnMapping['timeUnit'])} options={[['s', 's'], ['ms', 'ms']]} />
        <UnitSelect label="Distance unit" value={mapping.distanceUnit} onChange={v => setUnit('distanceUnit', v as ColumnMapping['distanceUnit'])} options={[['m', 'm'], ['ft', 'ft'], ['km', 'km'], ['mi', 'mi']]} />
        <UnitSelect label="Accel unit" value={mapping.accelUnit} onChange={v => setUnit('accelUnit', v as ColumnMapping['accelUnit'])} options={[['g', 'g'], ['ms2', 'm/s²']]} />
        <UnitSelect label="Throttle unit" value={mapping.throttleUnit} onChange={v => setUnit('throttleUnit', v as ColumnMapping['throttleUnit'])} options={[['pct', '0–100 %'], ['fraction', '0–1']]} />
      </div>
    </div>
  )
}

function ChannelRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

interface UnitSelectProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}

function UnitSelect({ label, value, onChange, options }: UnitSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className={LABEL_CLS}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className={INPUT_CLS} aria-label={label}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  )
}
