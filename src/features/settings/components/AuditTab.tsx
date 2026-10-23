import { useState } from 'react'
import { Pagination } from '@/components/data-display/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { usePage } from '@/hooks/usePage'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'
import { useAuditLogs } from '../hooks/useSettings'

/** Visível apenas para administradores. */
export function AuditTab() {
  const [input, setInput] = useState('')
  const action = useDebouncedValue(input.trim())
  const [page, setPage] = usePage(action)
  const q = useAuditLogs({ page, per_page: 20, action: action || undefined })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trilha de auditoria</CardTitle>
        <CardDescription>Quem fez o quê, do mais recente ao mais antigo. Nunca inclui senhas nem tokens. No filtro, termine com “.” para buscar por prefixo (ex.: user.).</CardDescription>
      </CardHeader>
      <div className="px-5 pb-3 sm:w-64">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Filtrar ação (ex.: user.)" aria-label="Filtrar por ação" />
      </div>
      {q.isPending ? (
        <LoadingRows rows={4} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : q.data.data.length === 0 ? (
        <EmptyState title="Nenhum registro" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Quando</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.data.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(e.created_at)}</TableCell>
                  <TableCell className="font-mono text-xs">{e.action}</TableCell>
                  <TableCell className="text-muted-foreground">{e.resource_type}</TableCell>
                  <TableCell>{e.actor}</TableCell>
                  <TableCell className="text-muted-foreground">{e.ip ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination meta={q.data.meta} onPage={setPage} />
        </>
      )}
    </Card>
  )
}
