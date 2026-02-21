import { Link } from 'react-router-dom'
import type { CarSpec } from '@/types/car'
import { kwToHp, nmToLbft } from '@/utils/units'
import { useUnitStore } from '@/store/unitStore'

interface CarSpecTableProps {
  car: CarSpec
}

export default function CarSpecTable({ car }: CarSpecTableProps) {
  const units = useUnitStore(state => state.units)

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

  const torqueStr = units === 'imperial'
    ? `${nmToLbft(maxTorqueNm).toFixed(0)} lb·ft @ ${maxTorqueRpm} RPM`
    : `${maxTorqueNm.toFixed(0)} Nm @ ${maxTorqueRpm} RPM`

  const weightStr = units === 'imperial'
    ? `${(car.curbWeightKg * 2.20462).toFixed(0)} lbs`
    : `${car.curbWeightKg} kg`

  const rows: [string, string][] = [
    ['Make / Model', `${car.year} ${car.make} ${car.model} ${car.trim}`],
    ['Drivetrain', car.drivetrain],
    [
      'Engine',
      `${car.engine.displacementL}L ${car.engine.forcedInduction ? 'Turbocharged' : 'Naturally Aspirated'}`,
    ],
    ['Peak Power', `${kwToHp(maxPowerKw).toFixed(0)} hp @ ${maxPowerRpm} RPM`],
    ['Peak Torque', torqueStr],
    ['Redline', `${car.engine.redlineRpm} RPM`],
    ['Curb Weight', weightStr],
    [
      'Transmission',
      `${car.transmission.gearRatios.length}-speed ${car.transmission.type}`,
    ],
    ['Drag Coefficient', car.aero.cd.toFixed(3)],
    ['Frontal Area', `${car.aero.frontalAreaM2.toFixed(2)} m²`],
  ]

  const isCustom = car.id.startsWith('custom-')

  return (
    <div className="rounded-lg border border-line overflow-hidden">
      {isCustom && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-lift border-b border-line">
          <span className="font-display text-[9px] font-semibold tracking-[0.2em] uppercase text-signal">
            Custom Car
          </span>
          <Link
            to={`/custom-car/${car.id}`}
            className="font-display text-[9px] font-semibold tracking-[0.15em] uppercase text-muted-txt hover:text-signal transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
            </svg>
            Edit
          </Link>
        </div>
      )}
      <table className="w-full">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-faint last:border-0">
              <td className="px-3 py-2 bg-lift align-top w-28">
                <span className="font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-label">
                  {label}
                </span>
              </td>
              <td className="px-3 py-2 bg-panel">
                <span className="font-data text-xs text-gray-200">{value}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
