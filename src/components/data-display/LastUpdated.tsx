import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatClock } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  updatedAt: number
  fetching: boolean
  onRefresh: () => void
  failed?: boolean
}

/** Mostra a hora da última atualização bem-sucedida e permite atualizar manualmente. */
export function LastUpdated({ updatedAt, fetching, onRefresh, failed }: Props) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="tabular" aria-live="polite">
        {updatedAt ? `Atualizado às ${formatClock(updatedAt)}${failed ? ' (última tentativa falhou)' : ''}` : 'Sem dados ainda'}
      </span>
      <Button size="icon" variant="ghost" className="size-7" onClick={onRefresh} aria-label="Atualizar agora" disabled={fetching}>
        <RefreshCw className={cn('size-3.5', fetching && 'animate-spin')} />
      </Button>
    </div>
  )
}
