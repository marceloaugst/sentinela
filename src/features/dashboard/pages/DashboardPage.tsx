import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Server, ServerCrash, ServerOff, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { ErrorState } from '@/components/data-display/states'
import { LastUpdated } from '@/components/data-display/LastUpdated'
import { PageHeader } from '@/components/data-display/PageHeader'
import { PeriodSelect } from '@/components/data-display/PeriodSelect'
import { StatCard } from '@/components/data-display/StatCard'
import { Select } from '@/components/ui/input'
import { AggregateMetricCharts, ServerNetworkCard } from '@/features/metrics/components/MetricCharts'
import { useServers } from '@/features/servers/hooks/useServers'
import type { PeriodKey } from '@/lib/periods'
import { RecentAlertsList, RecentIncidentsList, ServerStatusList } from '../components/RecentLists'
import { ResourceCards } from '../components/ResourceCards'
import { useDashboardSummary } from '../hooks/useDashboard'

function NetworkServerPicker({ period }: { period: PeriodKey }) {
  const online = useServers({ connection: 'online', per_page: 100, sort: 'name' })
  const [chosen, setChosen] = useState<string>('')
  const servers = online.data?.data ?? []
  const selected = servers.find((s) => s.id === chosen)?.id ?? servers[0]?.id

  return (
    <ServerNetworkCard
      serverId={selected}
      period={period}
      actions={
        servers.length > 1 ? (
          <div className="w-44">
            <Select aria-label="Servidor do gráfico de rede" value={selected} onChange={(e) => setChosen(e.target.value)}>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        ) : undefined
      }
    />
  )
}

export function DashboardPage() {
  const qc = useQueryClient()
  const summary = useDashboardSummary()
  const [period, setPeriod] = useState<PeriodKey>('1h')
  const s = summary.data
  const loading = summary.isPending

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Estado atual da infraestrutura monitorada."
        actions={
          <>
            <LastUpdated
              updatedAt={summary.dataUpdatedAt}
              fetching={summary.isFetching}
              failed={summary.isError && !!s}
              onRefresh={() => void qc.invalidateQueries({ queryKey: ['dashboard'] })}
            />
            <PeriodSelect value={period} onChange={setPeriod} className="w-52" />
          </>
        }
      />

      {summary.isError && !s ? (
        <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
      ) : (
        <>
          <section aria-label="Indicadores" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Servidores" value={s?.servers.total} icon={Server} loading={loading} hint={s && s.servers.maintenance + s.servers.disabled > 0 ? `${s.servers.maintenance} em manutenção · ${s.servers.disabled} desativados` : undefined} />
            <StatCard label="Online" value={s?.servers.online} icon={Server} tone="success" loading={loading} />
            <StatCard label="Offline" value={s?.servers.offline} icon={ServerOff} tone={s && s.servers.offline > 0 ? 'danger' : 'neutral'} loading={loading} hint={s && s.servers.unknown > 0 ? `${s.servers.unknown} sem dados` : undefined} />
            <StatCard label="Com alertas ativos" value={s?.servers.with_active_alerts} icon={AlertTriangle} tone={s && s.servers.with_active_alerts > 0 ? 'warning' : 'neutral'} loading={loading} hint={s ? `${s.alerts.critical} críticos · ${s.alerts.warning} atenção` : undefined} />
            <StatCard label="Incidentes abertos" value={s?.incidents.open} icon={s && s.incidents.open > 0 ? ShieldAlert : ServerCrash} tone={s && s.incidents.open > 0 ? 'danger' : 'neutral'} loading={loading} />
          </section>

          <ResourceCards summary={s} loading={loading} />
        </>
      )}

      <section aria-label="Gráficos" className="space-y-3">
        <AggregateMetricCharts period={period} extra={<NetworkServerPicker period={period} />} />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <ServerStatusList />
        <RecentAlertsList />
        <RecentIncidentsList />
      </div>
    </>
  )
}
