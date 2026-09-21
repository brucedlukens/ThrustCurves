import type { ParsedTable } from '@/types/telemetry'

/**
 * Detect the delimiter by counting candidates on the first few non-empty lines.
 */
export function detectDelimiter(lines: string[]): string {
  const candidates = [',', '\t', ';']
  const sample = lines.slice(0, 10)
  let best = ','
  let bestScore = -1
  for (const d of candidates) {
    const counts = sample.map(l => l.split(d).length - 1)
    const min = Math.min(...counts)
    // Prefer delimiters that appear consistently and often
    const score = min > 0 ? min : 0
    if (score > bestScore) {
      bestScore = score
      best = d
    }
  }
  return best
}

/** Split one line respecting double-quoted fields. */
export function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map(s => s.trim())
}

function isNumeric(s: string): boolean {
  if (s === '') return false
  return !isNaN(Number(s))
}

/**
 * Parse logger CSV text into headers + rows.
 *
 * Handles: comma/tab/semicolon delimiters, quoted fields, leading comment or
 * metadata lines (AiM, RaceChrono, etc.) — the header is taken as the last
 * mostly-non-numeric line before the first run of numeric rows. Unit rows
 * directly under the header (e.g. "s,mph,g") are skipped.
 */
export function parseCsv(text: string): ParsedTable {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.replace(/^\uFEFF/, ''))
    .filter(l => l.trim().length > 0 && !l.trimStart().startsWith('#'))
  if (lines.length === 0) return { headers: [], rows: [] }

  const delimiter = detectDelimiter(lines)
  const split = lines.map(l => splitLine(l, delimiter))

  // Find the first data row: a row where most cells are numeric
  const numericFraction = (cells: string[]) =>
    cells.filter(isNumeric).length / Math.max(1, cells.length)
  let firstData = -1
  for (let i = 0; i < split.length; i++) {
    if (split[i].length >= 2 && numericFraction(split[i]) >= 0.6) {
      // Require the next row (if any) to also be numeric to avoid picking a stray metadata line
      const next = split[i + 1]
      if (!next || numericFraction(next) >= 0.6) {
        firstData = i
        break
      }
    }
  }
  if (firstData === -1) return { headers: split[0], rows: [] }

  // Header: nearest preceding row with the same width and mostly non-numeric
  let headerIdx = -1
  for (let i = firstData - 1; i >= 0; i--) {
    if (numericFraction(split[i]) < 0.5 && split[i].length >= 2) {
      headerIdx = i
      // Keep walking back only if this row looks like a unit row (short tokens, no letters beyond units)
      const looksLikeUnits = split[i].every(c => c.length <= 6)
      const prev = split[i - 1]
      if (looksLikeUnits && prev && prev.length === split[i].length && numericFraction(prev) < 0.5) {
        headerIdx = i - 1
      }
      break
    }
  }

  const width = split[firstData].length
  const headers =
    headerIdx >= 0
      ? split[headerIdx].map((h, i) => (h === '' ? `col${i + 1}` : h))
      : Array.from({ length: width }, (_, i) => `col${i + 1}`)

  const dataStart = headerIdx >= 0 ? headerIdx + 1 : firstData
  const rows = split
    .slice(dataStart)
    .filter(r => r.length >= 2 && numericFraction(r) >= 0.5)
    .map(r => (r.length === headers.length ? r : padOrTrim(r, headers.length)))

  return { headers, rows }
}

function padOrTrim(r: string[], n: number): string[] {
  if (r.length > n) return r.slice(0, n)
  return [...r, ...Array.from({ length: n - r.length }, () => '')]
}

/** Extract one column as numbers (NaN where unparseable). */
export function numericColumn(table: ParsedTable, header: string): number[] {
  const idx = table.headers.indexOf(header)
  if (idx === -1) return table.rows.map(() => NaN)
  return table.rows.map(r => {
    const v = r[idx]
    return v === undefined || v === '' ? NaN : Number(v)
  })
}
