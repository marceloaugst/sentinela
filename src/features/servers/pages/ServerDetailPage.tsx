import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AdminStatusBadge, ConnectionBadge } from '@/components/data-display/status'
import { LastUpdated } from '@/components/data-display/LastUpdated'
import { PageHeader } from '@/components/data-display/PageHeader'
import { PeriodSelect } from '@/components/data-display/PeriodSelect'
import { Pagination } from '@/components/data-display/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UsageBar } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDetailDialog } from '@/features/alerts/components/AlertDetailDialog'
import { AlertsTable } from '@/features/alerts/components/AlertsTable'
import { useAuth } from '@/features/auth/AuthProvider'
import { DockerTab } from '@/features/docker/components/DockerTab'
import { ProcessesTab } from '@/features/processes/components/ProcessesTab'
import { ServerLogsTab } from '@/features/logs/components/ServerLogsTab'
import { IncidentsTable } from '@/features/incidents/components/IncidentsTable'
import { ServerMetricCharts } from '@/features/metrics/components/MetricCharts'
import { DiscoveryPanel } from '@/features/services/components/DiscoveryPanel'
import { ServicesTable } from '@/features/services/components/ServicesTable'
import { isApiError } from '@/lib/api'
import { formatBytes, formatDateTime, formatDuration, formatNumber, formatPercent, formatRate, formatRelative } from '@/lib/format'
import type { PeriodKey } from '@/lib/periods'
import type { Alert } from '@/types/api'
import { CredentialsPanel } from '../components/CredentialsPanel'
import { ServerFormDialog } from '../components/ServerFormDialog'
import { useServer, useServerAlerts, useServerDocker, useServerIncidents, useServerServices, useServerSummary } from '../hooks/useServers'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="tabular truncate text-sm font-medium">{children}</dd>
    </div>
  )
}

function ServicesTab({ serverId }: { serverId: string }) {
  const q = useServerServices(serverId)

  return (
    <div className="space-y-4">
      <DiscoveryPanel serverId={serverId} />
      <Card>
        <CardHeader>
          <CardTitle>Serviços monitorados</CardTitle>
          <CardDescription>Serviços já vistos disponíveis; se caírem, geram alerta.</CardDescription>
        </CardHeader>
        {q.isPending ? (
          <LoadingRows rows={3} />
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        ) : q.data.data.length === 0 ? (
          <EmptyState title="Nenhum serviço monitorado neste servidor" />
        ) : (
          <ServicesTable services={q.data.data} />
        )}
      </Card>
    </div>
  )
}

function AlertsTab({ serverId }: { serverId: string }) {
  const [page, setPage] = useState(1)
  const q = useServerAlerts(serverId, page)
  const [selected, setSelected] = useState<Alert | null>(null)
  const rows = q.data?.data ?? []
  const current = selected ? (rows.find((a) => a.id === selected.id) ?? selected) : null
  return (
    <Card>
      {q.isPending ? (
        <LoadingRows rows={3} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title="Nenhum alerta para este servidor" />
      ) : (
        <>
          <AlertsTable alerts={rows} onSelect={setSelected} showServer={false} />
          <Pagination meta={q.data?.meta} onPage={setPage} />
        </>
      )}
      <AlertDetailDialog alert={current} onClose={() => setSelected(null)} />
    </Card>
  )
}

