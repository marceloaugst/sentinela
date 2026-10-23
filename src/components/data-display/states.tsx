import { CloudOff, Inbox, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage } from '@/app/queryClient'
import { isApiError } from '@/lib/api'
import { cn } from '@/lib/utils'

export function EmptyState({ title, description, icon, action, className }: { title: string; description?: string; icon?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-4 py-10 text-center', className)}>
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon ?? <Inbox className="size-5" />}</div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-xs text-muted-foreground">{description}</p>}
      {action}
    </div>
  )
}

/** Falha de comunicação ≠ ausência de dados: este componente é só para erro. */
export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const network = isApiError(error) && error.isNetwork
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center gap-2 px-4 py-10 text-center', className)}>
      <div className="flex size-10 items-center justify-center rounded-full bg-danger/15 text-danger">
        <CloudOff className="size-5" />
      </div>
      <p className="text-sm font-medium">{network ? 'API indisponível' : 'Não foi possível carregar os dados'}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{errorMessage(error)}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw /> Tentar novamente
        </Button>
      )}
    </div>
  )
}

export function LoadingRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2 p-4', className)} role="status" aria-label="Carregando">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}
