import { useQueryClient } from '@tanstack/react-query'
import { Power, Search, Skull } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/data-display/ConfirmDialog'
import { LastUpdated } from '@/components/data-display/LastUpdated'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip } from '@/components/ui/tooltip'
import { useAuth } from '@/features/auth/AuthProvider'
import { useProcessAction, useServerCommands, useServerProcesses, useServiceCommand } from '@/features/servers/hooks/useServers'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatBytes, formatNumber, formatPercent, formatRelative } from '@/lib/format'
import type { ProcessAction, ProcessSort, ServerProcess, ServiceCommand } from '@/types/api'

const SORTS: { value: ProcessSort; label: string }[] = [
  { value: 'cpu', label: 'Maior uso de CPU' },
  { value: 'memory', label: 'Maior uso de memória' },
  { value: 'name', label: 'Nome' },
  { value: 'pid', label: 'PID' },
]

const LIMITS = [50, 100, 200, 500]

const STATE_LABEL: Record<string, string> = {
  R: 'Executando',
  S: 'Dormindo',
  D: 'Em E/S',
  T: 'Parado',
  Z: 'Zumbi',
}

const ACTION_DONE: Record<ProcessAction, string> = { terminate: 'encerrado', kill: 'finalizado à força' }

const key = (p: ServerProcess) => `${p.pid}:${p.start_time}`

function isActive(c: ServiceCommand | undefined) {
  return !!c && (c.status === 'pending' || c.status === 'running')
}

/** O SIGTERM foi enviado mas o processo ignorou: vale oferecer SIGKILL. */
function stillAlive(c: ServiceCommand | undefined) {
  return c?.status === 'failed' && /continua ativo/i.test(c.message)
}

interface RowProps {
  process: ServerProcess
  canAct: boolean
  cpus: number
  commandId: string | undefined
  requesting: boolean
  onAsk: (p: ServerProcess, a: ProcessAction) => void
  onFinished: (p: ServerProcess, cmd: ServiceCommand) => void
}

function ProcessRow({ process: p, canAct, cpus, commandId, requesting, onAsk, onFinished }: RowProps) {
  const command = useServiceCommand(commandId)
  const cmd = command.data
  const busy = requesting || isActive(cmd) || (!!commandId && !cmd && !command.isError)

  // Avisa o pai uma única vez por comando terminado.
  const notified = useRef<string | null>(null)
  useEffect(() => {
    if (cmd && !isActive(cmd) && notified.current !== cmd.id) {
      notified.current = cmd.id
      onFinished(p, cmd)
    }
  }, [cmd, p, onFinished])

  const allowed = p.actions.includes('terminate')
  const force = stillAlive(cmd) && p.actions.includes('kill')

  return (
    <TableRow>
      <TableCell className="max-w-80">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{p.name}</span>
          {p.service_name && <Badge variant="outline">{p.service_name}</Badge>}
          {p.state === 'Z' && <Badge variant="warning">Zumbi</Badge>}
        </div>
        <p className="truncate text-xs text-muted-foreground" title={p.cmdline}>
          {p.cmdline || '—'}
        </p>
        {busy ? (
          <p role="status" className="text-xs text-muted-foreground">
            {cmd?.status === 'running' ? 'Executando…' : 'Aguardando o agente…'}
          </p>
        ) : cmd?.status === 'failed' ? (
          <p role="status" className="text-xs text-danger">
            {cmd.message || 'O comando falhou.'}
          </p>
        ) : cmd?.status === 'expired' ? (
          <p role="status" className="text-xs text-warning">
            Agente não respondeu.
          </p>
        ) : null}
      </TableCell>
      <TableCell className="tabular text-muted-foreground">{p.pid}</TableCell>
      <TableCell>{p.user || '—'}</TableCell>
      <TableCell className="tabular whitespace-nowrap" title={`${formatNumber(p.cpu_percent)}% de um núcleo`}>
        {formatPercent(cpus > 0 ? p.cpu_percent / cpus : p.cpu_percent)}
      </TableCell>
      <TableCell className="tabular whitespace-nowrap">
        {formatBytes(p.memory_bytes)}
        <span className="ml-1 text-xs text-muted-foreground">{formatPercent(p.memory_percent)}</span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">{STATE_LABEL[p.state] ?? p.state}</TableCell>
      {canAct && (
        <TableCell className="text-right">
          {allowed || force ? (
            <div className="flex justify-end gap-2">
              {allowed && !force && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => onAsk(p, 'terminate')}>
                  <Power /> Encerrar
                </Button>
              )}
              {force && (
                <Button size="sm" variant="destructive" disabled={busy} onClick={() => onAsk(p, 'kill')}>
                  <Skull /> Forçar
                </Button>
              )}
            </div>
          ) : (
            <Tooltip side="left" content={p.restriction_message || 'Este processo não pode ser encerrado.'}>
              <span className="inline-block" tabIndex={0}>
                <Button size="sm" variant="outline" disabled aria-label={`Encerrar ${p.name} indisponível`}>
                  <Power /> Encerrar
                </Button>
              </span>
            </Tooltip>
          )}
        </TableCell>
      )}
    </TableRow>
  )
}

