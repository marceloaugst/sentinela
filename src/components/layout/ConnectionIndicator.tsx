import { useQuery } from '@tanstack/react-query'
import { useRealtime } from '@/features/realtime/RealtimeProvider'
import { settingsService } from '@/features/settings/services/settingsService'
import { cn } from '@/lib/utils'

type Level = 'ok' | 'degraded' | 'down'

const STYLE: Record<Level, string> = {
  ok: 'bg-success',
  degraded: 'bg-warning',
  down: 'bg-danger',
}

/**
 * Estado da conexão com a API: `/healthz` (a API responde?) + SSE (tempo real ativo?).
 * "Atualização manual" quando o tempo real caiu mas a API continua respondendo.
 */
export function ConnectionIndicator() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => settingsService.health(signal),
    refetchInterval: 30_000,
    retry: false,
  })
  const { state } = useRealtime()

  let level: Level
  let label: string
  if (health.isError) {
    level = 'down'
    label = 'API indisponível'
  } else if (health.isPending) {
    level = 'degraded'
    label = 'Conectando…'
  } else if (state !== 'open') {
    level = 'degraded'
    label = state === 'connecting' ? 'Conectando ao tempo real…' : 'Tempo real reconectando'
  } else {
    level = 'ok'
    label = 'Conectado'
  }

  return (
    <div className="flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs" role="status" aria-live="polite" title={health.data ? `API ${health.data.version}` : undefined}>
      <span className="relative flex size-2">
        {level !== 'ok' && <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', STYLE[level])} />}
        <span className={cn('relative inline-flex size-2 rounded-full', STYLE[level])} />
      </span>
      <span className="hidden text-muted-foreground sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </div>
  )
}
