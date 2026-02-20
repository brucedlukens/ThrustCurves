import type { ShiftPoint } from '@/types/simulation'
import { msToMph } from '@/utils/units'

interface ShiftPointsTableProps {
  shiftPoints: ShiftPoint[]
}

export default function ShiftPointsTable({ shiftPoints }: ShiftPointsTableProps) {
  return (
    <div
      className="rounded-lg overflow-hidden text-sm"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: 'var(--color-surface)' }}>
            <th
              className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
            >
              Shift
            </th>
            <th
              className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
            >
              Speed (mph)
            </th>
            <th
              className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-3)' }}
            >
              RPM
            </th>
          </tr>
        </thead>
        <tbody>
          {shiftPoints.map((sp, idx) => (
            <tr
              key={`${sp.fromGear}-${sp.toGear}`}
              style={{
                borderTop: '1px solid var(--color-border)',
                backgroundColor: idx % 2 === 1 ? 'rgba(26,26,36,0.3)' : 'transparent',
              }}
            >
              <td className="px-4 py-2" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                Gear {sp.fromGear} → {sp.toGear}
              </td>
              <td
                className="px-4 py-2 text-right"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-1)' }}
              >
                {msToMph(sp.speedMs).toFixed(1)}
              </td>
              <td
                className="px-4 py-2 text-right"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-1)' }}
              >
                {sp.rpm.toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
