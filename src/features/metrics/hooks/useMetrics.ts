import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRefetchInterval } from '@/hooks/usePreferences'
import type { PeriodKey } from '@/lib/periods'
import { dashboardService } from '@/features/dashboard/services/dashboardService'
import { metricsService } from '../services/metricsService'

export function useServerSeries(serverId: string | undefined, period: PeriodKey) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['servers', serverId, 'metrics', period],
    queryFn: ({ signal }) => metricsService.serverSeries(serverId!, period, signal),
    enabled: !!serverId,
    refetchInterval,
    // Mantém o gráfico anterior visível enquanto o novo período carrega.
    placeholderData: keepPreviousData,
  })
}

export function useAggregateSeries(period: PeriodKey, serverIds?: string[]) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['dashboard', 'metrics', period, serverIds ?? 'all'],
    queryFn: ({ signal }) => dashboardService.metrics(period, serverIds, signal),
    refetchInterval,
    placeholderData: keepPreviousData,
  })
}
