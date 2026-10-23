import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, KeyRound, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/data-display/ConfirmDialog'
import { FormField } from '@/components/data-display/FormField'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'
import type { Credential, IssuedCredential } from '@/types/api'
import { useCredentials, useIssueCredential, useRevokeCredential } from '../hooks/useServers'

const schema = z.object({
  expires_in_days: z.string().regex(/^\d*$/, 'Use apenas números inteiros.'),
  replace: z.boolean(),
})
type Values = z.infer<typeof schema>

/** O contrato não define o formato do objeto emitido: procuramos o valor "snt_…" (token do agente). */
export function extractToken(issued: IssuedCredential | undefined): string | null {
  if (!issued) return null
  const seen = new Set<unknown>()
  const walk = (v: unknown, depth: number): string | null => {
    if (typeof v === 'string') return v.startsWith('snt_') ? v : null
    if (!v || typeof v !== 'object' || depth > 3 || seen.has(v)) return null
    seen.add(v)
    for (const child of Object.values(v)) {
      const found = walk(child, depth + 1)
      if (found) return found
    }
    return null
  }
  return walk(issued, 0)
}

function credentialState(c: Credential): { label: string; variant: 'success' | 'neutral' | 'warning' } {
  if (c.revoked_at) return { label: 'Revogada', variant: 'neutral' }
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return { label: 'Expirada', variant: 'warning' }
  return { label: 'Ativa', variant: 'success' }
}

export function CredentialsPanel({ serverId }: { serverId: string }) {
  const list = useCredentials(serverId, true)
  const issue = useIssueCredential(serverId)
  const revoke = useRevokeCredential(serverId)
  const [token, setToken] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<Credential | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { expires_in_days: '', replace: false } })

  const onSubmit = handleSubmit(async (v) => {
    const issued = await issue.mutateAsync({
      expires_in_days: v.expires_in_days ? Number(v.expires_in_days) : undefined,
      replace: v.replace || undefined,
    })
    const t = extractToken(issued)
    if (t) setToken(t)
    else toast.warning('Credencial emitida, mas o token não veio na resposta. Revogue-a e emita outra.')
  })

  const copy = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      toast.success('Token copiado.')
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto manualmente.')
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Credenciais do agente</CardTitle>
          <CardDescription>O agente instalado no servidor usa uma credencial para enviar métricas.</CardDescription>
        </CardHeader>
        {list.isPending ? (
          <LoadingRows rows={2} />
        ) : list.isError ? (
          <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={<KeyRound className="size-5" />} title="Nenhuma credencial emitida" description="Gere uma credencial para conectar o agente a este servidor." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Estado</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Último uso</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.map((c) => {
                const st = credentialState(c)
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(c.created_at)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{c.expires_at ? formatDateTime(c.expires_at) : 'Não expira'}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{c.last_used_at ? formatDateTime(c.last_used_at) : 'Nunca'}</TableCell>
                    <TableCell>
                      {!c.revoked_at && (
                        <Button size="sm" variant="ghost" className="text-danger" onClick={() => setRevoking(c)}>
                          Revogar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerar credencial</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <FormField id="cred-days" label="Validade (dias)" error={errors.expires_in_days?.message} hint="Vazio = não expira.">
              <Input id="cred-days" inputMode="numeric" {...register('expires_in_days')} />
            </FormField>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" {...register('replace')} />
              <span>
                Revogar as credenciais ativas anteriores
                <span className="block text-xs text-muted-foreground">O agente que usa a credencial antiga deixará de enviar dados.</span>
              </span>
            </label>
            <Button type="submit" className="w-full" disabled={issue.isPending}>
              <KeyRound /> {issue.isPending ? 'Gerando…' : 'Gerar credencial'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* O token só existe nesta resposta: nada é gravado em storage. */}
      <Dialog open={token !== null} onOpenChange={(o) => !o && setToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Token do agente</DialogTitle>
            <DialogDescription>Copie agora e guarde com segurança. Por segurança, ele não será exibido novamente.</DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            Se perder o token, será preciso revogar a credencial e gerar outra.
          </div>
          <code className="block break-all rounded-md border bg-muted p-3 font-mono text-xs" data-testid="agent-token">
            {token}
          </code>
          <DialogFooter>
            <Button variant="outline" onClick={() => void copy()}>
              <Copy /> Copiar
            </Button>
            <Button onClick={() => setToken(null)}>Já guardei o token</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(o) => !o && setRevoking(null)}
        title="Revogar credencial"
        destructive
        confirmLabel="Revogar"
        pending={revoke.isPending}
        description="O agente que usa esta credencial deixará de conseguir enviar métricas."
        onConfirm={() => revoking && revoke.mutate(revoking.id, { onSuccess: () => setRevoking(null) })}
      />
    </div>
  )
}
