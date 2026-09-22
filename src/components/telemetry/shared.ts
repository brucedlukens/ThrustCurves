import type { LimitKind } from '@/types/telemetry'

export const INPUT_CLS =
  'w-full bg-lift border border-line rounded px-2 py-1.5 text-sm text-gray-100 font-data ' +
  'focus:outline-none focus:ring-1 focus:ring-signal focus:border-signal transition-colors placeholder:text-muted-txt'

export const LABEL_CLS = 'font-display text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-txt'

export const CARD_CLS = 'rounded-xl border border-line bg-panel p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'

export const LIMIT_COLORS: Record<LimitKind, string> = {
  power: '#dc2626',
  grip: '#f97316',
  cornering: '#eab308',
  braking: '#06b6d4',
  driver: '#55556a',
  launch: '#a855f7',
}

export const LIMIT_LABELS: Record<LimitKind, string> = {
  power: 'Power-limited',
  grip: 'Traction-limited',
  cornering: 'Cornering',
  braking: 'Braking',
  driver: 'Driver / coasting',
  launch: 'Launch (clutch / traction)',
}

export const LIMIT_ORDER: LimitKind[] = ['launch', 'power', 'grip', 'cornering', 'braking', 'driver']

export const CHART_STYLE = {
  backgroundColor: '#0f0f12',
  border: '1px solid #2a2a35',
  borderRadius: '6px',
  fontFamily: '"JetBrains Mono", monospace',
}

export const AXIS_TICK = { fill: '#8888a0', fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }
export const AXIS_LABEL_STYLE = { fill: '#55556a', fontSize: 11, fontFamily: '"Barlow Condensed", sans-serif' }

export function fmtDelta(s: number): string {
  if (!Number.isFinite(s)) return '—'
  const sign = s > 0 ? '+' : s < 0 ? '−' : ''
  return `${sign}${Math.abs(s).toFixed(3)}s`
}
