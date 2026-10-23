import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRefetchInterval } from '@/hooks/usePreferences'
import { alertsService, type AlertListParams, type RuleListParams } from '../services/alertsService'

export function useAlerts(params: AlertListParams) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['alerts', 'list', params],
    queryFn: ({ signal }) => alertsService.list(params, signal),
    refetchInterval,
    placeholderData: keepPreviousData,
  })
}

function useInvalidateAlerts() {
  const qc = useQueryClient()
  return () => {
    for (const key of ['alerts', 'incidents', 'dashboard', 'servers']) void qc.invalidateQueries({ queryKey: [key] })
  }
}

export function useAcknowledgeAlert() {
  const invalidate = useInvalidateAlerts()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => alertsService.acknowledge(id, note),
    onSuccess: () => {
      toast.success('Alerta reconhecido. Ele continua ativo até ser resolvido.')
      invalidate()
    },
  })
}

export function useResolveAlert() {
  const invalidate = useInvalidateAlerts()
  return useMutation({
    mutationFn: (id: string) => alertsService.resolve(id),
    onSuccess: () => {
      toast.success('Alerta resolvido.')
      invalidate()
    },
  })
}

export function useAlertRules(params: RuleListParams = { per_page: 100 }) {
  return useQuery({
    queryKey: ['alert-rules', params],
    queryFn: ({ signal }) => alertsService.rules(params, signal),
    placeholderData: keepPreviousData,
  })
}
