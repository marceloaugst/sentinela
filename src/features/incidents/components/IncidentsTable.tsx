import { Link } from 'react-router-dom'
import { Repeat } from 'lucide-react'
import { IncidentStatusBadge, PriorityBadge } from '@/components/data-display/status'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime, formatDuration } from '@/lib/format'
import type { Incident } from '@/types/api'

export function IncidentsTable({ incidents, showServer = true }: { incidents: Incident[]; showServer?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Prioridade</TableHead>
          <TableHead>Incidente</TableHead>
          {showServer && <TableHead>Servidor</TableHead>}
          <TableHead>Estado</TableHead>
          <TableHead>Início</TableHead>
          <TableHead>Duração</TableHead>
          <TableHead>Resolvido em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {incidents.map((i) => (
          <TableRow key={i.id}>
            <TableCell>
              <PriorityBadge priority={i.priority} />
            </TableCell>
            <TableCell className="max-w-96">
              <Link to={`/incidents/${i.id}`} className="block truncate font-medium hover:text-primary hover:underline">
                {i.title}
              </Link>
              {i.recurrence_count > 0 && (
                <Badge variant="warning" className="mt-1">
                  <Repeat className="size-3" aria-hidden />
                  Reincidente ({i.recurrence_count}×)
                </Badge>
              )}
              {i.rule_name && <span className="block truncate text-xs text-muted-foreground">{i.rule_name}</span>}
            </TableCell>
            {showServer && (
              <TableCell>
                {i.server_id ? (
                  <Link to={`/servers/${i.server_id}`} className="hover:text-primary hover:underline">
                    {i.server_name}
                  </Link>
                ) : (
                  '—'
                )}
              </TableCell>
            )}
            <TableCell>
              <IncidentStatusBadge status={i.status} />
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(i.started_at)}</TableCell>
            <TableCell className="tabular whitespace-nowrap text-muted-foreground">{formatDuration(i.duration_seconds)}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">{i.resolved_at ? formatDateTime(i.resolved_at) : '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
