import type { ShiftPoint } from '@/types/simulation'
import { useUnitStore } from '@/store/unitStore'
import { msToMph, msToKmh } from '@/utils/units'

interface ShiftPointsTableProps {
  shiftPoints: ShiftPoint[]
}

export default function ShiftPointsTable({ shiftPoints }: ShiftPointsTableProps) {
  const units = useUnitStore(state => state.units)
  const fmtSpeed = (ms: number) =>
    units === 'imperial' ? msToMph(ms).toFixed(1) : msToKmh(ms).toFixed(1)
  const speedUnit = units === 'imperial' ? 'mph' : 'km/h'

  return (
    <div className="rounded-xl border border-line overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-lift border-b border-line">
            <th className="px-4 py-2.5 text-left">
              <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-txt">
                Shift
              </span>
            </th>
            <th className="px-4 py-2.5 text-right">
              <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-txt">
                Speed ({speedUnit})
              </span>
            </th>
            <th className="px-4 py-2.5 text-right">
              <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-txt">
                RPM
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {shiftPoints.map((sp, idx) => (
            <tr
              key={`${sp.fromGear}-${sp.toGear}`}
              className={`border-t border-faint hover:bg-raised transition-colors ${idx % 2 === 0 ? 'bg-panel' : 'bg-lift/40'}`}
            >
              <td className="px-4 py-2.5">
                <span className="font-display text-sm font-semibold text-gray-100 tracking-wide">
                  Gear {sp.fromGear} → {sp.toGear}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className="font-data text-sm text-data tabular-nums">
                  {fmtSpeed(sp.speedMs)}
                </span>
                <span className="font-data text-xs text-label ml-1">{speedUnit}</span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className="font-data text-sm text-data tabular-nums">
                  {sp.rpm.toFixed(0)}
                </span>
                <span className="font-data text-xs text-label ml-1">rpm</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
