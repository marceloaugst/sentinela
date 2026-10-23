import { Link } from 'react-router-dom'
import { ServiceStatusBadge } from '@/components/data-display/status'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime, formatRelative } from '@/lib/format'
import type { Service } from '@/types/api'

interface Props {
  services: Service[]
  /** id → nome. Quando informado, exibe a coluna de servidor. */
  serverNames?: Map<string, string>
}

export function ServicesTable({ services, serverNames }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Serviço</TableHead>
          {serverNames && <TableHead>Servidor</TableHead>}
          <TableHead>Estado</TableHead>
          <TableHead>Última verificação</TableHead>
          <TableHead>Última mudança de estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.name}</TableCell>
            {serverNames && (
              <TableCell>
                <Link to={`/servers/${s.server_id}`} className="hover:text-primary hover:underline">
                  {serverNames.get(s.server_id) ?? '—'}
                </Link>
              </TableCell>
            )}
            <TableCell>
              <ServiceStatusBadge status={s.status} />
              {s.status === 'down' && s.last_error && (
                <p className="mt-1 max-w-72 truncate text-xs text-muted-foreground" title={s.last_error}>
                  {s.last_error}
                </p>
              )}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground" title={formatDateTime(s.last_checked_at)}>
              {formatRelative(s.last_checked_at)}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground" title={formatDateTime(s.status_changed_at)}>
              {s.status_changed_at ? formatRelative(s.status_changed_at) : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
