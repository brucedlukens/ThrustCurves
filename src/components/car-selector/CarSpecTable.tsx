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
    ['Drivetrain', car.drivetrain],
    [
      'Engine',
      `${car.engine.displacementL}L ${car.engine.forcedInduction ? 'Turbocharged' : 'NA'}`,
    ],
    ['Peak Power', `${kwToHp(maxPowerKw).toFixed(0)} hp @ ${maxPowerRpm} RPM`],
    ['Peak Torque', `${nmToLbft(maxTorqueNm).toFixed(0)} lb·ft @ ${maxTorqueRpm} RPM`],
    ['Redline', `${car.engine.redlineRpm} RPM`],
    [
      'Curb Weight',
      `${car.curbWeightKg} kg  /  ${(car.curbWeightKg * 2.20462).toFixed(0)} lbs`,
    ],
    [
      'Gearbox',
      `${car.transmission.gearRatios.length}-speed ${car.transmission.type}`,
    ],
    ['Cd / Frontal', `${car.aero.cd.toFixed(3)}  /  ${car.aero.frontalAreaM2.toFixed(2)} m²`],
  ]

  return (
    <div className="rounded-lg border border-line overflow-hidden">
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
