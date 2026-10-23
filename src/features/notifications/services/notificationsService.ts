import { get, send } from '@/lib/api'
import type { AppNotification, Envelope, NotificationKind, NotificationsPage, PageParams, Priority } from '@/types/api'

export interface NotificationListParams extends PageParams {
  kind?: NotificationKind
  priority?: Priority
  server_id?: string
  unread?: boolean
  from?: string
  to?: string
}

export const notificationsService = {
  list: (params: NotificationListParams, signal?: AbortSignal) => get<NotificationsPage>('/notifications', params, signal),
  markRead: (id: number) => send<Envelope<AppNotification>>('post', `/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => send<Envelope<{ marked: number }>>('post', '/notifications/read-all').then((r) => r.data),
}
