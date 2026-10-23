import { useState } from 'react'
import { PageHeader } from '@/components/data-display/PageHeader'
import { PeriodSelect } from '@/components/data-display/PeriodSelect'
import { Select } from '@/components/ui/input'
import { useServers } from '@/features/servers/hooks/useServers'
import type { PeriodKey } from '@/lib/periods'
import { AggregateMetricCharts, ServerMetricCharts } from '../components/MetricCharts'

export function MetricsPage() {
  const [period, setPeriod] = useState<PeriodKey>('1h')
  const [serverId, setServerId] = useState('')
  const servers = useServers({ per_page: 100, sort: 'name' })

  return (
    <>
      <PageHeader
        title="Métricas"
        description={serverId ? 'Histórico detalhado de um servidor.' : 'Visão agregada de todos os servidores online. Escolha um servidor para ver rede e swap.'}
        actions={
          <>
            <div className="w-56">
              <Select aria-label="Servidor" value={serverId} onChange={(e) => setServerId(e.target.value)}>
                <option value="">Todos (agregado)</option>
                {servers.data?.data.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <PeriodSelect value={period} onChange={setPeriod} className="w-52" />
          </>
        }
      />
      {serverId ? <ServerMetricCharts serverId={serverId} period={period} /> : <AggregateMetricCharts period={period} />}
    </>
  )
}
