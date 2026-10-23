import { Fragment } from 'react'
import { PriorityBadge, PRIORITY_LABEL } from '@/components/data-display/status'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAlertRules } from '@/features/alerts/hooks/useAlerts'
import { formatDuration } from '@/lib/format'
import type { AlertRule, MetricName, Priority } from '@/types/api'

export const METRICS: Record<MetricName, { label: string; unit: string }> = {
  cpu_usage_percent: { label: 'Uso de CPU', unit: '%' },
  memory_used_percent: { label: 'Uso de memória', unit: '%' },
  disk_used_percent: { label: 'Uso de disco (pior volume)', unit: '%' },
  load_average_1m: { label: 'Load average (1 min)', unit: '' },
  server_offline: { label: 'Servidor sem comunicação', unit: 's' },
  service_down: { label: 'Serviço indisponível', unit: '' },
  swap_used_percent: { label: 'Uso de swap', unit: '%' },
  load_per_cpu: { label: 'Load por CPU', unit: '×' },
  oom_kills_10m: { label: 'OOM Killer (10 min)', unit: '' },
  inode_used_percent: { label: 'Uso de inodes', unit: '%' },
  disk_latency_ms: { label: 'Latência de disco', unit: ' ms' },
  ntp_unsynchronized: { label: 'Relógio sem sincronizar', unit: '' },
  security_updates: { label: 'Atualizações de segurança pendentes', unit: '' },
  cert_days_left: { label: 'Dias para o certificado vencer', unit: ' dias' },
}

const PRIORITIES: Priority[] = [1, 2, 3, 4]

function condition(r: AlertRule) {
  const m = METRICS[r.metric_name]
  return `${m?.label ?? r.metric_name} ${r.operator} ${r.threshold}${m?.unit ?? ''}`
}

/** Catálogo fixo do servidor: informativo, sem criação, edição ou exclusão. */
export function AlertRulesTab() {
  const rules = useAlertRules()
  const byPriority = PRIORITIES.map((p) => ({ p, items: (rules.data?.data ?? []).filter((r) => r.priority === p) })).filter((g) => g.items.length > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>O que o Sentinela vigia</CardTitle>
        <CardDescription>
          Alertas e incidentes são automáticos: as regras abaixo vêm de um catálogo fixo e valem para todos os servidores. Elas não podem ser criadas nem editadas por aqui.
        </CardDescription>
      </CardHeader>
      {rules.isPending ? (
        <LoadingRows rows={4} />
      ) : rules.isError ? (
        <ErrorState error={rules.error} onRetry={() => void rules.refetch()} />
      ) : byPriority.length === 0 ? (
        <EmptyState title="Nenhuma regra disponível" description="O catálogo de regras não retornou itens." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Regra</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead>Dispara após</TableHead>
              <TableHead>Resolve após</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byPriority.map(({ p, items }) => (
              <Fragment key={p}>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableCell colSpan={5} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <PriorityBadge priority={p} /> {PRIORITY_LABEL[p]}
                    </span>
                  </TableCell>
                </TableRow>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-96">
                      <span className="block font-medium">{r.name}</span>
                      {r.description && <span className="block text-xs text-muted-foreground">{r.description}</span>}
                      <span className="block font-mono text-[11px] text-muted-foreground">{r.code}</span>
                    </TableCell>
                    <TableCell className="tabular text-muted-foreground">{condition(r)}</TableCell>
                    <TableCell className="tabular whitespace-nowrap text-muted-foreground">{r.duration_seconds ? formatDuration(r.duration_seconds) : 'Imediato'}</TableCell>
                    <TableCell className="tabular whitespace-nowrap text-muted-foreground">{r.recovery_seconds ? formatDuration(r.recovery_seconds) : 'Imediato'}</TableCell>
                    <TableCell>
                      <Badge variant={r.is_enabled ? 'success' : 'neutral'}>{r.is_enabled ? 'Ativa' : 'Inativa'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  )
}
