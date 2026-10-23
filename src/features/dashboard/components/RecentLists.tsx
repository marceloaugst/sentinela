import { Link } from 'react-router-dom'
import { ConnectionBadge, IncidentStatusBadge, SeverityBadge, AlertStatusBadge } from '@/components/data-display/status'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDuration, formatRelative } from '@/lib/format'
import { useServers } from '@/features/servers/hooks/useServers'
import { useRecentAlerts, useRecentIncidents } from '../hooks/useDashboard'

function ListCard({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Link to={to} className="text-xs text-primary hover:underline">
          Ver todos
        </Link>
      </CardHeader>
      <div className="flex-1">{children}</div>
    </Card>
  )
}

export function ServerStatusList() {
  const q = useServers({ per_page: 8, sort: 'last_seen_at', order: 'desc' })
  return (
    <ListCard title="Servidores" to="/servers">
      {q.isPending ? (
        <LoadingRows rows={4} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : q.data.data.length === 0 ? (
        <EmptyState title="Nenhum servidor cadastrado" description="Cadastre um servidor na página Servidores." />
      ) : (
        <ul className="divide-y">
          {q.data.data.map((s) => (
            <li key={s.id}>
              <Link to={`/servers/${s.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.hostname}</p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">{formatRelative(s.last_seen_at)}</span>
                <ConnectionBadge status={s.connection_status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ListCard>
  )
}

export function RecentAlertsList() {
  const q = useRecentAlerts(6)
  return (
    <ListCard title="Alertas ativos recentes" to="/alerts">
      {q.isPending ? (
        <LoadingRows rows={4} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState title="Nenhum alerta ativo" description="Tudo certo por aqui." />
      ) : (
        <ul className="divide-y">
          {q.data.map((a) => (
            <li key={a.id} className="space-y-1 px-4 py-2.5 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={a.severity} />
                <AlertStatusBadge status={a.status} />
                <span className="ml-auto text-xs text-muted-foreground">{formatRelative(a.triggered_at)}</span>
              </div>
              <p className="line-clamp-2 text-sm">{a.message}</p>
              <p className="text-xs text-muted-foreground">
                <Link to={`/servers/${a.server_id}`} className="hover:underline">
                  {a.server_name}
                </Link>{' '}
                · {a.rule_name}
              </p>
            </li>
          ))}
        </ul>
      )}
    </ListCard>
  )
}

export function RecentIncidentsList() {
  const q = useRecentIncidents(6)
  return (
    <ListCard title="Incidentes recentes" to="/incidents">
      {q.isPending ? (
        <LoadingRows rows={4} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState title="Nenhum incidente registrado" />
      ) : (
        <ul className="divide-y">
          {q.data.map((i) => (
            <li key={i.id}>
              <Link to={`/incidents/${i.id}`} className="block space-y-1 px-4 py-2.5 hover:bg-accent/40 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={i.severity} />
                  <IncidentStatusBadge status={i.status} />
                  <span className="ml-auto text-xs text-muted-foreground">{formatRelative(i.started_at)}</span>
                </div>
                <p className="line-clamp-2 text-sm">{i.title}</p>
                <p className="text-xs text-muted-foreground">
                  {i.server_name ?? 'Sem servidor'} · duração {formatDuration(i.duration_seconds)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ListCard>
  )
}
