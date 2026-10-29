import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { isApiError } from '@/lib/api'
import { logsService, type CountryFilters, type LogFilters, type LogListParams } from '../services/logsService'

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

/**
 * O servidor consulta o AbuseIPDB aos poucos (até 20 IPs novos por requisição): enquanto houver
 * `unknown.ips`, refaz a busca a cada 5 s, no máximo 3 vezes por combinação de filtros.
 */
export function useLogCountries(filters: CountryFilters) {
  const q = useQuery({
    queryKey: ['logs', 'countries', filters],
    queryFn: ({ signal }) => logsService.countries(filters, signal),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => (query.state.dataUpdateCount < 3 && (query.state.data?.unknown.ips ?? 0) > 0 ? 5_000 : false),
    retry,
  })
  return q
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
