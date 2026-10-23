import { Cpu, HardDrive, MemoryStick } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UsageBar } from '@/components/ui/progress'
import { formatBytes, formatPercent } from '@/lib/format'
import type { Capacity, DashboardSummary } from '@/types/api'

function Shell({ title, icon: Icon, children, loading }: { title: string; icon: typeof Cpu; children: React.ReactNode; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-3">{loading ? <Skeleton className="h-20 w-full" /> : children}</CardContent>
    </Card>
  )
}

function CapacityCard({ title, icon, capacity, loading, note }: { title: string; icon: typeof Cpu; capacity: Capacity | undefined; loading: boolean; note: string }) {
  const empty = !capacity || capacity.total_bytes === 0
  return (
    <Shell title={title} icon={icon} loading={loading}>
      {empty ? (
        <p className="py-4 text-sm text-muted-foreground">Sem dados de servidores online.</p>
      ) : (
        <>
          <p className="tabular text-2xl font-semibold">{formatPercent(capacity.used_percent)}</p>
          <UsageBar percent={capacity.used_percent} label={`${title} em uso`} />
          <p className="tabular text-xs text-muted-foreground">
            {formatBytes(capacity.used_bytes)} usados de {formatBytes(capacity.total_bytes)}
          </p>
          <p className="text-xs text-muted-foreground">{note}</p>
        </>
      )}
    </Shell>
  )
}

export function ResourceCards({ summary, loading }: { summary: DashboardSummary | undefined; loading: boolean }) {
  const r = summary?.resources
  const cpu = r?.cpu
  const dist = cpu?.distribution
  const total = dist ? dist.low + dist.medium + dist.high : 0
  const note = `Σ usado ÷ Σ total de ${r?.reporting_servers ?? 0} servidor(es) online`

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Shell title="CPU" icon={Cpu} loading={loading}>
        {cpu?.weighted_avg_percent == null ? (
          <p className="py-4 text-sm text-muted-foreground">Sem dados de servidores online.</p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <p className="tabular text-2xl font-semibold">{formatPercent(cpu.weighted_avg_percent)}</p>
              <p className="text-xs text-muted-foreground">média ponderada por CPUs</p>
            </div>
            <UsageBar percent={cpu.weighted_avg_percent} label="CPU média" />
            <p className="tabular text-xs text-muted-foreground">
              Pico: {formatPercent(cpu.max_percent)}
              {cpu.top_server && (
                <>
                  {' '}em{' '}
                  <Link to={`/servers/${cpu.top_server.id}`} className="text-primary hover:underline">
                    {cpu.top_server.name}
                  </Link>
                </>
              )}
            </p>
            {dist && total > 0 && (
              <p className="tabular text-xs text-muted-foreground">
                Distribuição: {dist.low} baixa (&lt;50%) · {dist.medium} média · {dist.high} alta (≥80%)
              </p>
            )}
          </>
        )}
      </Shell>
      <CapacityCard title="Memória RAM" icon={MemoryStick} capacity={r?.memory} loading={loading} note={note} />
      <CapacityCard title="Armazenamento" icon={HardDrive} capacity={r?.disk} loading={loading} note={note} />
    </div>
  )
}
