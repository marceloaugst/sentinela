import { useQueryClient } from '@tanstack/react-query'
import { Database, Download } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LastUpdated } from '@/components/data-display/LastUpdated'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Pagination } from '@/components/data-display/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useServers } from '@/features/servers/hooks/useServers'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { isApiError } from '@/lib/api'
import type { LogSeverity, LogSource } from '@/types/api'
import { LogStatsPanel } from '../components/LogStatsPanel'
import { LogsTable } from '../components/LogsTable'
import { ALL_TYPES, isValidIp, SEVERITIES, SOURCE_LABEL, TYPES_BY_SOURCE, toCsv } from '../format'
import { useLogs, useLogStats } from '../hooks/useLogs'
import { DEFAULT_LOG_RANGE, isLogRange, LOG_RANGES, type LogRangeKey } from '../ranges'
import type { LogFilters } from '../services/logsService'

const PER_PAGE = 50
const SOURCES = Object.keys(SOURCE_LABEL) as LogSource[]
const MAX_Q = 100

const oneOf = <T extends string>(v: string | null, options: readonly T[]): T | undefined => (v && (options as readonly string[]).includes(v) ? (v as T) : undefined)

function LogsError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  if (isApiError(error) && error.code === 'LOGS_UNAVAILABLE') {
    return <EmptyState icon={<Database className="size-5" />} title="Armazenamento de logs indisponível" description="O ClickHouse está fora do ar ou não foi configurado na API. Tente novamente em instantes." />
  }
  if (isApiError(error) && error.status === 422 && error.details.length > 0) {
    return (
      <div role="alert" className="space-y-1 px-4 py-8 text-center text-sm">
        <p className="font-medium">Filtro inválido</p>
        <ul className="text-xs text-muted-foreground">
          {error.details.map((d, i) => (
            <li key={i}>
              {d.field ? `${d.field}: ` : ''}
              {d.message}
            </li>
          ))}
        </ul>
      </div>
    )
  }
  return <ErrorState error={error} onRetry={onRetry} />
}

