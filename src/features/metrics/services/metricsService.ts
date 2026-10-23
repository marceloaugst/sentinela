import { get } from '@/lib/api'
import { periodRange, type PeriodKey } from '@/lib/periods'
import type { MetricPoint, SeriesMeta } from '@/types/api'

export const metricsService = {
  serverSeries: (serverId: string, period: PeriodKey, signal?: AbortSignal) => {
    const { from, to, interval } = periodRange(period)
    return get<{ data: MetricPoint[]; meta: SeriesMeta }>(`/servers/${serverId}/metrics`, { from, to, interval }, signal)
  },
}
