import type { ShiftPoint } from '@/types/simulation'
import { msToMph } from '@/utils/units'

interface ShiftPointsTableProps {
  shiftPoints: ShiftPoint[]
}

export default function ShiftPointsTable({ shiftPoints }: ShiftPointsTableProps) {
  return (
    <div className="rounded-lg border border-gray-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800">
            <th className="px-4 py-2 text-left text-gray-400 font-medium">Shift</th>
            <th className="px-4 py-2 text-right text-gray-400 font-medium">Speed (mph)</th>
            <th className="px-4 py-2 text-right text-gray-400 font-medium">RPM</th>
          </tr>
        </thead>
        <tbody>
          {shiftPoints.map(sp => (
            <tr
              key={`${sp.fromGear}-${sp.toGear}`}
              className="border-t border-gray-700 hover:bg-gray-800/50"
            >
              <td className="px-4 py-2 text-gray-100">
                Gear {sp.fromGear} → {sp.toGear}
              </td>
              <td className="px-4 py-2 text-right text-gray-100">
                {msToMph(sp.speedMs).toFixed(1)}
              </td>
              <td className="px-4 py-2 text-right text-gray-100">{sp.rpm.toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
