import { useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AdminStatusBadge, ConnectionBadge } from '@/components/data-display/status'
import { ConfirmDialog } from '@/components/data-display/ConfirmDialog'
import { LastUpdated } from '@/components/data-display/LastUpdated'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Pagination } from '@/components/data-display/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input, Select } from '@/components/ui/input'
import { UsageBar } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePage } from '@/hooks/usePage'
import { formatPercent, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AdminStatus, ConnectionStatus, Server, ServerSummary } from '@/types/api'
import { ServerFormDialog } from '../components/ServerFormDialog'
import { useDeleteServer, useServers, useServerSummaries } from '../hooks/useServers'
import type { ServerListParams } from '../services/serversService'

type SortKey = NonNullable<ServerListParams['sort']>

function SortHead({ label, field, sort, order, onSort }: { label: string; field: SortKey; sort: SortKey; order: 'asc' | 'desc'; onSort: (f: SortKey) => void }) {
  const active = sort === field
  const Icon = !active ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className={cn('inline-flex items-center gap-1 hover:text-foreground', active && 'text-foreground')} onClick={() => onSort(field)}>
        {label}
        <Icon className="size-3" aria-hidden />
      </button>
    </TableHead>
  )
}

function Gauge({ percent, stale }: { percent: number | null | undefined; stale: boolean }) {
  if (percent == null) return <span className="text-muted-foreground">—</span>
  return (
    <div className={cn('w-20 space-y-1', stale && 'opacity-60')}>
      <span className="tabular text-xs font-medium">{formatPercent(percent)}</span>
      <UsageBar percent={percent} />
    </div>
  )
}

function worstDisk(summary: ServerSummary | undefined) {
  const disks = summary?.disks ?? []
  return disks.length ? Math.max(...disks.map((d) => d.used_percent)) : null
}

/** A busca do cabeçalho (?q=) remonta a tela com o novo termo inicial. */
export function ServersPage() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  return <ServersView key={q} initialQuery={q} />
}

function ServersView({ initialQuery }: { initialQuery: string }) {
  const { can } = useAuth()
  const isAdmin = can('admin')
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [input, setInput] = useState(initialQuery)
  const debounced = useDebouncedValue(input)
  const [status, setStatus] = useState<AdminStatus | ''>('')
  const [connection, setConnection] = useState<ConnectionStatus | ''>('')
  const [sort, setSort] = useState<SortKey>('name')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = usePage(`${debounced}|${status}|${connection}|${sort}|${order}`)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Server | undefined>()
  const [removing, setRemoving] = useState<Server | null>(null)
  const del = useDeleteServer()

  const params: ServerListParams = { page, per_page: 10, q: debounced || undefined, status: status || undefined, connection: connection || undefined, sort, order }
  const list = useServers(params)
  const servers = list.data?.data ?? []
  const summaries = useServerSummaries(servers)

  const toggleSort = (field: SortKey) => {
    if (field === sort) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else {
      setSort(field)
      setOrder('asc')
    }
  }
  const filtered = !!(debounced || status || connection)

  return (
    <>
      <PageHeader
        title="Servidores"
        description="Servidores monitorados e seu estado de conexão."
        actions={
          <>
            <LastUpdated updatedAt={list.dataUpdatedAt} fetching={list.isFetching} failed={list.isError && !!list.data} onRefresh={() => void qc.invalidateQueries({ queryKey: ['servers'] })} />
            {isAdmin && (
              <Button
                onClick={() => {
                  setEditing(undefined)
                  setFormOpen(true)
                }}
              >
                <Plus /> Cadastrar servidor
              </Button>
            )}
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Buscar por nome ou hostname…" aria-label="Buscar servidores" className="pl-8" />
          </div>
          <Select aria-label="Filtrar por conexão" value={connection} onChange={(e) => setConnection(e.target.value as ConnectionStatus | '')} className="sm:w-44">
            <option value="">Toda conexão</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="unknown">Sem dados</option>
          </Select>
          <Select aria-label="Filtrar por estado administrativo" value={status} onChange={(e) => setStatus(e.target.value as AdminStatus | '')} className="sm:w-48">
            <option value="">Todo estado</option>
            <option value="active">Ativo</option>
            <option value="maintenance">Em manutenção</option>
            <option value="disabled">Desativado</option>
          </Select>
        </div>

        {list.isPending ? (
          <LoadingRows />
        ) : list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : servers.length === 0 ? (
          <EmptyState
            title={filtered ? 'Nenhum servidor encontrado' : 'Nenhum servidor cadastrado'}
            description={filtered ? 'Ajuste a busca ou os filtros.' : isAdmin ? 'Cadastre o primeiro servidor para começar a monitorar.' : 'Peça a um administrador para cadastrar servidores.'}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortHead label="Servidor" field="name" sort={sort} order={order} onSort={toggleSort} />
                  <SortHead label="Hostname" field="hostname" sort={sort} order={order} onSort={toggleSort} />
                  <TableHead className="hidden 2xl:table-cell">Sistema</TableHead>
                  <SortHead label="Estado" field="status" sort={sort} order={order} onSort={toggleSort} />
                  <TableHead>CPU</TableHead>
                  <TableHead>Memória</TableHead>
                  <TableHead title="Volume mais ocupado">Armazenamento</TableHead>
                  <SortHead label="Última comunicação" field="last_seen_at" sort={sort} order={order} onSort={toggleSort} />
                  <TableHead className="w-10">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servers.map((s) => {
                  const sm = summaries[s.id]
                  const latest = sm?.data?.latest
                  const loading = sm?.isLoading && s.connection_status !== 'unknown'
                  const stale = s.connection_status !== 'online'
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <Link to={`/servers/${s.id}`} className="hover:text-primary hover:underline">
                          {s.name}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{s.hostname}</TableCell>
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground 2xl:table-cell">{[s.operating_system, s.operating_system_version].filter(Boolean).join(' ') || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <ConnectionBadge status={s.connection_status} />
                          {s.status !== 'active' && <AdminStatusBadge status={s.status} />}
                        </div>
                      </TableCell>
                      <TableCell>{loading ? <Skeleton className="h-6 w-20" /> : <Gauge percent={latest?.cpu_usage_percent} stale={stale} />}</TableCell>
                      <TableCell>{loading ? <Skeleton className="h-6 w-20" /> : <Gauge percent={latest?.memory.used_percent} stale={stale} />}</TableCell>
                      <TableCell>{loading ? <Skeleton className="h-6 w-20" /> : <Gauge percent={worstDisk(sm?.data)} stale={stale} />}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatRelative(s.last_seen_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`Ações de ${s.name}`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => navigate(`/servers/${s.id}`)}>
                              <Eye /> Ver detalhes
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setEditing(s)
                                    setFormOpen(true)
                                  }}
                                >
                                  <Pencil /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-danger" onSelect={() => setRemoving(s)}>
                                  <Trash2 /> Remover
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Pagination meta={list.data?.meta} onPage={setPage} />
          </>
        )}
      </Card>

      <ServerFormDialog open={formOpen} onOpenChange={setFormOpen} server={editing} onCreated={(s) => navigate(`/servers/${s.id}?tab=agent`)} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remover servidor"
        destructive
        confirmLabel="Remover"
        pending={del.isPending}
        description={
          <>
            Remover <strong>{removing?.name}</strong>? As credenciais do agente serão revogadas. O histórico de métricas, alertas e incidentes é preservado.
          </>
        }
        onConfirm={() => removing && del.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
      />
    </>
  )
}
