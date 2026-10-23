import { get, send } from '@/lib/api'
import type {
  AuditEntry,
  CreateChannel,
  Envelope,
  HealthInfo,
  NotificationChannel,
  PageParams,
  Paginated,
  User,
  UserRole,
} from '@/types/api'

export interface UserListParams extends PageParams {
  q?: string
  role?: UserRole
  is_active?: boolean
}

export interface AuditParams extends PageParams {
  action?: string
  resource_type?: string
  from?: string
  to?: string
}

export const settingsService = {
  // Canais de notificação (admin)
  channels: (signal?: AbortSignal) => get<Envelope<NotificationChannel[]>>('/notification-channels', undefined, signal).then((r) => r.data),
  createChannel: (input: CreateChannel) => send<Envelope<NotificationChannel>>('post', '/notification-channels', input).then((r) => r.data),
  updateChannel: (id: string, input: Partial<CreateChannel>) =>
    send<Envelope<NotificationChannel>>('patch', `/notification-channels/${id}`, input).then((r) => r.data),
  removeChannel: (id: string) => send<void>('delete', `/notification-channels/${id}`),
  testChannel: (id: string) => send<Envelope<{ queued: boolean }>>('post', `/notification-channels/${id}/test`).then((r) => r.data),

  // Usuários e auditoria (admin)
  users: (params: UserListParams, signal?: AbortSignal) => get<Paginated<User>>('/users', params, signal),
  createUser: (input: { name: string; email: string; role: UserRole; password: string }) =>
    send<Envelope<User>>('post', '/users', input).then((r) => r.data),
  updateUser: (id: string, input: Partial<{ name: string; email: string; role: UserRole; is_active: boolean; password: string }>) =>
    send<Envelope<User>>('patch', `/users/${id}`, input).then((r) => r.data),
  revokeSessions: (id: string) =>
    send<Envelope<{ revoked_sessions: number }>>('post', `/users/${id}/sessions/revoke`).then((r) => r.data),
  auditLogs: (params: AuditParams, signal?: AbortSignal) => get<Paginated<AuditEntry>>('/audit-logs', params, signal),

  // Fora de /api/v1
  health: async (signal?: AbortSignal) => {
    const res = await fetch('/healthz', { signal, credentials: 'same-origin' })
    if (!res.ok) throw new Error(`healthz ${res.status}`)
    return ((await res.json()) as Envelope<HealthInfo>).data
  },
}