/** Texto digitado que acompanha o parâmetro da URL quando ele muda por fora (link "Ver tudo deste IP", voltar do navegador). */
function useUrlText(param: string) {
  const [state, setState] = useState({ param, value: param })
  const value = state.param === param ? state.value : param
  const setValue = (v: string) => setState({ param, value: v })
  return [value, setValue] as const
}

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function LogsPage() {
  const qc = useQueryClient()
  const [sp, setSp] = useSearchParams()

  const source = oneOf(sp.get('source'), SOURCES)
  const severity = oneOf(sp.get('severity'), SEVERITIES.map((s) => s.value) as LogSeverity[])
  const type = oneOf(sp.get('type'), source ? TYPES_BY_SOURCE[source] : ALL_TYPES)
  const range: LogRangeKey = isLogRange(sp.get('range')) ? (sp.get('range') as LogRangeKey) : DEFAULT_LOG_RANGE
  const serverId = sp.get('server_id') ?? ''
  const ipParam = sp.get('ip') ?? ''
  const qParam = sp.get('q') ?? ''
  const live = sp.get('live') === '1'
  const page = Math.max(1, Number(sp.get('page')) || 1)

  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    if (!('page' in patch)) next.delete('page') // mudar filtro volta para a página 1
    setSp(next, { replace: true })
  }

  // Campos de texto: o valor digitado é local; só vai para a URL (e para a API) depois do debounce e se for válido.
  const [ipInput, setIpInput] = useUrlText(ipParam)
  const [qInput, setQInput] = useUrlText(qParam)
  const ipDebounced = useDebouncedValue(ipInput.trim(), 400)
  const qDebounced = useDebouncedValue(qInput.trim(), 400)
  const ipInvalid = ipInput.trim() !== '' && !isValidIp(ipInput.trim())

  useEffect(() => {
    if (ipDebounced === ipParam) return
    if (ipDebounced === '' || isValidIp(ipDebounced)) set({ ip: ipDebounced || undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipDebounced])
  useEffect(() => {
    if (qDebounced !== qParam) set({ q: qDebounced || undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced])

  const filters: LogFilters = { server_id: serverId || undefined, source, type, severity, ip: ipParam || undefined, q: qParam || undefined, range }
  const list = useLogs({ ...filters, page, per_page: PER_PAGE }, live)
  const stats = useLogStats({ server_id: filters.server_id, range })

  const servers = useServers({ per_page: 100, sort: 'name' })
  const serverNames = useMemo(() => new Map((servers.data?.data ?? []).map((s) => [s.id, s.name])), [servers.data])

  const rows = list.data?.data ?? []
  const filtered = !!(serverId || source || type || severity || ipParam || qParam)

  return (
    <>
      <PageHeader
        title="Logs"
        description="Eventos de nginx, fail2ban e firewall (ufw) coletados pelos agentes."
        actions={
          <>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch checked={live} onCheckedChange={(v) => set({ live: v ? '1' : undefined, page: page > 1 ? '1' : undefined })} aria-label="Atualizar a lista a cada 5 segundos" />
              Ao vivo
            </label>
            <Button size="sm" variant="outline" disabled={rows.length === 0} onClick={() => download(`logs-pagina-${page}.csv`, toCsv(rows))}>
              <Download /> Exportar página
            </Button>
            <LastUpdated
              updatedAt={list.dataUpdatedAt}
              fetching={list.isFetching}
              failed={list.isError && !!list.data}
              onRefresh={() => void qc.invalidateQueries({ queryKey: ['logs'] })}
            />
          </>
        }
      />

      <LogStatsPanel stats={stats.data} loading={stats.isPending} error={stats.isError && !stats.data ? stats.error : undefined} onRetry={() => void stats.refetch()} range={range} />

      <Card>
        <div className="grid gap-3 border-b p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select aria-label="Filtrar por período" value={range} onChange={(e) => set({ range: e.target.value === DEFAULT_LOG_RANGE ? undefined : e.target.value })}>
            {LOG_RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </Select>
          <Select aria-label="Filtrar por servidor" value={serverId} onChange={(e) => set({ server_id: e.target.value || undefined })}>
            <option value="">Todos os servidores</option>
            {servers.data?.data.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select aria-label="Filtrar por fonte" value={source ?? ''} onChange={(e) => set({ source: e.target.value || undefined, type: undefined })}>
            <option value="">Todas as fontes</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABEL[s]}
              </option>
            ))}
          </Select>
          <Select aria-label="Filtrar por tipo" value={type ?? ''} onChange={(e) => set({ type: e.target.value || undefined })}>
            <option value="">Todos os tipos</option>
            {(source ? TYPES_BY_SOURCE[source] : ALL_TYPES).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select aria-label="Filtrar por severidade" value={severity ?? ''} onChange={(e) => set({ severity: e.target.value || undefined })}>
            <option value="">Toda severidade</option>
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <div>
            <Input
              aria-label="Filtrar por IP"
              aria-invalid={ipInvalid}
              placeholder="IP (ex.: 203.0.113.7)"
              inputMode="text"
              maxLength={45}
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
            />
            {ipInvalid && <p className="mt-1 text-xs text-danger">IP inválido.</p>}
          </div>
          <Input className="lg:col-span-2" aria-label="Buscar no texto original" placeholder="Buscar no texto original…" maxLength={MAX_Q} value={qInput} onChange={(e) => setQInput(e.target.value)} />
        </div>

        {list.isPending ? (
          <LoadingRows />
        ) : list.isError && !list.data ? (
          <LogsError error={list.error} onRetry={() => void list.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nenhum log neste período"
            description={
              filtered
                ? 'Ajuste os filtros ou amplie o período.'
                : 'Se o servidor é novo, confirme que o agente foi iniciado com SENTINELA_LOGS=nginx,fail2ban,ufw (veja docs/logs.md). O agente só envia linhas escritas depois que inicia.'
            }
          />
        ) : (
          <>
            <LogsTable rows={rows} serverNames={serverNames} onPickIp={(ip) => set({ ip })} />
            <Pagination meta={list.data?.meta} onPage={(p) => set({ page: String(p) })} />
          </>
        )}
      </Card>
    </>
  )
}
