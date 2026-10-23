import type { Interval } from '@/types/api'

export type PeriodKey = '15m' | '1h' | '6h' | '24h' | '7d'

export interface Period {
  key: PeriodKey
  label: string
  ms: number
  /** Intervalo de agregação enviado à API (mantém os gráficos abaixo de ~1000 pontos). */
  interval: Exclude<Interval, 'raw'>
}

export const PERIODS: Period[] = [
  { key: '15m', label: 'Últimos 15 minutos', ms: 15 * 60_000, interval: '1m' },
  { key: '1h', label: 'Última hora', ms: 60 * 60_000, interval: '1m' },
  { key: '6h', label: 'Últimas 6 horas', ms: 6 * 60 * 60_000, interval: '5m' },
  { key: '24h', label: 'Últimas 24 horas', ms: 24 * 60 * 60_000, interval: '15m' },
  { key: '7d', label: 'Últimos 7 dias', ms: 7 * 24 * 60 * 60_000, interval: '1h' },
]

export function getPeriod(key: PeriodKey): Period {
  return PERIODS.find((p) => p.key === key) ?? PERIODS[1]!
}

/** Janela [from, to) calculada no momento da requisição, para que cada refetch avance no tempo. */
export function periodRange(key: PeriodKey, now = Date.now()) {
  const p = getPeriod(key)
  return { from: new Date(now - p.ms).toISOString(), to: new Date(now).toISOString(), interval: p.interval }
}