export function ProcessesTab({ serverId }: { serverId: string }) {
  const qc = useQueryClient()
  const { can } = useAuth()
  const canAct = can('operator')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ProcessSort>('cpu')
  const [limit, setLimit] = useState(100)
  const term = useDebouncedValue(search.trim())
  const q = useServerProcesses(serverId, { sort, limit, q: term || undefined })
  const history = useServerCommands(serverId)
  const act = useProcessAction(serverId)
  const [tracked, setTracked] = useState<Record<string, string>>({})
  const [confirm, setConfirm] = useState<{ process: ServerProcess; action: ProcessAction } | null>(null)
  const [requestingKey, setRequestingKey] = useState<string | null>(null)

  // Comandos já em andamento (ex.: pedidos antes de abrir a aba), por "pid:start_time".
  const inProgress: Record<string, string> = {}
  for (const cmd of history.data ?? []) {
    if (cmd.service_key === 'process' && cmd.target && isActive(cmd) && !inProgress[cmd.target]) inProgress[cmd.target] = cmd.id
  }

  function submit(p: ServerProcess, action: ProcessAction) {
    setRequestingKey(key(p))
    act.mutate(
      { pid: p.pid, startTime: p.start_time, action },
      {
        onSuccess: (cmd) => setTracked((t) => ({ ...t, [key(p)]: cmd.id })),
        onSettled: () => setRequestingKey(null),
      },
    )
  }

  function finished(p: ServerProcess, cmd: ServiceCommand) {
    if (cmd.status === 'succeeded') toast.success(cmd.message || `Processo ${p.name} (pid ${p.pid}) ${ACTION_DONE[cmd.action === 'kill' ? 'kill' : 'terminate']}.`)
    else if (cmd.status === 'failed') toast.error(cmd.message || `Falha ao encerrar ${p.name} (pid ${p.pid}).`)
    else toast.warning('Agente não respondeu.')
    void qc.invalidateQueries({ queryKey: ['servers', serverId, 'processes'] })
    void qc.invalidateQueries({ queryKey: ['servers', serverId, 'commands'] })
  }

  const d = q.data
  const rows = d?.processes ?? []

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Processos</CardTitle>
          {d?.status === 'ok' && (
            <p className="mt-1 text-sm text-muted-foreground">
              {d.total} no total{term && ` · ${d.matched} encontrados`} · atualizado {formatRelative(d.checked_at)}
            </p>
          )}
        </div>
        <LastUpdated updatedAt={q.dataUpdatedAt} fetching={q.isFetching} failed={q.isError && !!d} onRefresh={() => void q.refetch()} />
      </CardHeader>

      <div className="grid gap-3 border-b px-4 pb-4 sm:grid-cols-[1fr_12rem_8rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar processo"
            placeholder="Buscar por nome, comando, usuário ou pid"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select aria-label="Ordenar por" value={sort} onChange={(e) => setSort(e.target.value as ProcessSort)}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Select aria-label="Quantidade de processos" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          {LIMITS.map((n) => (
            <option key={n} value={n}>
              {n} processos
            </option>
          ))}
        </Select>
      </div>

      {q.isPending ? (
        <LoadingRows rows={5} />
      ) : q.isError && !d ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !d ? null : d.status !== 'ok' ? (
        <EmptyState title="Aguardando o agente…" description={d.message || undefined} />
      ) : rows.length === 0 ? (
        <EmptyState title={term ? 'Nenhum processo encontrado' : 'Nenhum processo reportado'} description={term ? 'Tente outro termo de busca.' : undefined} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Processo</TableHead>
              <TableHead>PID</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead title="Percentual do servidor, média desde a leitura anterior">CPU</TableHead>
              <TableHead title="Memória residente (RSS); páginas compartilhadas contam em cada processo">Memória</TableHead>
              <TableHead>Estado</TableHead>
              {canAct && <TableHead className="text-right">Ação</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <ProcessRow
                key={key(p)}
                process={p}
                canAct={canAct}
                cpus={d.cpus}
                commandId={tracked[key(p)] ?? inProgress[key(p)]}
                requesting={requestingKey === key(p)}
                onAsk={(proc, action) => setConfirm({ process: proc, action })}
                onFinished={finished}
              />
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.action === 'kill' ? 'Forçar encerramento?' : 'Encerrar processo?'}
        description={
          confirm && (
            <>
              <strong>{confirm.process.name}</strong> (pid {confirm.process.pid}, usuário {confirm.process.user || '—'}){' '}
              {confirm.action === 'kill'
                ? 'será finalizado imediatamente (SIGKILL), sem chance de salvar dados.'
                : 'receberá um pedido para sair (SIGTERM).'}
            </>
          )
        }
        confirmLabel={confirm?.action === 'kill' ? 'Forçar' : 'Encerrar'}
        destructive
        onConfirm={() => {
          if (confirm) submit(confirm.process, confirm.action)
          setConfirm(null)
        }}
      />
    </Card>
  )
}
