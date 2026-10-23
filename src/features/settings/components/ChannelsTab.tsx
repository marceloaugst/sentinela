import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/data-display/ConfirmDialog'
import { FormField } from '@/components/data-display/FormField'
import { SEVERITY_LABEL } from '@/components/data-display/status'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PasswordInput } from '@/components/ui/password-input'
import { Input, Select } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { applyApiErrors } from '@/lib/forms'
import type { NotificationChannel } from '@/types/api'
import { useChannels, useCreateChannel, useDeleteChannel, useTestChannel, useUpdateChannel } from '../hooks/useSettings'

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(100, 'Use até 100 caracteres.'),
  bot_token: z.string().trim(),
  chat_id: z.string().trim().min(1, 'Informe o chat ID.'),
  min_severity: z.enum(['info', 'warning', 'critical']),
  is_enabled: z.boolean(),
})
type Values = z.infer<typeof schema>

function ChannelFormDialog({ open, onOpenChange, channel }: { open: boolean; onOpenChange: (o: boolean) => void; channel?: NotificationChannel }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <ChannelForm onOpenChange={onOpenChange} channel={channel} />
      </DialogContent>
    </Dialog>
  )
}

function ChannelForm({ onOpenChange, channel }: { onOpenChange: (o: boolean) => void; channel?: NotificationChannel }) {
  const create = useCreateChannel()
  const update = useUpdateChannel()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: channel?.name ?? '', bot_token: '', chat_id: channel?.chat_id ?? '', min_severity: channel?.min_severity ?? 'info', is_enabled: channel?.is_enabled ?? true } })

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null)
    if (!channel && !v.bot_token) {
      setError('bot_token', { message: 'Informe o token do bot.' })
      return
    }
    try {
      // O token nunca é devolvido pela API; na edição só é enviado se preenchido.
      const token = v.bot_token ? { bot_token: v.bot_token } : {}
      if (channel) await update.mutateAsync({ id: channel.id, name: v.name, chat_id: v.chat_id, min_severity: v.min_severity, is_enabled: v.is_enabled, ...token })
      else await create.mutateAsync({ name: v.name, channel_type: 'telegram', bot_token: v.bot_token, chat_id: v.chat_id, min_severity: v.min_severity, is_enabled: v.is_enabled })
      onOpenChange(false)
    } catch (e) {
      setFormError(applyApiErrors(e, setError, ['name', 'bot_token', 'chat_id', 'min_severity']))
    }
  })

  return (
    <>
        <DialogHeader>
          <DialogTitle>{channel ? 'Editar canal Telegram' : 'Novo canal Telegram'}</DialogTitle>
          <DialogDescription>O chat precisa estar na lista de destinos autorizados no servidor da API.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField id="ch-name" label="Nome" error={errors.name?.message}>
            <Input id="ch-name" {...register('name')} />
          </FormField>
          <FormField id="ch-token" label="Token do bot" error={errors.bot_token?.message} hint={channel ? (channel.has_token ? 'Um token já está salvo. Preencha apenas para substituí-lo.' : 'Nenhum token salvo.') : 'Guardado cifrado e nunca mais exibido.'}>
            <PasswordInput id="ch-token" autoComplete="off" placeholder={channel?.has_token ? '••••••••' : ''} {...register('bot_token')} />
          </FormField>
          <FormField id="ch-chat" label="Chat ID" error={errors.chat_id?.message}>
            <Input id="ch-chat" {...register('chat_id')} />
          </FormField>
          <FormField id="ch-sev" label="Severidade mínima" error={errors.min_severity?.message}>
            <Select id="ch-sev" {...register('min_severity')}>
              <option value="info">Info (tudo)</option>
              <option value="warning">Atenção ou superior</option>
              <option value="critical">Somente crítico</option>
            </Select>
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-[var(--primary)]" {...register('is_enabled')} /> Canal ativo
          </label>
          {formError && (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
    </>
  )
}

/** Visível apenas para administradores. */
export function ChannelsTab() {
  const q = useChannels()
  const test = useTestChannel()
  const del = useDeleteChannel()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<NotificationChannel | undefined>()
  const [removing, setRemoving] = useState<NotificationChannel | null>(null)

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Canais de notificação</CardTitle>
          <CardDescription>Todo aviso (P1 a P4, recuperações e IPs banidos) é enviado por Telegram, com retentativas automáticas. Suba a severidade mínima para receber menos mensagens; o histórico de notificações do painel não é afetado.</CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <Plus /> Novo canal
        </Button>
      </CardHeader>
      {q.isPending ? (
        <LoadingRows rows={2} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState title="Nenhum canal configurado" description="Sem canais, os alertas aparecem só no painel." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>Chat ID</TableHead>
              <TableHead>Severidade mínima</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.data.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.chat_id}</TableCell>
                <TableCell>{SEVERITY_LABEL[c.min_severity]}</TableCell>
                <TableCell>
                  <Badge variant={c.is_enabled ? 'success' : 'neutral'}>{c.is_enabled ? 'Ativo' : 'Inativo'}</Badge>
                  {!c.has_token && <Badge variant="warning" className="ml-1">Sem token</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="size-8" aria-label={`Enviar teste para ${c.name}`} disabled={test.isPending} onClick={() => test.mutate(c.id)}>
                      <Send />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label={`Editar ${c.name}`}
                      onClick={() => {
                        setEditing(c)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 text-danger" aria-label={`Remover ${c.name}`} onClick={() => setRemoving(c)}>
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <ChannelFormDialog open={formOpen} onOpenChange={setFormOpen} channel={editing} />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Remover canal"
        destructive
        confirmLabel="Remover"
        pending={del.isPending}
        description={
          <>
            Remover <strong>{removing?.name}</strong>? As mensagens pendentes dele serão descartadas.
          </>
        }
        onConfirm={() => removing && del.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
      />
    </Card>
  )
}
