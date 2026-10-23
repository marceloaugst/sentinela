import { get } from '@/lib/api'
import { periodRange, type PeriodKey } from '@/lib/periods'
import type { AggregatedPoint, DashboardSummary, Envelope, RecentAlert, RecentIncident, SeriesMeta } from '@/types/api'

export const dashboardService = {
  summary: (signal?: AbortSignal) => get<Envelope<DashboardSummary>>('/dashboard/summary', undefined, signal).then((r) => r.data),
  metrics: (period: PeriodKey, serverIds?: string[], signal?: AbortSignal) => {
    const { from, to, interval } = periodRange(period)
    return get<{ data: AggregatedPoint[]; meta: SeriesMeta }>(
      '/dashboard/metrics',
      { from, to, interval, server_id: serverIds?.length ? serverIds.join(',') : undefined },
      signal,
    )
  },
  recentAlerts: (limit = 8, status: 'active' | 'resolved' = 'active', signal?: AbortSignal) =>
    get<Envelope<RecentAlert[]>>('/dashboard/recent-alerts', { limit, status }, signal).then((r) => r.data),
  recentIncidents: (limit = 8, signal?: AbortSignal) =>
    get<Envelope<RecentIncident[]>>('/dashboard/recent-incidents', { limit }, signal).then((r) => r.data),
}
