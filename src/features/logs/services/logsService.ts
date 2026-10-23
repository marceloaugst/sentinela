import { get } from '@/lib/api'
import type { Envelope, LogRow, LogSeverity, LogSource, LogStats, Paginated, PageParams } from '@/types/api'
import { logRangeWindow, type LogRangeKey } from '../ranges'

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

export const logsService = {
  list: ({ page, per_page, ...filters }: LogListParams, signal?: AbortSignal) =>
    get<Paginated<LogRow>>('/logs', { ...toQuery(filters), page, per_page }, signal),
  stats: (filters: LogFilters, signal?: AbortSignal) => get<Envelope<LogStats>>('/logs/stats', toQuery(filters), signal).then((r) => r.data),
}
