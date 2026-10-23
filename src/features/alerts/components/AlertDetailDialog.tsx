import { CheckCheck, Eye } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertStatusBadge, PriorityBadge, SeverityBadge } from '@/components/data-display/status'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/AuthProvider'
import { formatDateTime, formatNumber } from '@/lib/format'
import type { Alert } from '@/types/api'
import { useAcknowledgeAlert, useResolveAlert } from '../hooks/useAlerts'

const REASON: Record<string, string> = {
  recovered: 'A condição normalizou (recuperação automática)',
  manual: 'Resolvido manualmente',
  rule_disabled: 'A regra foi desativada',
  rule_deleted: 'A regra foi removida',
  out_of_scope: 'O servidor saiu do escopo da regra',
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 break-words">{children}</dd>
    </div>
  )
}

export function AlertDetailDialog({ alert, onClose }: { alert: Alert | null; onClose: () => void }) {
  const { can } = useAuth()
  const ack = useAcknowledgeAlert()
  const resolve = useResolveAlert()
  const [note, setNote] = useState('')
  const operator = can('operator')
  const open = alert !== null
  const busy = ack.isPending || resolve.isPending

  const close = () => {
    setNote('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        {alert && (
          <>
            <DialogHeader>
              <DialogTitle>{alert.rule_name}</DialogTitle>
              <DialogDescription>{alert.message}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={alert.priority} />
              <SeverityBadge severity={alert.severity} />
              <AlertStatusBadge status={alert.status} />
            </div>
            <dl className="divide-y">
              <Row label="Servidor">
                <Link to={`/servers/${alert.server_id}`} className="text-primary hover:underline" onClick={close}>
                  {alert.server_name}
                </Link>
              </Row>
              {alert.service_name && <Row label="Serviço">{alert.service_name}</Row>}
              {alert.value != null && <Row label="Valor medido">{formatNumber(alert.value, 2)}</Row>}
              <Row label="Disparado em">{formatDateTime(alert.triggered_at)}</Row>
              <Row label="Reconhecido em">{alert.acknowledged_at ? formatDateTime(alert.acknowledged_at) : 'Ainda não reconhecido'}</Row>
              <Row label="Resolvido em">{alert.resolved_at ? formatDateTime(alert.resolved_at) : 'Ainda ativo'}</Row>
              {alert.resolved_at && alert.resolved_reason && <Row label="Motivo da resolução">{REASON[alert.resolved_reason] ?? alert.resolved_reason}</Row>}
              {alert.incident_id && (
                <Row label="Incidente">
                  <Link to={`/incidents/${alert.incident_id}`} className="text-primary hover:underline" onClick={close}>
                    Ver incidente
                  </Link>
                </Row>
              )}
            </dl>

            {operator && alert.status !== 'resolved' && (
              <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
                {alert.status === 'firing' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="ack-note">Nota do reconhecimento (opcional)</Label>
                    <Textarea id="ack-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} />
                    <p className="text-xs text-muted-foreground">Reconhecer indica que alguém está cuidando, mas o alerta continua ativo até ser resolvido.</p>
                  </div>
                )}
                <DialogFooter>
                  {alert.status === 'firing' && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => ack.mutate({ id: alert.id, note: note.trim() || undefined }, { onSuccess: close })}
                    >
                      <Eye /> Reconhecer
                    </Button>
                  )}
                  <Button disabled={busy} onClick={() => resolve.mutate(alert.id, { onSuccess: close })}>
                    <CheckCheck /> Resolver
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
