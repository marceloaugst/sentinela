import { ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'
import type { LogRow } from '@/types/api'
import { SEVERITY_LABEL, SEVERITY_VARIANT, SOURCE_COLOR, summarize } from '../format'

interface Props {
  rows: LogRow[]
  serverNames?: Map<string, string>
  showServer?: boolean
  onPickIp: (ip: string) => void
}

// Log é dado controlado por quem ataca (User-Agent, URL, usuário do SSH): tudo é renderizado como texto,
// nunca como HTML, e nenhum campo vira href.
export function LogsTable({ rows, serverNames, showServer = true, onPickIp }: Props) {
  const [open, setOpen] = useState<string | null>(null)
  const keyOf = (l: LogRow, i: number) => `${l.time}|${l.server_id}|${i}`

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-8" />
          <TableHead scope="col">Hora</TableHead>
          {showServer && <TableHead scope="col">Servidor</TableHead>}
          <TableHead scope="col">Fonte</TableHead>
          <TableHead scope="col">Severidade</TableHead>
          <TableHead scope="col">IP</TableHead>
          <TableHead scope="col">Mensagem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((l, i) => {
          const key = keyOf(l, i)
          const expanded = open === key
          const fields = Object.entries(l.fields ?? {})
          return (
            <Fragment key={key}>
              <TableRow>
                <TableCell className="pr-0">
                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? null : key)}
                    aria-expanded={expanded}
                    aria-label={expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>
                </TableCell>
                <TableCell className="tabular whitespace-nowrap text-muted-foreground">{formatDateTime(l.time)}</TableCell>
                {showServer && (
                <TableCell className="whitespace-nowrap">
                  <Link to={`/servers/${encodeURIComponent(l.server_id)}`} className="hover:text-primary hover:underline">
                    {serverNames?.get(l.server_id) ?? l.server_id.slice(0, 8)}
                  </Link>
                </TableCell>
                )}
                <TableCell className="whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: SOURCE_COLOR[l.source] }} aria-hidden />
                    {l.source}/{l.type}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={SEVERITY_VARIANT[l.severity]}>{SEVERITY_LABEL[l.severity] ?? l.severity}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {l.ip && (
                    <button type="button" onClick={() => onPickIp(l.ip!)} title="Filtrar por este IP" className="tabular hover:text-primary hover:underline">
                      {l.ip}
                    </button>
                  )}
                </TableCell>
                <TableCell className="max-w-md truncate" title={summarize(l)}>
                  {summarize(l)}
                </TableCell>
              </TableRow>
              {expanded && (
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={showServer ? 7 : 6} className="space-y-3 py-3">
                    {l.raw && <pre className="whitespace-pre-wrap break-all rounded-md border bg-background p-3 text-xs">{l.raw}</pre>}
                    {fields.length > 0 && (
                      <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
                        {fields.map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <dt className="shrink-0 text-muted-foreground">{k}</dt>
                            <dd className="break-all">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {l.ip && (
                      <Link to={`/logs?ip=${encodeURIComponent(l.ip)}&range=7d`} className="inline-block text-xs text-primary hover:underline">
                        Ver tudo deste IP (7 dias)
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}
