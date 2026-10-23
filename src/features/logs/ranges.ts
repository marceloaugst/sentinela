export const LOG_RANGES = [
  { key: '1h', label: 'Última hora', ms: 60 * 60_000 },
  { key: '24h', label: 'Últimas 24 horas', ms: 24 * 60 * 60_000 },
  { key: '7d', label: 'Últimos 7 dias', ms: 7 * 24 * 60 * 60_000 },
  { key: '31d', label: 'Últimos 31 dias', ms: 31 * 24 * 60 * 60_000 },
] as const

export type LogRangeKey = (typeof LOG_RANGES)[number]['key']

export const DEFAULT_LOG_RANGE: LogRangeKey = '24h'

export function isLogRange(v: string | null): v is LogRangeKey {
  return LOG_RANGES.some((r) => r.key === v)
}

/** Janela calculada no momento da requisição, para que cada refetch avance no tempo (a API aceita no máximo 31 dias). */
export function logRangeWindow(key: LogRangeKey, now = Date.now()) {
  const ms = LOG_RANGES.find((r) => r.key === key)?.ms ?? 24 * 60 * 60_000
  return { from: new Date(now - ms).toISOString(), to: new Date(now).toISOString() }
}
