import { useMemo, type ReactNode } from 'react'
import { ChartCard } from '@/components/charts/ChartCard'
import { statColumns, TimeSeriesChart, type ChartRow } from '@/components/charts/TimeSeriesChart'
import { formatNumber, formatPercent, formatRate } from '@/lib/format'
import { getPeriod, type PeriodKey } from '@/lib/periods'
import type { AggregatedPoint, MetricPoint } from '@/types/api'
import { useAggregateSeries, useServerSeries } from '../hooks/useMetrics'

const C1 = 'var(--chart-1)'
const C2 = 'var(--chart-2)'
const C3 = 'var(--chart-3)'
const C4 = 'var(--chart-4)'

const pct = (v: number | null | undefined) => formatPercent(v, 0)
const pctTip = (v: number | null | undefined) => formatPercent(v, 1)
const load = (v: number | null | undefined) => formatNumber(v, 2)

function serverRows(points: MetricPoint[] | undefined): ChartRow[] {
  return (points ?? []).map((p) => ({
    t: new Date(p.t).getTime(),
    ...statColumns('cpu', p.cpu_usage_percent),
    ...statColumns('mem', p.memory_used_percent),
    ...statColumns('load', p.load_average_1m),
    ...statColumns('swap', p.swap_used_percent),
    ...statColumns('rx', p.network_rx_bytes_per_sec),
    ...statColumns('tx', p.network_tx_bytes_per_sec),
  })) as ChartRow[]
}

function aggregateRows(points: AggregatedPoint[] | undefined): ChartRow[] {
  return (points ?? []).map((p) => ({
    t: new Date(p.t).getTime(),
    ...statColumns('cpu', p.cpu_usage_percent),
    mem: p.memory_used_percent,
    ...statColumns('load', p.load_average_1m),
  })) as ChartRow[]
}

const hasValues = (rows: ChartRow[], key: string) => rows.some((r) => r[key] != null)


/** Taxa de rede (bytes/s) — nunca confundir com volume acumulado. */
export function NetworkChart({
  rows,
  spanMs,
  actions,
  ...state
}: {
  rows: ChartRow[]
  spanMs: number
  actions?: ReactNode
  loading?: boolean
  error?: unknown
  onRetry?: () => void
}) {
  return (
    <ChartCard
      title="Tráfego de rede"
      description="Taxa de transferência (bytes por segundo) — não é volume acumulado"
      empty={!hasValues(rows, 'rx') && !hasValues(rows, 'tx')}
      actions={actions}
      {...state}
    >
      <TimeSeriesChart
        rows={rows}
        spanMs={spanMs}
        format={formatRate}
        series={[
          { key: 'rx', label: 'Recebido', color: C1 },
          { key: 'tx', label: 'Enviado', color: C3 },
        ]}
      />
    </ChartCard>
  )
}

/** Rede de um servidor escolhido (o agregado da API não inclui rede). */
export function ServerNetworkCard({ serverId, period, actions }: { serverId: string | undefined; period: PeriodKey; actions?: ReactNode }) {
  const q = useServerSeries(serverId, period)
  const rows = useMemo(() => serverRows(q.data?.data), [q.data])
  return (
    <NetworkChart
      rows={rows}
      spanMs={getPeriod(period).ms}
      actions={actions}
      loading={!!serverId && q.isPending}
      error={q.error}
      onRetry={() => void q.refetch()}
    />
  )
}

/** Gráficos históricos de um servidor: CPU, RAM, carga, swap e taxa de rede. */
export function ServerMetricCharts({ serverId, period }: { serverId: string; period: PeriodKey }) {
  const q = useServerSeries(serverId, period)
  const rows = useMemo(() => serverRows(q.data?.data), [q.data])
  const spanMs = getPeriod(period).ms
  const common = { loading: q.isPending, error: q.error, onRetry: () => void q.refetch() }
  const interval = q.data?.meta.interval

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="CPU" description={`Utilização (%)${interval ? ` · agregação ${interval}` : ''}`} empty={!hasValues(rows, 'cpu')} {...common}>
        <TimeSeriesChart rows={rows} spanMs={spanMs} domain={[0, 100]} format={pct} series={[{ key: 'cpu', label: 'CPU', color: C1 }]} />
      </ChartCard>
      <ChartCard title="Memória RAM" description="Ocupação (% da memória total)" empty={!hasValues(rows, 'mem')} {...common}>
        <TimeSeriesChart rows={rows} spanMs={spanMs} domain={[0, 100]} format={pct} series={[{ key: 'mem', label: 'RAM usada', color: C2 }]} />
      </ChartCard>
      <NetworkChart rows={rows} spanMs={spanMs} {...common} />
      <ChartCard title="Carga média (1 min)" description="Load average — processos na fila de execução" empty={!hasValues(rows, 'load')} {...common}>
        <TimeSeriesChart rows={rows} spanMs={spanMs} format={load} series={[{ key: 'load', label: 'Load 1m', color: C4 }]} />
      </ChartCard>
      {hasValues(rows, 'swap') && (
        <ChartCard title="Swap" description="Ocupação (% da swap total)" {...common}>
          <TimeSeriesChart rows={rows} spanMs={spanMs} domain={[0, 100]} format={pctTip} series={[{ key: 'swap', label: 'Swap usada', color: C3 }]} />
        </ChartCard>
      )}
    </div>
  )
}

/** Gráficos agregados de toda a frota (ou de um subconjunto de servidores). */
export function AggregateMetricCharts({ period, serverIds, extra }: { period: PeriodKey; serverIds?: string[]; extra?: ReactNode }) {
  const q = useAggregateSeries(period, serverIds)
  const rows = useMemo(() => aggregateRows(q.data?.data), [q.data])
  const spanMs = getPeriod(period).ms
  const common = { loading: q.isPending, error: q.error, onRetry: () => void q.refetch() }
  const servers = rows.length ? Math.max(...(q.data?.data ?? []).map((p) => p.servers)) : 0

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="CPU — média e pico"
        description={`Utilização (%) ponderada por CPUs lógicas${servers ? ` · até ${servers} servidor(es)` : ''}`}
        empty={!hasValues(rows, 'cpu')}
        {...common}
      >
        <TimeSeriesChart
          rows={rows}
          spanMs={spanMs}
          domain={[0, 100]}
          format={pct}
          series={[
            { key: 'cpu', label: 'Média', color: C1 },
            { key: 'cpu_max', label: 'Máximo', color: C3 },
          ]}
        />
      </ChartCard>
      <ChartCard title="Memória RAM" description="Σ usado ÷ Σ total (%) dos servidores online" empty={!hasValues(rows, 'mem')} {...common}>
        <TimeSeriesChart rows={rows} spanMs={spanMs} domain={[0, 100]} format={pct} series={[{ key: 'mem', label: 'RAM usada', color: C2 }]} />
      </ChartCard>
      <ChartCard title="Carga média (1 min)" description="Load average agregado" empty={!hasValues(rows, 'load')} {...common}>
        <TimeSeriesChart rows={rows} spanMs={spanMs} format={load} series={[{ key: 'load', label: 'Load 1m', color: C4 }]} />
      </ChartCard>
      {extra}
    </div>
  )
}
