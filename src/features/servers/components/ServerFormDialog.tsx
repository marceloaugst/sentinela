import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormField } from '@/components/data-display/FormField'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Select } from '@/components/ui/input'
import { applyApiErrors } from '@/lib/forms'
import type { AdminStatus, Server } from '@/types/api'
import { useCreateServer, useUpdateServer } from '../hooks/useServers'

export const serverSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(100, 'Use até 100 caracteres.'),
  hostname: z
    .string()
    .trim()
    .min(1, 'Informe o hostname ou IP.')
    .max(255, 'Use até 255 caracteres.')
    .regex(/^[^\s/]+$/, 'Informe apenas o hostname ou IP, sem espaços ou barras.'),
  status: z.enum(['active', 'maintenance', 'disabled']),
})
type Values = z.infer<typeof serverSchema>

const STATUS_OPTIONS: { value: AdminStatus; label: string }[] = [
  { value: 'active', label: 'Ativo' },
  { value: 'maintenance', label: 'Em manutenção' },
  { value: 'disabled', label: 'Desativado' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Presente = edição; ausente = cadastro. */
  server?: Server
  onCreated?: (server: Server) => void
}

export function ServerFormDialog({ open, onOpenChange, server, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <ServerForm onOpenChange={onOpenChange} server={server} onCreated={onCreated} />
      </DialogContent>
    </Dialog>
  )
}

function ServerForm({ onOpenChange, server, onCreated }: Omit<Props, 'open'>) {
  const create = useCreateServer()
  const update = useUpdateServer()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(serverSchema), defaultValues: { name: server?.name ?? '', hostname: server?.hostname ?? '', status: server?.status ?? 'active' } })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      if (server) {
        await update.mutateAsync({ id: server.id, name: values.name, hostname: values.hostname, status: values.status })
      } else {
        const created = await create.mutateAsync({ name: values.name, hostname: values.hostname })
        onCreated?.(created)
      }
      onOpenChange(false)
    } catch (e) {
      setFormError(applyApiErrors(e, setError, ['name', 'hostname', 'status']))
    }
  })

  return (
    <>
        <DialogHeader>
          <DialogTitle>{server ? 'Editar servidor' : 'Cadastrar servidor'}</DialogTitle>
          <DialogDescription>
            {server ? 'Altere os dados do servidor.' : 'Depois de cadastrar, gere uma credencial para instalar o agente no servidor.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField id="srv-name" label="Nome" error={errors.name?.message}>
            <Input id="srv-name" autoFocus aria-invalid={!!errors.name} aria-describedby={errors.name ? 'srv-name-error' : undefined} {...register('name')} />
          </FormField>
          <FormField id="srv-host" label="Hostname ou IP" error={errors.hostname?.message}>
            <Input id="srv-host" placeholder="vps01.exemplo.com" aria-invalid={!!errors.hostname} aria-describedby={errors.hostname ? 'srv-host-error' : undefined} {...register('hostname')} />
          </FormField>
          {server && (
            <FormField id="srv-status" label="Estado administrativo" error={errors.status?.message} hint="Em manutenção ou desativado, o servidor deixa de gerar alertas de disponibilidade.">
              <Select id="srv-status" {...register('status')}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
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
              {isSubmitting ? 'Salvando…' : server ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
    </>
  )
}
