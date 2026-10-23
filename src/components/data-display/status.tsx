import { AlertTriangle, CheckCircle2, CircleHelp, Eye, Info, OctagonAlert, Wrench, XCircle, type LucideIcon } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { AdminStatus, AlertStatus, ConnectionStatus, IncidentStatus, Priority, ServiceStatus, Severity } from '@/types/api'

interface Def {
  label: string
  variant: BadgeProps['variant']
  icon: LucideIcon
}

function make(def: Def, className?: string) {
  const Icon = def.icon
  return (
    <Badge variant={def.variant} className={className}>
      <Icon className="size-3" aria-hidden />
      {def.label}
    </Badge>
  )
}

const CONNECTION: Record<ConnectionStatus, Def> = {
  online: { label: 'Online', variant: 'success', icon: CheckCircle2 },
  offline: { label: 'Offline', variant: 'danger', icon: XCircle },
  unknown: { label: 'Sem dados', variant: 'neutral', icon: CircleHelp },
}
export const ConnectionBadge = ({ status, className }: { status: ConnectionStatus; className?: string }) => make(CONNECTION[status], className)

const ADMIN: Record<AdminStatus, Def> = {
  active: { label: 'Ativo', variant: 'outline', icon: CheckCircle2 },
  maintenance: { label: 'Manutenção', variant: 'warning', icon: Wrench },
  disabled: { label: 'Desativado', variant: 'neutral', icon: XCircle },
}
export const AdminStatusBadge = ({ status, className }: { status: AdminStatus; className?: string }) => make(ADMIN[status], className)

const SERVICE: Record<ServiceStatus, Def> = {
  up: { label: 'Saudável', variant: 'success', icon: CheckCircle2 },
  degraded: { label: 'Degradado', variant: 'warning', icon: AlertTriangle },
  down: { label: 'Indisponível', variant: 'danger', icon: XCircle },
  unknown: { label: 'Desconhecido', variant: 'neutral', icon: CircleHelp },
}
export const ServiceStatusBadge = ({ status, className }: { status: ServiceStatus; className?: string }) => make(SERVICE[status], className)

const SEVERITY: Record<Severity, Def> = {
  critical: { label: 'Crítico', variant: 'danger', icon: OctagonAlert },
  warning: { label: 'Atenção', variant: 'warning', icon: AlertTriangle },
  info: { label: 'Info', variant: 'default', icon: Info },
}
export const SeverityBadge = ({ severity, className }: { severity: Severity; className?: string }) => make(SEVERITY[severity], className)

// Reconhecido NÃO é resolvido: são estados distintos.
const ALERT: Record<AlertStatus | 'pending', Def> = {
  pending: { label: 'Pendente', variant: 'neutral', icon: CircleHelp },
  firing: { label: 'Disparado', variant: 'danger', icon: OctagonAlert },
  acknowledged: { label: 'Reconhecido', variant: 'warning', icon: Eye },
  resolved: { label: 'Resolvido', variant: 'success', icon: CheckCircle2 },
}
export const AlertStatusBadge = ({ status, className }: { status: AlertStatus | 'pending'; className?: string }) => make(ALERT[status], className)

const INCIDENT: Record<IncidentStatus, Def> = {
  open: { label: 'Aberto', variant: 'danger', icon: OctagonAlert },
  resolved: { label: 'Resolvido', variant: 'success', icon: CheckCircle2 },
}
export const IncidentStatusBadge = ({ status, className }: { status: IncidentStatus; className?: string }) => make(INCIDENT[status], className)

export const SEVERITY_LABEL: Record<Severity, string> = { critical: 'Crítico', warning: 'Atenção', info: 'Info' }

export const PRIORITY_LABEL: Record<Priority, string> = { 1: 'P1 — Crítico', 2: 'P2 — Alto', 3: 'P3 — Atenção', 4: 'P4 — Informativo' }

const PRIORITY: Record<Priority, Def> = {
  1: { label: 'P1', variant: 'danger', icon: OctagonAlert },
  2: { label: 'P2', variant: 'orange', icon: OctagonAlert },
  3: { label: 'P3', variant: 'warning', icon: AlertTriangle },
  4: { label: 'P4', variant: 'default', icon: Info },
}
/** Tolera resposta sem `priority` (API ainda não atualizada): nesse caso não mostra o selo. */
export const PriorityBadge = ({ priority, className }: { priority?: Priority | null; className?: string }) =>
  priority && PRIORITY[priority] ? <span title={PRIORITY_LABEL[priority]}>{make(PRIORITY[priority], className)}</span> : null
