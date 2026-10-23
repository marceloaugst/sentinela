// Tipos do contrato da API Sentinela (OpenAPI v0.6.0 — ver frontend-api.md).

export type UserRole = 'viewer' | 'operator' | 'admin'
export type AdminStatus = 'active' | 'maintenance' | 'disabled'
export type ConnectionStatus = 'online' | 'offline' | 'unknown'
export type Severity = 'info' | 'warning' | 'critical'
export type MetricName =
  | 'cpu_usage_percent'
  | 'memory_used_percent'
  | 'disk_used_percent'
  | 'load_average_1m'
  | 'server_offline'
  | 'service_down'
  | 'swap_used_percent'
  | 'load_per_cpu'
  | 'oom_kills_10m'
  | 'inode_used_percent'
  | 'disk_latency_ms'
  | 'ntp_unsynchronized'
  | 'security_updates'
  | 'cert_days_left'
/** 1 = P1 crítico … 4 = P4 informativo. */
export type Priority = 1 | 2 | 3 | 4
export type RuleOperator = '>' | '>=' | '<' | '<=' | '=='
export type ServiceType = 'discovered'
export type ServiceStatus = 'unknown' | 'up' | 'down' | 'degraded'
export type AlertStatus = 'firing' | 'acknowledged' | 'resolved'
export type AlertStatusFilter = 'active' | AlertStatus
export type IncidentStatus = 'open' | 'resolved'
export type Interval = 'raw' | '1m' | '5m' | '15m' | '1h' | '6h' | '1d'

export interface Envelope<T> {
  data: T
}
export interface PageMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}
export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

export interface PageParams {
  page?: number
  per_page?: number
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at: string | null
  password_changed_at: string
}

export interface SessionInfo {
  user: User
  via: 'session' | 'api_key'
  csrf_token: string
  expires_at: string
  idle_expires_at: string
}

