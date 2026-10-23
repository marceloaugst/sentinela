import { Bell, CheckCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PriorityBadge } from '@/components/data-display/status'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/AuthProvider'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/features/notifications/hooks/useNotifications'
import { notificationLink } from '@/features/notifications/links'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/types/api'

export function NotificationsMenu() {
  const { can } = useAuth()
  const canMark = can('operator')
  const navigate = useNavigate()
  const list = useNotifications({ per_page: 6 })
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const count = list.data?.meta.unread ?? 0

  const open = (n: AppNotification) => {
    if (canMark && !n.read_at) markRead.mutate(n.id)
    navigate(notificationLink(n))
  }

  return (
    // Abrir o sino marca tudo como lido (a lista já carregada continua exibida até fechar).
    <DropdownMenu onOpenChange={(o) => o && canMark && count > 0 && markAll.mutate({ silent: true })}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={count ? `Notificações: ${count} não lidas` : 'Notificações'}>
          <Bell />
          {count > 0 && (
            <span className="tabular absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          Notificações
          {canMark && count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              disabled={markAll.isPending}
              onClick={(e) => {
                e.preventDefault()
                markAll.mutate()
              }}
            >
              <CheckCheck /> Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list.isPending ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">Carregando…</p>
        ) : list.isError && !list.data ? (
          <p className="px-2 py-3 text-xs text-danger">Não foi possível carregar as notificações.</p>
        ) : list.data!.data.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">Nenhuma notificação.</p>
        ) : (
          list.data!.data.map((n) => (
            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1" onSelect={() => open(n)}>
              <span className="flex w-full items-center gap-2">
                <PriorityBadge priority={n.priority} />
                <span className="truncate text-xs text-muted-foreground">{n.server_name ?? '—'}</span>
                <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  {formatRelative(n.created_at)}
                  {!n.read_at && <span className="size-2 rounded-full bg-primary" aria-label="Não lida" />}
                </span>
              </span>
              <span className={cn('line-clamp-1 text-xs', !n.read_at && 'font-semibold')}>{n.title}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/notifications" className="justify-center text-xs text-primary">
            Ver todas as notificações
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
