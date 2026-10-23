import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRefetchInterval } from '@/hooks/usePreferences'
import { notificationsService, type NotificationListParams } from '../services/notificationsService'

export function useNotifications(params: NotificationListParams, options?: { enabled?: boolean }) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['notifications', 'list', params],
    queryFn: ({ signal }) => notificationsService.list(params, signal),
    // Reserva para o SSE: o sino também atualiza por polling.
    refetchInterval,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}

function useInvalidateNotifications() {
  const qc = useQueryClient()
  return () => void qc.invalidateQueries({ queryKey: ['notifications'] })
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({
    mutationFn: (id: number) => notificationsService.markRead(id),
    onSuccess: invalidate,
  })
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({
    mutationFn: (_opts?: { silent?: boolean }) => notificationsService.markAllRead(),
    onSuccess: ({ marked }, opts) => {
      if (!opts?.silent) toast.success(marked === 1 ? '1 notificação marcada como lida.' : `${marked} notificações marcadas como lidas.`)
      invalidate()
    },
  })
}
