import type { ShiftPoint } from '@/types/simulation'
import { msToMph } from '@/utils/units'

interface ShiftPointsTableProps {
  shiftPoints: ShiftPoint[]
}

const GEAR_COLORS = [
  '#00D4C8', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981',
]

export default function ShiftPointsTable({ shiftPoints }: ShiftPointsTableProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      <table className="w-full">
        <thead>
          <tr style={{ background: 'var(--surface-3)', borderBottom: '1px solid var(--border)' }}>
            <th
              className="px-4 py-2.5 text-left font-ui text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Shift
            </th>
            <th
              className="px-4 py-2.5 text-right font-ui text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Speed
            </th>
            <th
              className="px-4 py-2.5 text-right font-ui text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--text-tertiary)' }}
            >
              RPM
            </th>
          </tr>
        </thead>
        <tbody>
          {shiftPoints.map((sp, idx) => {
            const fromColor = GEAR_COLORS[(sp.fromGear - 1) % GEAR_COLORS.length]
            const toColor = GEAR_COLORS[(sp.toGear - 1) % GEAR_COLORS.length]
            return (
              <tr
                key={`${sp.fromGear}-${sp.toGear}`}
                style={{
                  background: idx % 2 === 0 ? 'var(--surface-2)' : 'transparent',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <td className="px-4 py-2.5">
                  <span className="font-ui text-sm flex items-center gap-1.5">
                    <span style={{ color: fromColor }} className="font-semibold">
                      G{sp.fromGear}
                    </span>
                    <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                    <span style={{ color: toColor }} className="font-semibold">
                      G{sp.toGear}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-data text-sm" style={{ color: 'var(--text-primary)' }}>
                  {msToMph(sp.speedMs).toFixed(1)}
                  <span className="ml-1 font-data text-xs" style={{ color: 'var(--text-tertiary)' }}>mph</span>
                </td>
                <td className="px-4 py-2.5 text-right font-data text-sm" style={{ color: 'var(--text-primary)' }}>
                  {sp.rpm.toFixed(0)}
                  <span className="ml-1 font-data text-xs" style={{ color: 'var(--text-tertiary)' }}>rpm</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
