import { useQueryClient } from '@tanstack/react-query'
import { Info, Play, RotateCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/data-display/ConfirmDialog'
import { LastUpdated } from '@/components/data-display/LastUpdated'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDockerAction, useServerCommands, useServerDocker, useServiceCommand } from '@/features/servers/hooks/useServers'
import { formatDateTime, formatRelative } from '@/lib/format'
import type { ContainerState, DockerAction, DockerContainer, DockerStatus, ServiceCommand } from '@/types/api'

type Variant = 'success' | 'warning' | 'danger' | 'neutral'

const STATE: Record<ContainerState, { label: string; variant: Variant }> = {
  running: { label: 'Ativo', variant: 'success' },
  restarting: { label: 'Reiniciando', variant: 'warning' },
  exited: { label: 'Parado', variant: 'danger' },
  dead: { label: 'Parado', variant: 'danger' },
  created: { label: 'Nunca iniciado', variant: 'neutral' },
  paused: { label: 'Pausado', variant: 'warning' },
  removing: { label: 'Removendo', variant: 'warning' },
}

const ACTION_LABEL: Record<DockerAction, string> = { start: 'Iniciar', restart: 'Reiniciar' }
const ACTION_DONE: Record<DockerAction, string> = { start: 'iniciado', restart: 'reiniciado' }

/** Mensagens para quando o servidor não tem Docker utilizável. `message` complementa. */
export const DOCKER_UNAVAILABLE: Record<Exclude<DockerStatus, 'ok'>, string> = {
  not_installed: 'Docker não encontrado neste servidor.',
  no_access: 'Docker instalado, mas o agente não tem acesso.',
  unavailable: 'Docker instalado, mas parado.',
  unknown: 'Aguardando o agente…',
}

function isActive(c: ServiceCommand | undefined) {
  return !!c && (c.status === 'pending' || c.status === 'running')
}

interface RowProps {
  container: DockerContainer
  canAct: boolean
  commandId: string | undefined
  requesting: boolean
  onAsk: (c: DockerContainer, a: DockerAction) => void
  onFinished: (c: DockerContainer, cmd: ServiceCommand) => void
}

