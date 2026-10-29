import { get } from '@/lib/api'
import type { CountryMetric, CountryStats, Envelope, LogRow, LogSeverity, LogSource, LogStats, Paginated, PageParams } from '@/types/api'
import { LOG_RANGES, logRangeWindow, type LogRangeKey } from '../ranges'

export interface LogFilters {
  server_id?: string
  source?: LogSource
  type?: string
  severity?: LogSeverity
  ip?: string
  q?: string
  range: LogRangeKey
}

export type LogListParams = LogFilters & PageParams

function toQuery({ range, ...filters }: LogFilters) {
  return { ...filters, ...logRangeWindow(range) }
}

export interface CountryFilters {
  server_id?: string
  range: LogRangeKey
  metric: CountryMetric
}

/** `/logs/countries` aceita `days` (1–31) em vez de `from`/`to`. */
function rangeDays(range: LogRangeKey) {
  const ms = LOG_RANGES.find((r) => r.key === range)?.ms ?? 24 * 60 * 60_000
  return Math.min(31, Math.max(1, Math.ceil(ms / (24 * 60 * 60_000))))
}

export const logsService = {
  countries: ({ range, ...rest }: CountryFilters, signal?: AbortSignal) =>
    get<Envelope<CountryStats>>('/logs/countries', { ...rest, days: rangeDays(range) }, signal).then((r) => r.data),
  list: ({ page, per_page, ...filters }: LogListParams, signal?: AbortSignal) =>
    get<Paginated<LogRow>>('/logs', { ...toQuery(filters), page, per_page }, signal),
  stats: (filters: LogFilters, signal?: AbortSignal) => get<Envelope<LogStats>>('/logs/stats', toQuery(filters), signal).then((r) => r.data),
}
