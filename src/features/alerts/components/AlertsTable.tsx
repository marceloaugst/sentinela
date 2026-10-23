import { Link } from 'react-router-dom'
import { AlertStatusBadge, PriorityBadge } from '@/components/data-display/status'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime, formatRelative } from '@/lib/format'
import type { Alert } from '@/types/api'

interface Props {
  alerts: Alert[]
  onSelect: (a: Alert) => void
  showServer?: boolean
}

export function AlertsTable({ alerts, onSelect, showServer = true }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Prioridade</TableHead>
          <TableHead>Alerta</TableHead>
          {showServer && <TableHead>Servidor</TableHead>}
          <TableHead>Estado</TableHead>
          <TableHead>Disparado em</TableHead>
          <TableHead>Resolvido em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((a) => (
          <TableRow key={a.id}>
            <TableCell>
              <PriorityBadge priority={a.priority} />
            </TableCell>
            <TableCell className="max-w-96">
              <button type="button" onClick={() => onSelect(a)} className="block w-full text-left hover:text-primary">
                <span className="block font-medium">{a.rule_name}</span>
                <span className="block truncate text-xs text-muted-foreground">{a.message}</span>
              </button>
            </TableCell>
            {showServer && (
              <TableCell>
                <Link to={`/servers/${a.server_id}`} className="hover:text-primary hover:underline">
                  {a.server_name}
                </Link>
                {a.service_name && <p className="text-xs text-muted-foreground">{a.service_name}</p>}
              </TableCell>
            )}
            <TableCell>
              <AlertStatusBadge status={a.status} />
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground" title={formatDateTime(a.triggered_at)}>
              {formatRelative(a.triggered_at)}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">{a.resolved_at ? formatDateTime(a.resolved_at) : '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
