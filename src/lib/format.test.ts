import { describe, expect, it } from 'vitest'
import { formatBytes, formatDuration, formatPercent, formatRate, formatRelative } from './format'

const nbsp = /\s/g
const norm = (s: string) => s.replace(nbsp, ' ')

describe('format', () => {
  it('formata bytes em unidades binárias', () => {
    expect(norm(formatBytes(0))).toBe('0 B')
    expect(norm(formatBytes(1024))).toBe('1 KB')
    expect(norm(formatBytes(1.5 * 1024 ** 3))).toBe('1,5 GB')
    expect(formatBytes(null)).toBe('—')
  })

  it('diferencia taxa de transferência de volume', () => {
    expect(norm(formatRate(2 * 1024 * 1024))).toBe('2 MB/s')
    expect(formatRate(undefined)).toBe('—')
  })

  it('formata percentuais e trata ausência', () => {
    expect(norm(formatPercent(45.26))).toBe('45,3%')
    expect(formatPercent(null)).toBe('—')
    expect(formatPercent(Number.NaN)).toBe('—')
  })

  it('formata durações', () => {
    expect(formatDuration(45)).toBe('45s')
    expect(formatDuration(125)).toBe('2min')
    expect(formatDuration(3 * 3600 + 5 * 60)).toBe('3h 5min')
    expect(formatDuration(2 * 86400 + 3600)).toBe('2d 1h')
    expect(formatDuration(null)).toBe('—')
  })

  it('formata datas relativas a um instante fixo', () => {
    const now = new Date('2026-10-20T12:00:00Z').getTime()
    expect(formatRelative(null, now)).toBe('Nunca')
    expect(formatRelative('2026-10-20T11:59:50Z', now)).toBe('agora há pouco')
    expect(norm(formatRelative('2026-10-20T11:55:00Z', now))).toContain('5')
  })
})
