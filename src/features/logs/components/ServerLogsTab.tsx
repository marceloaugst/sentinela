import { Link } from 'react-router-dom'
import { useState } from 'react'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Pagination } from '@/components/data-display/Pagination'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { isApiError } from '@/lib/api'
import { usePage } from '@/hooks/usePage'
import type { LogSeverity, LogSource } from '@/types/api'
import { SEVERITIES, SOURCE_LABEL } from '../format'
import { useLogs } from '../hooks/useLogs'
import { DEFAULT_LOG_RANGE, LOG_RANGES, type LogRangeKey } from '../ranges'
import { LogsTable } from './LogsTable'

const SOURCES = Object.keys(SOURCE_LABEL) as LogSource[]

/** Aba "Logs" do detalhe do servidor: lista enxuta; filtros avançados e estatísticas ficam em /logs. */
export function ServerLogsTab({ serverId }: { serverId: string }) {
  const [source, setSource] = useState<LogSource | ''>('')
  const [severity, setSeverity] = useState<LogSeverity | ''>('')
  const [ip, setIp] = useState('')
  const [range, setRange] = useState<LogRangeKey>(DEFAULT_LOG_RANGE)
  const [page, setPage] = usePage(`${source}|${severity}|${ip}|${range}`)

  const q = useLogs({ server_id: serverId, source: source || undefined, severity: severity || undefined, ip: ip || undefined, range, page, per_page: 20 }, false)
  const rows = q.data?.data ?? []

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <Select aria-label="Filtrar por período" value={range} onChange={(e) => setRange(e.target.value as LogRangeKey)}>
            {LOG_RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </Select>
          <Select aria-label="Filtrar por fonte" value={source} onChange={(e) => setSource(e.target.value as LogSource | '')}>
            <option value="">Todas as fontes</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABEL[s]}
              </option>
            ))}
          </Select>
          <Select aria-label="Filtrar por severidade" value={severity} onChange={(e) => setSeverity(e.target.value as LogSeverity | '')}>
            <option value="">Toda severidade</option>
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <Link to={`/logs?server_id=${encodeURIComponent(serverId)}`} className="text-xs text-primary hover:underline">
          Estatísticas e filtros avançados
        </Link>
      </div>
      {q.isPending ? (
        <LoadingRows rows={3} />
      ) : q.isError && !q.data ? (
        isApiError(q.error) && q.error.code === 'LOGS_UNAVAILABLE' ? (
          <EmptyState title="Armazenamento de logs indisponível" description="Tente novamente em instantes." />
        ) : (
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        )
      ) : rows.length === 0 ? (
        <EmptyState title="Nenhum log para este servidor neste período" description="Confirme que o agente foi iniciado com SENTINELA_LOGS=nginx,fail2ban,ufw. Ele só envia linhas escritas depois que inicia." />
      ) : (
        <>
          <LogsTable rows={rows} showServer={false} onPickIp={setIp} />
          <Pagination meta={q.data?.meta} onPage={setPage} />
        </>
      )}
    </Card>
  )
}
