import { get, send } from '@/lib/api'
import type {
  Alert,
  AlertRule,
  AlertStatusFilter,
  Envelope,
  MetricName,
  PageParams,
  Paginated,
  Priority,
  Severity,
} from '@/types/api'

export interface AlertListParams extends PageParams {
  status?: AlertStatusFilter
  severity?: Severity
  server_id?: string
  rule_id?: string
  priority?: Priority
  from?: string
  to?: string
}

export interface RuleListParams extends PageParams {
  metric_name?: MetricName
  severity?: Severity
  priority?: Priority
  enabled?: boolean
}

export const alertsService = {
  list: (params: AlertListParams, signal?: AbortSignal) => get<Paginated<Alert>>('/alerts', params, signal),
  get: (id: string, signal?: AbortSignal) => get<Envelope<Alert>>(`/alerts/${id}`, undefined, signal).then((r) => r.data),
  acknowledge: (id: string, note?: string) =>
    send<Envelope<Alert>>('post', `/alerts/${id}/acknowledge`, note ? { note } : {}).then((r) => r.data),
  resolve: (id: string) => send<Envelope<Alert>>('post', `/alerts/${id}/resolve`).then((r) => r.data),

  rules: (params: RuleListParams, signal?: AbortSignal) => get<Paginated<AlertRule>>('/alert-rules', params, signal),
}
