import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRefetchInterval } from '@/hooks/usePreferences'
import { servicesService, type ServiceListParams } from '../services/servicesService'

export function useServices(params: ServiceListParams) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['services', 'list', params],
    queryFn: ({ signal }) => servicesService.list(params, signal),
    refetchInterval,
    placeholderData: keepPreviousData,
  })
}
