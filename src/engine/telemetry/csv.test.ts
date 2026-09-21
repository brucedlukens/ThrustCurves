import { describe, it, expect } from 'vitest'
import { parseCsv, numericColumn, detectDelimiter, splitLine } from './csv'

describe('parseCsv', () => {
  it('parses a plain comma CSV with a header row', () => {
    const t = parseCsv('Time,Speed\n0,0\n0.1,1.5\n0.2,3\n')
    expect(t.headers).toEqual(['Time', 'Speed'])
    expect(t.rows).toHaveLength(3)
    expect(numericColumn(t, 'Speed')).toEqual([0, 1.5, 3])
  })

  it('skips metadata lines above the header and a unit row below it', () => {
    const text = [
      '# RaceChrono export',
      'Session,Test run',
      'Time,Speed,LatAccel',
      's,mph,g',
      '0,0,0',
      '0.1,2,0.1',
      '0.2,4,0.2',
    ].join('\n')
    const t = parseCsv(text)
    expect(t.headers).toEqual(['Time', 'Speed', 'LatAccel'])
    expect(t.rows).toHaveLength(3)
  })

  it('handles tab and semicolon delimiters', () => {
    expect(parseCsv('a\tb\n1\t2\n3\t4\n').headers).toEqual(['a', 'b'])
    expect(parseCsv('a;b\n1;2\n3;4\n').rows[1]).toEqual(['3', '4'])
  })

  it('handles quoted headers containing the delimiter', () => {
    const t = parseCsv('"Speed, GPS","Time"\n1,0\n2,1\n')
    expect(t.headers).toEqual(['Speed, GPS', 'Time'])
    expect(t.rows[0]).toEqual(['1', '0'])
  })

  it('returns NaN for missing cells and unknown columns', () => {
    const t = parseCsv('a,b\n1,\n2,3\n')
    expect(numericColumn(t, 'b')).toEqual([NaN, 3])
    expect(numericColumn(t, 'zzz')).toEqual([NaN, NaN])
  })

  it('generates column names when there is no header', () => {
    const t = parseCsv('1,2\n3,4\n5,6\n')
    expect(t.headers).toEqual(['col1', 'col2'])
    expect(t.rows).toHaveLength(3)
  })

  it('returns empty for empty input', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] })
  })

  it('detectDelimiter picks the most consistent candidate', () => {
    expect(detectDelimiter(['a,b,c', '1,2,3'])).toBe(',')
    expect(detectDelimiter(['a\tb', '1\t2'])).toBe('\t')
  })

  it('splitLine unescapes doubled quotes', () => {
    expect(splitLine('"say ""hi""",x', ',')).toEqual(['say "hi"', 'x'])
  })
})
