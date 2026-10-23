import { Ban, Globe, ShieldX, Siren } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChartCard } from '@/components/charts/ChartCard'
import { TimeSeriesChart, type ChartRow } from '@/components/charts/TimeSeriesChart'
import { StatCard } from '@/components/data-display/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatNumber } from '@/lib/format'
import { isApiError } from '@/lib/api'
import type { LogStats } from '@/types/api'
import { portLabel, SOURCE_COLOR, summaryCounts, timelineRows, trafficRows } from '../format'
import { LOG_RANGES, type LogRangeKey } from '../ranges'

interface Props {
  stats: LogStats | undefined
  loading: boolean
  error: unknown
  onRetry: () => void
  range: LogRangeKey
}

const count = (v: number | null | undefined) => formatNumber(v, 0)

export function LogStatsPanel({ stats, loading, error, onRetry, range }: Props) {
  const spanMs = LOG_RANGES.find((r) => r.key === range)?.ms ?? 0
  const counts = stats ? summaryCounts(stats) : null
  const timeline = useMemo(() => (stats ? (timelineRows(stats) as ChartRow[]) : []), [stats])
  const traffic = useMemo(() => (stats ? (trafficRows(stats) as ChartRow[]) : []), [stats])
  // Erros de estatística não devem derrubar a lista; o 503 já é explicado pela própria lista.
  const unavailable = isApiError(error) && error.code === 'LOGS_UNAVAILABLE'
  if (unavailable) return null

  return (
    <section className="space-y-4" aria-label="Estatísticas de logs">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bans (fail2ban)" value={count(counts?.bans)} icon={Ban} tone="warning" loading={loading} />
        <StatCard label="Pacotes bloqueados" value={count(counts?.blocked)} icon={ShieldX} tone="danger" hint="Firewall (ufw), exceto permitidos" loading={loading} />
        <StatCard label="Erros HTTP registrados" value={count(counts?.httpErrors)} icon={Siren} tone="neutral" hint="4xx, 5xx e requisições suspeitas" loading={loading} />
        <StatCard label="Requisições nginx" value={count(counts?.requests)} icon={Globe} hint="Volume total, inclusive o que não gerou log" loading={loading} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Eventos por fonte"
          description="Quantidade de linhas de log ao longo do tempo"
          loading={loading}
          error={error}
          onRetry={onRetry}
          empty={timeline.every((r) => !r.nginx && !r.fail2ban && !r.firewall)}
          emptyText="Nenhum log neste período."
        >
          <TimeSeriesChart
            rows={timeline}
            spanMs={spanMs}
            format={count}
            series={[
              { key: 'nginx', label: 'nginx', color: SOURCE_COLOR.nginx },
              { key: 'fail2ban', label: 'fail2ban', color: SOURCE_COLOR.fail2ban },
              { key: 'firewall', label: 'Firewall', color: SOURCE_COLOR.firewall },
            ]}
          />
        </ChartCard>
        <ChartCard
          title="Tráfego nginx"
          description="Requisições e erros por intervalo"
          loading={loading}
          error={error}
          onRetry={onRetry}
          empty={traffic.every((r) => !r.requests)}
          emptyText="Nenhum resumo de tráfego neste período."
        >
          <TimeSeriesChart
            rows={traffic}
            spanMs={spanMs}
            format={count}
            series={[
              { key: 'requests', label: 'Requisições', color: 'var(--chart-1)' },
              { key: 'errors_4xx', label: 'Erros 4xx', color: 'var(--chart-3)' },
              { key: 'errors_5xx', label: 'Erros 5xx', color: 'var(--danger)' },
            ]}
          />
        </ChartCard>
      </div>

      {!error && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>IPs mais ativos</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {!stats || stats.top_ips.length === 0 ? (
                <p className="px-6 pb-4 text-sm text-muted-foreground">{loading ? 'Carregando…' : 'Nenhum IP no período.'}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>IP</TableHead>
                      <TableHead className="text-right">Eventos</TableHead>
                      <TableHead className="text-right">Bans</TableHead>
                      <TableHead className="text-right">Bloqueios</TableHead>
                      <TableHead className="text-right">Erros HTTP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.top_ips.map((ip) => (
                      <TableRow key={ip.ip}>
                        <TableCell>
                          <Link to={`/logs?ip=${encodeURIComponent(ip.ip)}&range=${range}`} className="tabular hover:text-primary hover:underline">
                            {ip.ip}
                          </Link>
                        </TableCell>
                        <TableCell className="tabular text-right">{count(ip.events)}</TableCell>
                        <TableCell className="tabular text-right">{count(ip.bans)}</TableCell>
                        <TableCell className="tabular text-right">{count(ip.firewall_blocks)}</TableCell>
                        <TableCell className="tabular text-right">{count(ip.http_errors)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Portas mais bloqueadas</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {!stats || stats.top_blocked_ports.length === 0 ? (
                <p className="px-6 pb-4 text-sm text-muted-foreground">{loading ? 'Carregando…' : 'Nenhum bloqueio no período.'}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Porta</TableHead>
                      <TableHead className="text-right">Bloqueios</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.top_blocked_ports.map((p) => (
                      <TableRow key={p.port}>
                        <TableCell className="tabular">{portLabel(p.port)}</TableCell>
                        <TableCell className="tabular text-right">{count(p.blocks)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}