function IncidentsTab({ serverId }: { serverId: string }) {
  const [page, setPage] = useState(1)
  const q = useServerIncidents(serverId, page)
  return (
    <Card>
      {q.isPending ? (
        <LoadingRows rows={3} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : q.data.data.length === 0 ? (
        <EmptyState title="Nenhum incidente para este servidor" />
      ) : (
        <>
          <IncidentsTable incidents={q.data.data} showServer={false} />
          <Pagination meta={q.data.meta} onPage={setPage} />
        </>
      )}
    </Card>
  )
}

export function ServerDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const { can } = useAuth()
  const isAdmin = can('admin')
  const [searchParams, setSearchParams] = useSearchParams()
  const [period, setPeriod] = useState<PeriodKey>('1h')
  const [editOpen, setEditOpen] = useState(false)

  const server = useServer(id)
  const summary = useServerSummary(id)
  const docker = useServerDocker(id)
  // A aba só fica disponível quando o servidor tem Docker (instalado, mesmo que sem acesso ou parado).
  const hasDocker = !!docker.data && docker.data.status !== 'not_installed' && docker.data.status !== 'unknown'
  const requestedTab = searchParams.get('tab') ?? 'metrics'
  const tab = requestedTab === 'docker' && !hasDocker ? 'metrics' : requestedTab

  if (server.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (server.isError) {
    const notFound = isApiError(server.error) && (server.error.status === 404 || server.error.status === 400)
    return notFound ? (
      <EmptyState
        title="Servidor não encontrado"
        description="Ele pode ter sido removido."
        action={
          <Button asChild size="sm">
            <Link to="/servers">Voltar aos servidores</Link>
          </Button>
        }
      />
    ) : (
      <ErrorState error={server.error} onRetry={() => void server.refetch()} />
    )
  }

  const s = server.data
  const sm = summary.data
  const latest = sm?.latest
  const online = s.connection_status === 'online'
  const os = [s.operating_system, s.operating_system_version].filter(Boolean).join(' ')

  return (
    <>
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
          <Link to="/servers">
            <ArrowLeft /> Servidores
          </Link>
        </Button>
        <PageHeader
          title={s.name}
          description={[s.hostname, os, s.architecture].filter(Boolean).join(' · ')}
          actions={
            <>
              <ConnectionBadge status={s.connection_status} />
              <AdminStatusBadge status={s.status} />
              <LastUpdated updatedAt={summary.dataUpdatedAt} fetching={summary.isFetching} failed={summary.isError && !!sm} onRefresh={() => void qc.invalidateQueries({ queryKey: ['servers', id] })} />
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil /> Editar
                </Button>
              )}
            </>
          }
        />
      </div>

      <Card>
        <CardContent className="pt-4 sm:pt-5">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Fact label="Tempo de atividade">{formatDuration(latest?.uptime_seconds)}</Fact>
            <Fact label="Última comunicação">
              <span title={formatDateTime(s.last_seen_at)}>{formatRelative(s.last_seen_at)}</span>
            </Fact>
            <Fact label="Versão do agente">{s.agent_version ?? '—'}</Fact>
            <Fact label="Disponibilidade (24 h)">{sm?.availability.percent != null ? formatPercent(sm.availability.percent, 2) : '—'}</Fact>
            <Fact label="Alertas ativos">{sm?.alerts.active ?? '—'}</Fact>
            <Fact label="Incidentes abertos">{sm?.incidents.open ?? '—'}</Fact>
          </dl>
        </CardContent>
      </Card>

      {summary.isError && !sm ? (
        <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
      ) : summary.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : !latest ? (
        <Card>
          <EmptyState title="Ainda sem métricas" description="Nenhuma amostra foi recebida do agente deste servidor." />
        </Card>
      ) : (
        <>
          {!online && (
            <p role="status" className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
              O servidor não está online. Os valores abaixo são da última amostra recebida ({formatRelative(latest.received_at)}).
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">CPU</p>
              <p className="tabular text-2xl font-semibold">{formatPercent(latest.cpu_usage_percent)}</p>
              <UsageBar percent={latest.cpu_usage_percent} className="my-2" label="CPU" />
              <p className="tabular text-xs text-muted-foreground">
                {latest.cpu_count ?? '—'} CPUs · load {formatNumber(latest.load_average.m1, 2)} / {formatNumber(latest.load_average.m5, 2)} / {formatNumber(latest.load_average.m15, 2)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Memória RAM</p>
              <p className="tabular text-2xl font-semibold">{formatPercent(latest.memory.used_percent)}</p>
              <UsageBar percent={latest.memory.used_percent} className="my-2" label="Memória" />
              <p className="tabular text-xs text-muted-foreground">
                {formatBytes(latest.memory.used_bytes)} usada · {formatBytes(latest.memory.available_bytes)} disponível · {formatBytes(latest.memory.total_bytes)} total
              </p>
              {latest.memory.swap_total_bytes > 0 && (
                <p className="tabular text-xs text-muted-foreground">
                  Swap: {formatBytes(latest.memory.swap_used_bytes)} de {formatBytes(latest.memory.swap_total_bytes)}
                </p>
              )}
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Rede (taxa atual)</p>
              {latest.network ? (
                <div className="tabular mt-1 space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Recebido </span>
                    <span className="text-lg font-semibold">{formatRate(latest.network.rx_bytes_per_sec)}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Enviado </span>
                    <span className="text-lg font-semibold">{formatRate(latest.network.tx_bytes_per_sec)}</span>
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Taxa indisponível (contador reiniciado, lacuna nos dados ou amostras insuficientes).</p>
              )}
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Serviços</p>
              <p className="tabular text-2xl font-semibold">
                {sm?.services.up ?? 0}
                <span className="text-base font-normal text-muted-foreground"> / {sm?.services.total ?? 0} saudáveis</span>
              </p>
              <p className="tabular mt-2 text-xs text-muted-foreground">
                {sm?.services.degraded ?? 0} degradados · {sm?.services.down ?? 0} indisponíveis · {sm?.services.unknown ?? 0} desconhecidos
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Volumes</CardTitle>
              <CardDescription>Espaço total e utilizado por ponto de montagem (última coleta).</CardDescription>
            </CardHeader>
            <CardContent>
              {sm.disks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum volume reportado pelo agente.</p>
              ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                  {sm.disks.map((d) => (
                    <li key={d.mount_point} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="truncate font-medium">
                          {d.mount_point}
                          {d.filesystem && <span className="ml-2 text-xs font-normal text-muted-foreground">{d.filesystem}</span>}
                        </span>
                        <span className="tabular shrink-0 font-medium">{formatPercent(d.used_percent)}</span>
                      </div>
                      <UsageBar percent={d.used_percent} label={`Volume ${d.mount_point}`} />
                      <p className="tabular text-xs text-muted-foreground">
                        {formatBytes(d.used_bytes)} usados · {formatBytes(d.available_bytes)} livres · {formatBytes(d.total_bytes)} total
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Tabs value={tab} onValueChange={(t) => setSearchParams({ tab: t }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="incidents">Incidentes</TabsTrigger>
          <TabsTrigger value="processes">Processos</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="docker" disabled={!hasDocker} title={hasDocker ? undefined : 'Docker não encontrado neste servidor'}>
            Docker
          </TabsTrigger>
          {isAdmin && <TabsTrigger value="agent">Agente</TabsTrigger>}
        </TabsList>
        <TabsContent value="metrics" className="space-y-4">
          <div className="flex justify-end">
            <PeriodSelect value={period} onChange={setPeriod} className="w-52" />
          </div>
          <ServerMetricCharts serverId={s.id} period={period} />
        </TabsContent>
        <TabsContent value="services">
          <ServicesTab serverId={s.id} />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertsTab serverId={s.id} />
        </TabsContent>
        <TabsContent value="incidents">
          <IncidentsTab serverId={s.id} />
        </TabsContent>
        <TabsContent value="processes">
          <ProcessesTab serverId={s.id} />
        </TabsContent>
        <TabsContent value="logs">
          <ServerLogsTab serverId={s.id} />
        </TabsContent>
        {hasDocker && (
          <TabsContent value="docker">
            <DockerTab serverId={s.id} />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="agent">
            <CredentialsPanel serverId={s.id} />
          </TabsContent>
        )}
      </Tabs>

      <ServerFormDialog open={editOpen} onOpenChange={setEditOpen} server={s} />
    </>
  )
}
