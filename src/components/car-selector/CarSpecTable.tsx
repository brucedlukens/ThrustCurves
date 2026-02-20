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
