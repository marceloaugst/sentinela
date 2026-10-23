import { ArrowLeft, CheckCircle2, Circle, Eye, OctagonAlert, Repeat, Siren } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { IncidentStatusBadge, PriorityBadge, SeverityBadge } from '@/components/data-display/status'
import { PageHeader } from '@/components/data-display/PageHeader'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertsTable } from '@/features/alerts/components/AlertsTable'
import { AlertDetailDialog } from '@/features/alerts/components/AlertDetailDialog'
import { isApiError } from '@/lib/api'
import { formatDateTime, formatDuration } from '@/lib/format'
import type { Alert, IncidentEvent } from '@/types/api'
import { useState } from 'react'
import { useIncident, useIncidentEvents } from '../hooks/useIncidents'

const EVENT: Record<IncidentEvent['event_type'], { label: string; icon: typeof Circle; tone: string }> = {
  opened: { label: 'Incidente aberto', icon: Siren, tone: 'text-danger' },
  alert_triggered: { label: 'Alerta disparado', icon: OctagonAlert, tone: 'text-warning' },
  acknowledged: { label: 'Reconhecido', icon: Eye, tone: 'text-primary' },
  alert_resolved: { label: 'Alerta resolvido', icon: CheckCircle2, tone: 'text-success' },
  resolved: { label: 'Incidente resolvido', icon: CheckCircle2, tone: 'text-success' },
  recurrent: { label: 'Reincidente', icon: Repeat, tone: 'text-warning' },
}

export function IncidentDetailPage() {
  const { id } = useParams()
  const incident = useIncident(id)
  const events = useIncidentEvents(id)
  const [selected, setSelected] = useState<Alert | null>(null)

  if (incident.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (incident.isError) {
    const notFound = isApiError(incident.error) && incident.error.status === 404
    return notFound ? (
      <EmptyState title="Incidente não encontrado" action={<Button asChild size="sm"><Link to="/incidents">Voltar aos incidentes</Link></Button>} />
    ) : (
      <ErrorState error={incident.error} onRetry={() => void incident.refetch()} />
    )
  }

  const i = incident.data
  const alerts = i.alerts ?? []
  const current = selected ? (alerts.find((a) => a.id === selected.id) ?? selected) : null

  return (
    <>
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
          <Link to="/incidents">
            <ArrowLeft /> Incidentes
          </Link>
        </Button>
        <PageHeader title={i.title} description={i.server_name ? `Servidor: ${i.server_name}` : undefined} actions={
          <>
            {i.recurrence_count > 0 && (
              <Badge variant="warning">
                <Repeat className="size-3" aria-hidden />
                Reincidente ({i.recurrence_count}×)
              </Badge>
            )}
            <PriorityBadge priority={i.priority} />
            <SeverityBadge severity={i.severity} />
            <IncidentStatusBadge status={i.status} />
          </>
        } />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Início', formatDateTime(i.started_at)],
          ['Resolvido em', i.resolved_at ? formatDateTime(i.resolved_at) : 'Em aberto'],
          ['Duração', formatDuration(i.duration_seconds)],
          ['Regra', i.rule_name ?? '—'],
        ].map(([k, v]) => (
          <Card key={k} className="p-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="tabular mt-1 text-sm font-medium">{v}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Alertas do incidente</CardTitle>
          </CardHeader>
          {alerts.length === 0 ? <EmptyState title="Nenhum alerta associado" /> : <AlertsTable alerts={alerts} onSelect={setSelected} showServer={false} />}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linha do tempo</CardTitle>
          </CardHeader>
          <CardContent>
            {events.isPending ? (
              <LoadingRows rows={3} className="p-0" />
            ) : events.isError ? (
              <ErrorState error={events.error} onRetry={() => void events.refetch()} />
            ) : events.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem eventos registrados.</p>
            ) : (
              <ol className="relative space-y-4 border-l pl-5">
                {events.data.map((e) => {
                  const def = EVENT[e.event_type] ?? { label: e.event_type, icon: Circle, tone: 'text-muted-foreground' }
                  const Icon = def.icon
                  return (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[30px] flex size-5 items-center justify-center rounded-full border bg-card">
                        <Icon className={`size-3 ${def.tone}`} aria-hidden />
                      </span>
                      <p className="text-sm font-medium">{def.label}</p>
                      <p className="text-xs text-muted-foreground">{e.message}</p>
                      <p className="tabular text-xs text-muted-foreground">{formatDateTime(e.created_at)}</p>
                    </li>
                  )
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDetailDialog alert={current} onClose={() => setSelected(null)} />
    </>
  )
}