export interface AuditEntry {
  id: number
  action: string
  resource_type: string
  resource_id: string | null
  actor: string
  actor_user_id: string | null
  ip: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Server {
  id: string
  name: string
  hostname: string
  operating_system: string | null
  operating_system_version: string | null
  architecture: string | null
  agent_version: string | null
  status: AdminStatus
  connection_status: ConnectionStatus
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export interface Disk {
  mount_point: string
  filesystem: string | null
  total_bytes: number
  used_bytes: number
  available_bytes: number
  used_percent: number
  collected_at: string
}

export interface Credential {
  id: string
  server_id: string
  created_at: string
  expires_at: string | null
  revoked_at: string | null
  last_used_at: string | null
}

/** O contrato não detalha o formato; o token completo só aparece na emissão. */
export type IssuedCredential = Partial<Credential> & { token?: string; [key: string]: unknown }

export interface Stat {
  min: number | null
  avg: number | null
  max: number | null
}

export interface SeriesMeta {
  from: string
  to: string
  interval: string
  bucket_seconds: number
  points: number
  max_points: number
}

export interface MetricPoint {
  t: string
  samples: number
  cpu_usage_percent: Stat
  memory_used_percent: Stat
  memory_used_bytes: Stat
  load_average_1m: Stat
  swap_used_percent: Stat
  network_rx_bytes_per_sec: Stat
  network_tx_bytes_per_sec: Stat
}

export interface AggregatedPoint {
  t: string
  samples: number
  servers: number
  cpu_usage_percent: Stat
  memory_used_percent: number | null
  load_average_1m: Stat
}

export interface Capacity {
  used_bytes: number
  total_bytes: number
  used_percent: number | null
}

export interface AlertCounts {
  active: number
  critical: number
  warning: number
  info: number
}

export interface DashboardSummary {
  servers: {
    total: number
    online: number
    offline: number
    unknown: number
    maintenance: number
    disabled: number
    with_active_alerts: number
  }
  alerts: AlertCounts
  incidents: { open: number }
  resources: {
    reporting_servers: number
    cpu: {
      weighted_avg_percent: number | null
      max_percent: number | null
      top_server?: { id: string; name: string } | null
      distribution: { low: number; medium: number; high: number }
    }
    memory: Capacity
    disk: Capacity
  }
  data_as_of: string | null
  updated_at: string
}

export interface ServerSummary {
  server: Server
  latest: {
    collected_at: string
    received_at: string
    cpu_usage_percent: number
    cpu_count: number | null
    load_average: { m1: number | null; m5: number | null; m15: number | null }
    memory: {
      total_bytes: number
      used_bytes: number
      available_bytes: number
      used_percent: number | null
      swap_total_bytes: number
      swap_used_bytes: number
    }
    uptime_seconds: number | null
    network: { rx_bytes_per_sec: number; tx_bytes_per_sec: number } | null
  } | null
  disks: Disk[]
  alerts: AlertCounts
  incidents: { open: number }
  services: { total: number; up: number; down: number; degraded: number; unknown: number }
  availability: { window_seconds: number; percent: number | null }
}

export interface RecentAlert {
  id: string
  server_id: string
  server_name: string
  rule_id: string
  rule_name: string
  severity: Severity
  status: 'pending' | AlertStatus
  message: string
  triggered_at: string
  acknowledged_at: string | null
  resolved_at: string | null
}

export interface RecentIncident {
  id: string
  server_id: string | null
  server_name: string | null
  title: string
  severity: Severity
  status: IncidentStatus
  started_at: string
  resolved_at: string | null
  duration_seconds: number
}

export interface Service {
  id: string
  server_id: string
  name: string
  service_type: ServiceType
  status: ServiceStatus
  last_checked_at: string | null
  last_error: string | null
  status_changed_at: string | null
  created_at: string
  updated_at: string
}

/** Regra do catálogo automático: somente leitura (não há criação/edição pela API). */
export interface AlertRule {
  id: string
  code: string
  name: string
  description: string | null
  priority: Priority
  metric_name: MetricName
  operator: RuleOperator
  threshold: number
  severity: Severity
  duration_seconds: number
  recovery_seconds: number
  server_id: string | null
  is_enabled: boolean
  created_at?: string
  updated_at?: string
}

export interface Alert {
  id: string
  rule_id: string
  rule_name: string
  server_id: string
  server_name: string
  service_id: string | null
  service_name: string | null
  incident_id: string | null
  status: AlertStatus
  priority: Priority
  severity: Severity
  message: string
  value: number | null
  triggered_at: string
  acknowledged_at: string | null
  acknowledged_by: string | null
  resolved_at: string | null
  resolved_reason?: 'recovered' | 'manual' | 'rule_disabled' | 'rule_deleted' | 'out_of_scope' | null
  last_evaluated_at: string
}

export interface Incident {
  id: string
  server_id: string | null
  server_name: string | null
  rule_id: string | null
  rule_name: string | null
  service_id: string | null
  service_name: string | null
  title: string
  priority: Priority
  severity: Severity
  status: IncidentStatus
  /** Incidentes iguais resolvidos nas 24 h anteriores; > 0 = reincidente. */
  recurrence_count: number
  started_at: string
  resolved_at: string | null
  duration_seconds: number
}

export type IncidentDetail = Incident & { alerts?: Alert[] }

export interface IncidentEvent {
  id: number
  event_type: 'opened' | 'alert_triggered' | 'acknowledged' | 'alert_resolved' | 'resolved' | 'recurrent'
  message: string
  created_at: string
}

export interface NotificationChannel {
  id: string
  name: string
  channel_type: 'telegram'
  chat_id: string
  min_severity: Severity
  is_enabled: boolean
  has_token: boolean
  created_at: string
  updated_at: string
}

export type NotificationKind = 'alert_triggered' | 'alert_resolved' | 'ip_banned'

export interface AppNotification {
  id: number
  kind: NotificationKind
  priority: Priority
  severity: Severity
  server_id: string | null
  server_name: string | null
  alert_id: string | null
  incident_id: string | null
  title: string
  message: string
  data: Record<string, unknown> | null
  created_at: string
  read_at: string | null
}

export interface NotificationsPage {
  data: AppNotification[]
  meta: PageMeta & { unread: number }
}

export interface CreateChannel {
  name: string
  channel_type?: 'telegram'
  bot_token: string
  chat_id: string
  min_severity?: Severity
  is_enabled?: boolean
}

export interface HealthInfo {
  status: string
  version: string
}

// ── SSE ────────────────────────────────────────────────────────────────────
export type StreamEventType =
  | 'server.status_changed'
  | 'metrics.updated'
  | 'alert.triggered'
  | 'alert.acknowledged'
  | 'alert.resolved'
  | 'incident.created'
  | 'incident.resolved'
  | 'service.status_changed'
  | 'security.ip_banned'
  | 'resync'

export interface StreamEnvelope<T = unknown> {
  id?: number
  type: StreamEventType
  time: string
  data: T
}

// ── Logs (nginx, fail2ban, firewall) ───────────────────────────────────────
export type LogSource = 'nginx' | 'fail2ban' | 'firewall'
export type LogSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical'

export interface LogRow {
  /** ISO-8601 UTC. */
  time: string
  server_id: string
  source: LogSource
  type: string
  severity: LogSeverity
  ip?: string
  /** Firewall: porta de destino. */
  port?: number
  /** nginx access: status HTTP. */
  status?: number
  fields: Record<string, string>
  /** Linha original, sem query string. */
  raw?: string
}

export interface LogStats {
  from: string
  to: string
  bucket_seconds: number
  by_source: { source: LogSource; type: string; count: number }[]
  top_ips: { ip: string; events: number; bans: number; firewall_blocks: number; http_errors: number }[]
  top_blocked_ports: { port: number; blocks: number }[]
  timeline: { time: string; source: LogSource; count: number }[]
  traffic: { time: string; requests: number; errors_4xx: number; errors_5xx: number }[]
}

export interface BanEvent {
  ip: string
  jail: string
  banned_at: string
}

export type DiscoveryStatus = 'available' | 'stopped' | 'not_found'

export interface DiscoveryItem {
  key: string
  name: string
  available: boolean
  status: DiscoveryStatus
  source: '' | 'systemd' | 'process' | 'docker'
  unit: string
  action: string
  checked_at: string | null
  status_changed_at: string | null
}

export interface Discovery {
  summary: { total: number; available: number; unavailable: number }
  checked_at: string | null
  services: DiscoveryItem[]
}

export type DockerStatus = 'ok' | 'not_installed' | 'no_access' | 'unavailable' | 'unknown'
export type ContainerState = 'running' | 'restarting' | 'exited' | 'created' | 'dead' | 'paused' | 'removing'
export type DockerAction = 'start' | 'restart'
export type CommandStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'expired'

export interface DockerContainer {
  /** 64 hex. */
  id: string
  name: string
  image: string
  state: ContainerState
  /** Texto do Docker ("Up 3 hours"). */
  status: string
  exit_code: number | null
  oom_killed: boolean
  /** Vazio se ativo. */
  error: string
  /** Texto cru (não é HTML); vazio se ativo. */
  log_tail: string
  started_at: string | null
  finished_at: string | null
  actions: DockerAction[]
}

export interface ServerDocker {
  status: DockerStatus
  message: string
  checked_at: string | null
  summary: { total: number; running: number; stopped: number; other: number }
  containers: DockerContainer[]
}

export interface ServiceCommand {
  id: string
  server_id: string
  service_key: string
  service_name: string
  unit: string
  action: 'start' | 'stop' | 'restart' | ProcessAction
  status: CommandStatus
  requested_by: string | null
  requested_actor: string
  message: string
  created_at: string
  started_at: string | null
  finished_at: string | null
  /** "" = serviço systemd; id do container = Docker; "pid:start_time" = processo. */
  target: string
}

export type ProcessStatus = 'ok' | 'unknown'
export type ProcessAction = 'terminate' | 'kill'
export type ProcessRestriction = '' | 'other_user' | 'service' | 'container' | 'critical' | 'self'
export type ProcessSort = 'cpu' | 'memory' | 'pid' | 'name'

export interface ServerProcess {
  pid: number
  /** Identifica o processo junto do pid (o pid pode ser reaproveitado). */
  start_time: number
  ppid: number
  name: string
  /** Texto cru (não é HTML), até 200 caracteres, segredos mascarados. */
  cmdline: string
  user: string
  /** R, S, D, T, Z. */
  state: string
  threads: number
  /** 100 = um núcleo inteiro. */
  cpu_percent: number
  /** RSS. */
  memory_bytes: number
  memory_percent: number
  service_key: string
  service_name: string
  restriction: ProcessRestriction
  restriction_message: string
  actions: ProcessAction[]
}

export interface ServerProcesses {
  status: ProcessStatus
  message: string
  checked_at: string | null
  cpus: number
  memory_total_bytes: number
  total: number
  matched: number
  processes: ServerProcess[]
}
