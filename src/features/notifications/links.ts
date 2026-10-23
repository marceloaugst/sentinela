import type { AppNotification, NotificationKind } from '@/types/api'

export const KIND_LABEL: Record<NotificationKind, string> = {
  alert_triggered: 'Alerta disparado',
  alert_resolved: 'Alerta recuperado',
  ip_banned: 'IP banido',
}

/** Destino mais específico disponível: incidente, depois servidor (ban), depois lista de alertas. */
export function notificationLink(n: Pick<AppNotification, 'incident_id' | 'server_id' | 'kind'>): string {
  if (n.incident_id) return `/incidents/${n.incident_id}`
  if (n.kind === 'ip_banned') return n.server_id ? `/servers/${n.server_id}` : '/logs'
  return '/alerts'
}
