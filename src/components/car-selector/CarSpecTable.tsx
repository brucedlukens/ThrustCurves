import type { CarSpec } from '@/types/car'
import { kwToHp, nmToLbft } from '@/utils/units'

interface CarSpecTableProps {
  car: CarSpec
}

const NUMERIC_ROWS = new Set(['Max Power', 'Max Torque', 'Redline', 'Curb Weight', 'Drag Coefficient', 'Frontal Area'])

export default function CarSpecTable({ car }: CarSpecTableProps) {
  const maxPowerKw = Math.max(...car.engine.powerCurve.map(([, p]) => p))
  const maxTorqueNm = Math.max(...car.engine.torqueCurve.map(([, t]) => t))

  const maxPowerRpm = car.engine.powerCurve.reduce(
    (best, [rpm, p]) => (p > best.p ? { rpm, p } : best),
    { rpm: 0, p: 0 },
  ).rpm

  const maxTorqueRpm = car.engine.torqueCurve.reduce(
    (best, [rpm, t]) => (t > best.t ? { rpm, t } : best),
    { rpm: 0, t: 0 },
  ).rpm

  const rows: [string, string][] = [
    ['Make / Model', `${car.year} ${car.make} ${car.model} ${car.trim}`],
    ['Drivetrain', car.drivetrain],
    [
      'Engine',
      `${car.engine.displacementL}L ${car.engine.forcedInduction ? 'Turbocharged' : 'Naturally Aspirated'}`,
    ],
    ['Max Power', `${kwToHp(maxPowerKw).toFixed(0)} hp @ ${maxPowerRpm} RPM`],
    ['Max Torque', `${nmToLbft(maxTorqueNm).toFixed(0)} lb·ft @ ${maxTorqueRpm} RPM`],
    ['Redline', `${car.engine.redlineRpm} RPM`],
    [
      'Curb Weight',
      `${car.curbWeightKg} kg (${(car.curbWeightKg * 2.20462).toFixed(0)} lbs)`,
    ],
    [
      'Transmission',
      `${car.transmission.gearRatios.length}-speed ${car.transmission.type}`,
    ],
    ['Drag Coefficient', car.aero.cd.toFixed(3)],
    ['Frontal Area', `${car.aero.frontalAreaM2.toFixed(2)} m²`],
  ]

  const isHighlight = (label: string) => label === 'Max Power' || label === 'Max Torque'

  return (
    <div
      className="rounded-lg overflow-hidden text-xs"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <table className="w-full">
        <tbody>
          {rows.map(([label, value]) => (
            <tr
              key={label}
              style={{ borderBottom: '1px solid var(--color-border)' }}
              className="last:border-0"
            >
              <td
                className="px-3 py-1.5 w-28 align-top uppercase tracking-wider text-[10px]"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: isHighlight(label) ? 'var(--color-accent)' : 'var(--color-text-3)',
                  backgroundColor: 'rgba(26,26,36,0.5)',
                  borderLeft: isHighlight(label) ? '2px solid var(--color-accent)' : '2px solid transparent',
                }}
              >
                {label}
              </td>
              <td
                className="px-3 py-1.5"
                style={{
                  fontFamily: NUMERIC_ROWS.has(label) ? 'var(--font-mono)' : 'var(--font-ui)',
                  color: 'var(--color-text-1)',
                  fontSize: NUMERIC_ROWS.has(label) ? '12px' : '12px',
                }}
              >
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
