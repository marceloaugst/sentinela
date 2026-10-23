import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { LastUpdated } from '@/components/data-display/LastUpdated'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { useServerDiscovery } from '@/features/servers/hooks/useServers'
import { formatDateTime, formatRelative } from '@/lib/format'
import type { DiscoveryItem, DiscoveryStatus } from '@/types/api'

const STATUS: Record<DiscoveryStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  available: { label: 'Em execução', variant: 'success' },
  stopped: { label: 'Parado ou desativado', variant: 'warning' },
  not_found: { label: 'Não encontrado', variant: 'danger' },
}

const SOURCE: Record<string, string> = { systemd: 'systemd', process: 'processo', docker: 'via Docker' }

function CopyAction({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto manualmente.')
    }
  }
  return (
    <Button size="sm" variant="outline" onClick={() => void copy()}>
      {copied ? <Check /> : <Copy />} {copied ? 'Copiado' : 'Copiar'}
    </Button>
  )
}

function DiscoveryCard({ item }: { item: DiscoveryItem }) {
  const st = STATUS[item.status]
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{item.name}</p>
          <p className="truncate text-xs text-muted-foreground">{item.unit || '—'}</p>
        </div>
        <Badge variant={st.variant}>{st.label}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {item.source && <Badge variant="outline">{SOURCE[item.source] ?? item.source}</Badge>}
        {item.status_changed_at && <span title={formatDateTime(item.status_changed_at)}>mudou {formatRelative(item.status_changed_at)}</span>}
      </div>
      {item.action && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium">O que fazer</p>
            <CopyAction text={item.action} />
          </div>
          <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs whitespace-pre-wrap break-all">
            <code>{item.action}</code>
          </pre>
        </div>
      )}
    </div>
  )
}

/** Panorama dos serviços descobertos pelo agente num servidor (somente leitura). */
export function DiscoveryPanel({ serverId }: { serverId: string }) {
  const q = useServerDiscovery(serverId)
  const d = q.data

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Serviços descobertos</CardTitle>
          {d && d.checked_at && (
            <p className="mt-1 text-sm text-muted-foreground">
              {d.summary.available} disponíveis · {d.summary.unavailable} indisponíveis
            </p>
          )}
        </div>
        <LastUpdated updatedAt={q.dataUpdatedAt} fetching={q.isFetching} failed={q.isError && !!d} onRefresh={() => void q.refetch()} />
      </CardHeader>
      {q.isPending ? (
        <LoadingRows rows={3} />
      ) : q.isError && !d ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !d || d.services.length === 0 || d.checked_at === null ? (
        <EmptyState title="Aguardando o agente…" description="O agente ainda não reportou os serviços deste servidor." />
      ) : (
        <div className="grid gap-3 p-4 pt-0 sm:grid-cols-2 xl:grid-cols-3">
          {d.services.map((item) => (
            <DiscoveryCard key={item.key} item={item} />
          ))}
        </div>
      )}
    </Card>
  )
}
