import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { LastUpdated } from '@/components/data-display/LastUpdated'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Pagination } from '@/components/data-display/Pagination'
import { PRIORITY_LABEL } from '@/components/data-display/status'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { useServers } from '@/features/servers/hooks/useServers'
import { usePage } from '@/hooks/usePage'
import { useTimeWindow, WINDOWS, type WindowKey } from '@/hooks/useTimeWindow'
import type { Alert, AlertStatusFilter, Priority, Severity } from '@/types/api'
import { AlertDetailDialog } from '../components/AlertDetailDialog'
import { AlertsTable } from '../components/AlertsTable'
import { useAlerts } from '../hooks/useAlerts'

export function AlertsPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState<AlertStatusFilter | ''>('active')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [severity, setSeverity] = useState<Severity | ''>('')
  const [serverId, setServerId] = useState('')
  const { window, from, setWindow } = useTimeWindow()
  const [page, setPage] = usePage(`${status}|${priority}|${severity}|${serverId}|${window}`)
  const [selected, setSelected] = useState<Alert | null>(null)

  const servers = useServers({ per_page: 100, sort: 'name' })
  const list = useAlerts({ page, per_page: 20, status: status || undefined, priority: priority || undefined, severity: severity || undefined, server_id: serverId || undefined, from })
  const rows = list.data?.data ?? []
  // Mantém o diálogo sincronizado com a lista após reconhecer/resolver.
  const current = selected ? (rows.find((a) => a.id === selected.id) ?? selected) : null
  const filtered = !!(status !== 'active' || priority || severity || serverId || window !== 'all')

  return (
    <>
      <PageHeader
        title="Alertas"
        description="Reconhecer um alerta não o resolve: ele permanece ativo até a condição normalizar ou ser resolvido."
        actions={<LastUpdated updatedAt={list.dataUpdatedAt} fetching={list.isFetching} failed={list.isError && !!list.data} onRefresh={() => void qc.invalidateQueries({ queryKey: ['alerts'] })} />}
      />
      <Card>
        <div className="grid gap-3 border-b p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Select aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value as AlertStatusFilter | '')}>
            <option value="active">Ativos (disparados + reconhecidos)</option>
            <option value="firing">Disparados</option>
            <option value="acknowledged">Reconhecidos</option>
            <option value="resolved">Resolvidos</option>
            <option value="">Todos</option>
          </Select>
          <Select aria-label="Filtrar por prioridade" value={priority} onChange={(e) => setPriority(e.target.value ? (Number(e.target.value) as Priority) : '')}>
            <option value="">Toda prioridade</option>
            {([1, 2, 3, 4] as const).map((n) => (
              <option key={n} value={n}>
                {PRIORITY_LABEL[n]}
              </option>
            ))}
          </Select>
          <Select aria-label="Filtrar por severidade" value={severity} onChange={(e) => setSeverity(e.target.value as Severity | '')}>
            <option value="">Toda severidade</option>
            <option value="critical">Crítico</option>
            <option value="warning">Atenção</option>
            <option value="info">Info</option>
          </Select>
          <Select aria-label="Filtrar por servidor" value={serverId} onChange={(e) => setServerId(e.target.value)}>
            <option value="">Todos os servidores</option>
            {servers.data?.data.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select aria-label="Filtrar por período" value={window} onChange={(e) => setWindow(e.target.value as WindowKey)}>
            {WINDOWS.map((w) => (
              <option key={w.key} value={w.key}>
                {w.label}
              </option>
            ))}
          </Select>
        </div>
        {list.isPending ? (
          <LoadingRows />
        ) : list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title={filtered ? 'Nenhum alerta encontrado' : 'Nenhum alerta ativo'} description={filtered ? 'Ajuste os filtros.' : 'A comunicação com a API está funcionando; não há alertas ativos no momento.'} />
        ) : (
          <>
            <AlertsTable alerts={rows} onSelect={setSelected} />
            <Pagination meta={list.data?.meta} onPage={setPage} />
          </>
        )}
      </Card>
      <AlertDetailDialog alert={current} onClose={() => setSelected(null)} />
    </>
  )
}
