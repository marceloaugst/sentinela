import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRefetchInterval } from '@/hooks/usePreferences'
import { incidentsService, type IncidentListParams } from '../services/incidentsService'

export function useIncidents(params: IncidentListParams) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['incidents', 'list', params],
    queryFn: ({ signal }) => incidentsService.list(params, signal),
    refetchInterval,
    placeholderData: keepPreviousData,
  })
}

export function useIncident(id: string | undefined) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['incidents', 'detail', id],
    queryFn: ({ signal }) => incidentsService.get(id!, signal),
    enabled: !!id,
    refetchInterval,
  })
}

export function useIncidentEvents(id: string | undefined) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['incidents', 'events', id],
    queryFn: ({ signal }) => incidentsService.events(id!, signal),
    enabled: !!id,
    refetchInterval,
  })
}
