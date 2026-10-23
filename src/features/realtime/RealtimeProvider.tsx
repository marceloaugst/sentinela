import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createContext, use, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { API_BASE_URL } from '@/lib/api'
import type { BanEvent, StreamEnvelope, StreamEventType } from '@/types/api'

export type StreamState = 'connecting' | 'open' | 'reconnecting'

interface RealtimeValue {
  state: StreamState
  lastEventAt: number | null
}

const RealtimeContext = createContext<RealtimeValue>({ state: 'connecting', lastEventAt: null })

/** Evento SSE → chaves de cache a invalidar (o dado em si sempre vem da API REST). */
const INVALIDATIONS: Record<Exclude<StreamEventType, 'metrics.updated' | 'resync'>, string[]> = {
  'server.status_changed': ['servers', 'dashboard'],
  'alert.triggered': ['alerts', 'dashboard', 'incidents', 'servers', 'notifications'],
  'alert.acknowledged': ['alerts', 'dashboard', 'incidents'],
  'alert.resolved': ['alerts', 'dashboard', 'incidents', 'servers', 'notifications'],
  'incident.created': ['incidents', 'dashboard', 'alerts'],
  'incident.resolved': ['incidents', 'dashboard', 'alerts'],
  'service.status_changed': ['services', 'servers'],
  // O ban em si é avisado por toast abaixo; aqui só atualiza a lista e o painel de logs.
  'security.ip_banned': ['logs', 'notifications'],
}

/** Único evento cujo payload é lido: o aviso de ban é imediato, a lista de logs continua vindo da API. */
function notifyBan(e: Event) {
  try {
    const ev = JSON.parse((e as MessageEvent<string>).data) as StreamEnvelope<BanEvent>
    if (ev.data?.ip) toast.warning(`IP ${ev.data.ip} banido${ev.data.jail ? ` (${ev.data.jail})` : ''}`)
  } catch {
    /* payload inesperado: a invalidação do cache já cobre a atualização */
  }
}

const TYPES = Object.keys(INVALIDATIONS) as (keyof typeof INVALIDATIONS)[]
const RECONNECT_MS = 5_000

/**
 * Mantém uma conexão SSE (`GET /events`) e traduz eventos em invalidação de cache do TanStack Query.
 * `EventSource` reconecta sozinho e reenvia Last-Event-ID; se o navegador desistir (readyState CLOSED,
 * ex.: 503 por limite de conexões), recriamos a conexão após um intervalo.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<StreamState>('connecting')
  const [lastEventAt, setLastEventAt] = useState<number | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (typeof EventSource === 'undefined') return
    let es: EventSource | null = null
    let disposed = false

    const invalidate = (keys: string[]) => keys.forEach((k) => void queryClient.invalidateQueries({ queryKey: [k] }))

    const connect = () => {
      setState('connecting')
      es = new EventSource(`${API_BASE_URL}/events?types=${TYPES.join(',')}`, { withCredentials: true })
      es.onopen = () => setState('open')
      es.onerror = () => {
        setState('reconnecting')
        if (es?.readyState === EventSource.CLOSED && !disposed) {
          es.close()
          timer.current = window.setTimeout(connect, RECONNECT_MS)
        }
      }
      for (const type of TYPES) {
        // O payload é ignorado de propósito: a fonte da verdade é a API REST.
        es.addEventListener(type, (e) => {
          setLastEventAt(Date.now())
          invalidate(INVALIDATIONS[type])
          if (type === 'security.ip_banned') notifyBan(e)
        })
      }
      // O servidor pede para recarregar tudo quando o histórico se perdeu.
      es.addEventListener('resync', () => void queryClient.invalidateQueries())
    }

    connect()
    return () => {
      disposed = true
      window.clearTimeout(timer.current)
      es?.close()
    }
  }, [queryClient])

  const value = useMemo(() => ({ state, lastEventAt }), [state, lastEventAt])
  return <RealtimeContext value={value}>{children}</RealtimeContext>
}

export function useRealtime() {
  return use(RealtimeContext)
}
