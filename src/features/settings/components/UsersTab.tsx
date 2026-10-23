import { zodResolver } from '@hookform/resolvers/zod'
import { LogOut, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormField } from '@/components/data-display/FormField'
import { Pagination } from '@/components/data-display/Pagination'
import { EmptyState, ErrorState, LoadingRows } from '@/components/data-display/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PasswordInput } from '@/components/ui/password-input'
import { Input, Select } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/features/auth/AuthProvider'
import { formatDateTime } from '@/lib/format'
import { applyApiErrors } from '@/lib/forms'
import type { User, UserRole } from '@/types/api'
import { useCreateUser, useRevokeSessions, useUpdateUser, useUsers } from '../hooks/useSettings'

const ROLE_LABEL: Record<UserRole, string> = { viewer: 'Visualizador', operator: 'Operador', admin: 'Administrador' }

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.'),
  email: z.string().trim().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
  role: z.enum(['viewer', 'operator', 'admin']),
  is_active: z.boolean(),
  // 12–128 caracteres (política da API). Na edição, vazio = manter a senha atual.
  password: z.string().refine((v) => v === '' || (v.length >= 12 && v.length <= 128), 'A senha deve ter de 12 a 128 caracteres.'),
})
type Values = z.infer<typeof schema>

function UserFormDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user?: User }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <UserForm onOpenChange={onOpenChange} user={user} />
      </DialogContent>
    </Dialog>
  )
}

function UserForm({ onOpenChange, user }: { onOpenChange: (o: boolean) => void; user?: User }) {
  const create = useCreateUser()
  const update = useUpdateUser()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: user?.name ?? '', email: user?.email ?? '', role: user?.role ?? 'viewer', is_active: user?.is_active ?? true, password: '' } })

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null)
    if (!user && !v.password) {
      setError('password', { message: 'Informe a senha inicial.' })
      return
    }
    try {
      if (user) await update.mutateAsync({ id: user.id, name: v.name, email: v.email, role: v.role, is_active: v.is_active, ...(v.password ? { password: v.password } : {}) })
      else await create.mutateAsync({ name: v.name, email: v.email, role: v.role, password: v.password })
      onOpenChange(false)
    } catch (e) {
      setFormError(applyApiErrors(e, setError, ['name', 'email', 'role', 'is_active', 'password']))
    }
  })

  return (
    <>
        <DialogHeader>
          <DialogTitle>{user ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
          <DialogDescription>{user ? 'Desativar ou redefinir a senha encerra todas as sessões do usuário.' : 'Não há cadastro público: apenas administradores criam usuários.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField id="u-name" label="Nome" error={errors.name?.message}>
            <Input id="u-name" {...register('name')} />
          </FormField>
          <FormField id="u-email" label="E-mail" error={errors.email?.message}>
            <Input id="u-email" type="email" autoComplete="off" {...register('email')} />
          </FormField>
          <FormField id="u-role" label="Papel" error={errors.role?.message}>
            <Select id="u-role" {...register('role')}>
              {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="u-pass" label={user ? 'Nova senha (opcional)' : 'Senha inicial'} error={errors.password?.message} hint="12 a 128 caracteres; sem senhas comuns e sem conter o e-mail ou o nome.">
            <PasswordInput id="u-pass" autoComplete="new-password" {...register('password')} />
          </FormField>
          {user && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4 accent-[var(--primary)]" {...register('is_active')} /> Conta ativa
            </label>
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
              {isSubmitting ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
    </>
  )
}

/** Visível apenas para administradores. */
export function UsersTab() {
  const { user: me } = useAuth()
  const [page, setPage] = useState(1)
  const q = useUsers({ page, per_page: 20 })
  const revoke = useRevokeSessions()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | undefined>()

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Papéis: visualizador (leitura) &lt; operador (alertas, serviços, regras) &lt; administrador (tudo).</CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined)
            setFormOpen(true)
          }}
        >
          <Plus /> Novo usuário
        </Button>
      </CardHeader>
      {q.isPending ? (
        <LoadingRows rows={3} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : q.data.data.length === 0 ? (
        <EmptyState title="Nenhum usuário" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Usuário</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-medium">
                      {u.name} {u.id === me?.id && <span className="text-xs font-normal text-muted-foreground">(você)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell>{ROLE_LABEL[u.role]}</TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'success' : 'neutral'}>{u.is_active ? 'Ativo' : 'Desativado'}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{u.last_login_at ? formatDateTime(u.last_login_at) : 'Nunca'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        aria-label={`Editar ${u.name}`}
                        onClick={() => {
                          setEditing(u)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8" aria-label={`Encerrar sessões de ${u.name}`} disabled={revoke.isPending} onClick={() => revoke.mutate(u.id)}>
                        <LogOut />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination meta={q.data.meta} onPage={setPage} />
        </>
      )}
      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />
    </Card>
  )
}
