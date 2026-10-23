import { useQueryClient } from '@tanstack/react-query'
import { CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LastUpdated } from '@/components/data-display/LastUpdated'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Pagination } from '@/components/data-display/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { PRIORITY_LABEL, PriorityBadge } from '@/components/data-display/status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/features/auth/AuthProvider'
import { useServers } from '@/features/servers/hooks/useServers'
import { usePage } from '@/hooks/usePage'
import { useTimeWindow, WINDOWS, type WindowKey } from '@/hooks/useTimeWindow'
import { formatDateTime, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { NotificationKind, Priority } from '@/types/api'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../hooks/useNotifications'
import { KIND_LABEL, notificationLink } from '../links'

export function NotificationsPage() {
  const qc = useQueryClient()
  const { can } = useAuth()
  const canMark = can('operator')
  const [kind, setKind] = useState<NotificationKind | ''>('')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [serverId, setServerId] = useState('')
  const [unread, setUnread] = useState(false)
  const { window, from, setWindow } = useTimeWindow()
  const [page, setPage] = usePage(`${kind}|${priority}|${serverId}|${unread}|${window}`)

  const servers = useServers({ per_page: 100, sort: 'name' })
  const list = useNotifications({ page, per_page: 20, kind: kind || undefined, priority: priority || undefined, server_id: serverId || undefined, unread: unread || undefined, from })
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const rows = list.data?.data ?? []
  const unreadTotal = list.data?.meta.unread ?? 0
  const filtered = !!(kind || priority || serverId || unread || window !== 'all')

  return (
    <>
      <PageHeader
        title="Notificações"
        description="Histórico de todo aviso gerado: alertas disparados, recuperações e IPs banidos. A marcação como lida é compartilhada por todos os usuários."
        actions={
          <>
            {canMark && (
              <Button variant="outline" size="sm" disabled={unreadTotal === 0 || markAll.isPending} onClick={() => markAll.mutate()}>
                <CheckCheck /> Marcar todas como lidas
              </Button>
            )}
            <LastUpdated updatedAt={list.dataUpdatedAt} fetching={list.isFetching} failed={list.isError && !!list.data} onRefresh={() => void qc.invalidateQueries({ queryKey: ['notifications'] })} />
          </>
        }
      />
      <Card>
        <div className="grid gap-3 border-b p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Select aria-label="Filtrar por tipo" value={kind} onChange={(e) => setKind(e.target.value as NotificationKind | '')}>
            <option value="">Todo tipo</option>
            {(Object.keys(KIND_LABEL) as NotificationKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </Select>
          <Select aria-label="Filtrar por prioridade" value={priority} onChange={(e) => setPriority(e.target.value ? (Number(e.target.value) as Priority) : '')}>
            <option value="">Toda prioridade</option>
            {([1, 2, 3, 4] as const).map((n) => (
              <option key={n} value={n}>
                {PRIORITY_LABEL[n]}
              </option>
            ))}
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
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={unread} onChange={(e) => setUnread(e.target.checked)} /> Somente não lidas
            {unreadTotal > 0 && <Badge variant="danger">{unreadTotal}</Badge>}
          </label>
        </div>
        {list.isPending ? (
          <LoadingRows />
        ) : list.isError && !list.data ? (
          <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title="Nenhuma notificação encontrada" description={filtered ? 'Ajuste os filtros.' : 'Nada foi notificado até agora.'} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Notificação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Servidor</TableHead>
                  <TableHead>Quando</TableHead>
                  {canMark && <TableHead className="w-28" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <PriorityBadge priority={n.priority} />
                    </TableCell>
                    <TableCell className="max-w-96">
                      <Link to={notificationLink(n)} className="block hover:text-primary" onClick={() => canMark && !n.read_at && markRead.mutate(n.id)}>
                        <span className={cn('flex items-center gap-2 truncate', !n.read_at && 'font-semibold')}>
                          {!n.read_at && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Não lida" />}
                          {n.title}
                        </span>
                        <span className="block truncate text-xs font-normal text-muted-foreground">{n.message}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{KIND_LABEL[n.kind]}</TableCell>
                    <TableCell>
                      {n.server_id ? (
                        <Link to={`/servers/${n.server_id}`} className="hover:text-primary hover:underline">
                          {n.server_name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground" title={formatDateTime(n.created_at)}>
                      {formatRelative(n.created_at)}
                    </TableCell>
                    {canMark && (
                      <TableCell>
                        {!n.read_at && (
                          <Button variant="ghost" size="sm" disabled={markRead.isPending} onClick={() => markRead.mutate(n.id)}>
                            Marcar lida
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination meta={list.data?.meta} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  )
}
