import { useQuery } from '@tanstack/react-query'
import { useRefetchInterval } from '@/hooks/usePreferences'
import { dashboardService } from '../services/dashboardService'

export function useDashboardSummary() {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: ({ signal }) => dashboardService.summary(signal),
    refetchInterval,
  })
}

export function useRecentAlerts(limit = 6, status: 'active' | 'resolved' = 'active') {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['dashboard', 'recent-alerts', limit, status],
    queryFn: ({ signal }) => dashboardService.recentAlerts(limit, status, signal),
    refetchInterval,
  })
}

export function useRecentIncidents(limit = 6) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['dashboard', 'recent-incidents', limit],
    queryFn: ({ signal }) => dashboardService.recentIncidents(limit, signal),
    refetchInterval,
  })
}
