import type { CarSpec } from '@/types/car'
import { kwToHp, nmToLbft } from '@/utils/units'

interface CarSpecTableProps {
  car: CarSpec
}

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

  return (
    <div className="rounded-lg border border-gray-700 overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-gray-700 last:border-0">
              <td className="px-3 py-2 text-gray-400 font-medium bg-gray-800/50 w-36 align-top">
                {label}
              </td>
              <td className="px-3 py-2 text-gray-100">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