function ContainerCard({ container: c, canAct, commandId, requesting, onAsk, onFinished }: RowProps) {
  const st = STATE[c.state] ?? { label: c.state, variant: 'neutral' as Variant }
  const command = useServiceCommand(commandId)
  const cmd = command.data
  const busy = requesting || isActive(cmd) || (!!commandId && !cmd && !command.isError)

  // Avisa o pai uma única vez por comando terminado.
  const notified = useRef<string | null>(null)
  useEffect(() => {
    if (cmd && !isActive(cmd) && notified.current !== cmd.id) {
      notified.current = cmd.id
      onFinished(c, cmd)
    }
  }, [cmd, c, onFinished])

  const stopped = c.state === 'exited' || c.state === 'dead' || c.state === 'created'
  const hasProblem = stopped || !!c.error || c.oom_killed
  const [infoOpen, setInfoOpen] = useState(false)
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{c.name}</p>
          <p className="truncate text-xs text-muted-foreground" title={c.image}>
            {c.image}
          </p>
        </div>
        <Badge variant={st.variant}>{st.label}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {c.status}
        {stopped && c.finished_at && (
          <span title={formatDateTime(c.finished_at)}> · parou {formatRelative(c.finished_at)}</span>
        )}
      </p>

      {busy ? (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          {cmd?.status === 'running' ? 'Executando…' : 'Aguardando o agente…'}
        </p>
      ) : cmd?.status === 'failed' ? (
        <p role="status" className="mt-3 text-sm text-danger">
          {cmd.message || 'O comando falhou.'}
        </p>
      ) : cmd?.status === 'expired' ? (
        <p role="status" className="mt-3 text-sm text-warning">
          Agente não respondeu.
        </p>
      ) : null}

      {((canAct && c.actions.length > 0) || hasProblem) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hasProblem && (
            <Button size="sm" variant="outline" onClick={() => setInfoOpen(true)}>
              <Info /> Info
            </Button>
          )}
          {canAct && c.actions.map((a) => (
            <Button key={a} size="sm" variant="outline" disabled={busy} onClick={() => onAsk(c, a)}>
              {a === 'start' ? <Play /> : <RotateCw />} {ACTION_LABEL[a]}
            </Button>
          ))}
        </div>
      )}

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{c.name}</DialogTitle>
            <DialogDescription>
              {st.label} · {c.image}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">{c.error || 'Sem detalhes do erro informados pelo Docker.'}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Status</dt>
                <dd>{c.status}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Código de saída</dt>
                <dd>{c.exit_code ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Parou em</dt>
                <dd>{c.finished_at ? `${formatDateTime(c.finished_at)} (${formatRelative(c.finished_at)})` : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Falta de memória (OOM)</dt>
                <dd className={c.oom_killed ? 'text-danger' : undefined}>{c.oom_killed ? 'Sim' : 'Não'}</dd>
              </div>
            </dl>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Fim do log</p>
              {c.log_tail ? (
                <pre className="max-h-64 overflow-auto rounded-md bg-muted p-2 text-xs whitespace-pre-wrap break-all">{c.log_tail}</pre>
              ) : (
                <p className="text-sm text-muted-foreground">Sem log disponível.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function DockerTab({ serverId }: { serverId: string }) {
  const qc = useQueryClient()
  const { can } = useAuth()
  const canAct = can('operator')
  const q = useServerDocker(serverId)
  const history = useServerCommands(serverId)
  const act = useDockerAction(serverId)
  const [tracked, setTracked] = useState<Record<string, string>>({})
  const [confirm, setConfirm] = useState<{ container: DockerContainer; action: DockerAction } | null>(null)
  const [requestingId, setRequestingId] = useState<string | null>(null)

  // Comandos já em andamento (ex.: pedidos antes de abrir a aba), por container.
  const inProgress: Record<string, string> = {}
  for (const cmd of history.data ?? []) {
    if (cmd.target && isActive(cmd) && !inProgress[cmd.target]) inProgress[cmd.target] = cmd.id
  }

  function submit(c: DockerContainer, action: DockerAction) {
    setRequestingId(c.id)
    act.mutate(
      { containerId: c.id, action },
      {
        onSuccess: (cmd) => setTracked((t) => ({ ...t, [c.id]: cmd.id })),
        onSettled: () => setRequestingId(null),
      },
    )
  }

  function ask(c: DockerContainer, action: DockerAction) {
    if (action === 'restart') setConfirm({ container: c, action })
    else submit(c, action)
  }

  function finished(c: DockerContainer, cmd: ServiceCommand) {
    if (cmd.status === 'succeeded') toast.success(`Container ${c.name} ${ACTION_DONE[cmd.action === 'start' ? 'start' : 'restart']}.`)
    else if (cmd.status === 'failed') toast.error(cmd.message || `Falha ao executar a ação em ${c.name}.`)
    else toast.warning('Agente não respondeu.')
    void qc.invalidateQueries({ queryKey: ['servers', serverId, 'docker'] })
    void qc.invalidateQueries({ queryKey: ['servers', serverId, 'commands'] })
  }

  const d = q.data
  const summary = d?.status === 'ok' ? d.summary : null

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Containers Docker</CardTitle>
          {summary && (
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.total} no total · {summary.running} ativos · {summary.stopped} parados
              {summary.other > 0 && ` · ${summary.other} outros`}
            </p>
          )}
        </div>
        <LastUpdated updatedAt={q.dataUpdatedAt} fetching={q.isFetching} failed={q.isError && !!d} onRefresh={() => void q.refetch()} />
      </CardHeader>
      {q.isPending ? (
        <LoadingRows rows={3} />
      ) : q.isError && !d ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !d ? null : d.status !== 'ok' ? (
        <EmptyState title={DOCKER_UNAVAILABLE[d.status]} description={d.status === 'not_installed' || d.status === 'unknown' ? undefined : d.message || undefined} />
      ) : d.containers.length === 0 ? (
        <EmptyState title="Nenhum container neste servidor" />
      ) : (
        <div className="grid gap-3 p-4 pt-0 sm:grid-cols-2 xl:grid-cols-3">
          {d.containers.map((c) => (
            <ContainerCard
              key={c.id}
              container={c}
              canAct={canAct}
              commandId={tracked[c.id] ?? inProgress[c.id]}
              requesting={requestingId === c.id}
              onAsk={ask}
              onFinished={finished}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Reiniciar ${confirm?.container.name ?? 'container'}?`}
        description="O container será reiniciado e ficará indisponível por alguns instantes."
        confirmLabel="Reiniciar"
        onConfirm={() => {
          if (confirm) submit(confirm.container, confirm.action)
          setConfirm(null)
        }}
      />
    </Card>
  )
}
