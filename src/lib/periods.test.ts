import { describe, expect, it } from 'vitest'
import { getPeriod, periodRange, PERIODS } from './periods'

describe('periods', () => {
  it('expõe os cinco períodos pedidos', () => {
    expect(PERIODS.map((p) => p.key)).toEqual(['15m', '1h', '6h', '24h', '7d'])
  })

  it('calcula a janela [from, to) e o intervalo enviados à API', () => {
    const now = Date.parse('2026-10-20T12:00:00Z')
    const r = periodRange('6h', now)
    expect(r.to).toBe('2026-10-20T12:00:00.000Z')
    expect(r.from).toBe('2026-10-20T06:00:00.000Z')
    expect(r.interval).toBe('5m')
  })

  it('nunca pede "raw" (o endpoint agregado não aceita)', () => {
    expect(PERIODS.every((p) => (p.interval as string) !== 'raw')).toBe(true)
    expect(getPeriod('7d').interval).toBe('1h')
  })
})
