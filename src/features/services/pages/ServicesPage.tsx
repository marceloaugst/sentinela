import { useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LastUpdated } from '@/components/data-display/LastUpdated'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Pagination } from '@/components/data-display/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { useServers } from '@/features/servers/hooks/useServers'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePage } from '@/hooks/usePage'
import type { ServiceStatus } from '@/types/api'
import { ServicesTable } from '../components/ServicesTable'
import { useServices } from '../hooks/useServices'

export function ServicesPage() {
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const q = useDebouncedValue(input)
  const [serverId, setServerId] = useState('')
  const [status, setStatus] = useState<ServiceStatus | ''>('')
  const [page, setPage] = usePage(`${q}|${serverId}|${status}`)


  const list = useServices({ page, per_page: 20, q: q || undefined, server_id: serverId || undefined, status: status || undefined })
  const servers = useServers({ per_page: 100, sort: 'name' })
  const serverNames = useMemo(() => new Map((servers.data?.data ?? []).map((s) => [s.id, s.name])), [servers.data])
  const filtered = !!(q || serverId || status)
  const rows = list.data?.data ?? []

  return (
    <>
      <PageHeader
        title="Serviços"
        description="Serviços descobertos automaticamente pelo agente em cada servidor."
        actions={
          <>
            <LastUpdated updatedAt={list.dataUpdatedAt} fetching={list.isFetching} failed={list.isError && !!list.data} onRefresh={() => void qc.invalidateQueries({ queryKey: ['services'] })} />
          </>
        }
      />
      <Card>
        <div className="grid gap-3 border-b p-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Buscar por nome…" aria-label="Buscar serviços" className="pl-8" />
          </div>
          <Select aria-label="Filtrar por servidor" value={serverId} onChange={(e) => setServerId(e.target.value)}>
            <option value="">Todos os servidores</option>
            {servers.data?.data.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value as ServiceStatus | '')}>
            <option value="">Todo estado</option>
            <option value="up">Saudável</option>
            <option value="degraded">Degradado</option>
            <option value="down">Indisponível</option>
            <option value="unknown">Desconhecido</option>
          </Select>
        </div>
        {list.isPending ? (
          <LoadingRows />
        ) : list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={filtered ? 'Nenhum serviço encontrado' : 'Nenhum serviço descoberto'}
            description={filtered ? 'Ajuste a busca ou os filtros.' : 'O agente descobre os serviços de cada servidor sozinho.'}
          />
        ) : (
          <>
            <ServicesTable services={rows} serverNames={serverNames} />
            <Pagination meta={list.data?.meta} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  )
}
