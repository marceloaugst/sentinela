import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { isApiError } from '@/lib/api'
import { logsService, type LogFilters, type LogListParams } from '../services/logsService'

/** 4xx e 503 (armazenamento de logs fora do ar) não mudam ao repetir. */
const retry = (count: number, error: unknown) => !(isApiError(error) && (error.status === 503 || (error.status >= 400 && error.status < 500))) && count < 2

/** `live` liga o polling de 5 s (só na página 1); o Query já pausa com a aba oculta. */
export function useLogs(params: LogListParams, live: boolean) {
  return useQuery({
    queryKey: ['logs', 'list', params],
    queryFn: ({ signal }) => logsService.list(params, signal),
    placeholderData: keepPreviousData,
    refetchInterval: live && (params.page ?? 1) === 1 ? 5_000 : false,
    retry,
  })
}

export function useLogStats(filters: LogFilters) {
  return useQuery({
    queryKey: ['logs', 'stats', filters],
    queryFn: ({ signal }) => logsService.stats(filters, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
    retry,
  })
}
