import { zodResolver } from '@hookform/resolvers/zod'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/data-display/FormField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuth } from '@/features/auth/AuthProvider'
import { authService } from '@/features/auth/services/authService'
import { formatDateTime } from '@/lib/format'
import { applyApiErrors } from '@/lib/forms'

const schema = z
  .object({
    current_password: z.string().min(1, 'Informe a senha atual.'),
    new_password: z.string().min(12, 'A senha deve ter ao menos 12 caracteres.').max(128, 'A senha deve ter no máximo 128 caracteres.'),
    confirm: z.string(),
  })
  .refine((v) => v.new_password === v.confirm, { path: ['confirm'], message: 'As senhas não coincidem.' })
  .refine((v) => v.new_password !== v.current_password, { path: ['new_password'], message: 'A nova senha deve ser diferente da atual.' })
type Values = z.infer<typeof schema>

const ROLE_LABEL = { viewer: 'Visualizador', operator: 'Operador', admin: 'Administrador' } as const

export function AccountTab() {
  const { user, logoutAll } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { current_password: '', new_password: '', confirm: '' } })

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null)
    try {
      await authService.changePassword(v.current_password, v.new_password)
      toast.success('Senha alterada. As outras sessões foram encerradas.')
      reset()
    } catch (e) {
      setFormError(applyApiErrors(e, setError, ['current_password', 'new_password']))
    }
  })

  if (!user) return null
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            {[
              ['Nome', user.name],
              ['E-mail', user.email],
              ['Papel', ROLE_LABEL[user.role]],
              ['Último acesso', user.last_login_at ? formatDateTime(user.last_login_at) : '—'],
              ['Senha alterada em', formatDateTime(user.password_changed_at)],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="col-span-2 break-words">{v}</dd>
              </div>
            ))}
          </dl>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void logoutAll()}>
            <LogOut /> Encerrar sessão em todos os dispositivos
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>Ao trocar, as outras sessões são encerradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <FormField id="pw-current" label="Senha atual" error={errors.current_password?.message}>
              <PasswordInput id="pw-current" autoComplete="current-password" {...register('current_password')} />
            </FormField>
            <FormField id="pw-new" label="Nova senha" error={errors.new_password?.message} hint="12 a 128 caracteres; sem senhas comuns e sem conter seu e-mail ou nome.">
              <PasswordInput id="pw-new" autoComplete="new-password" {...register('new_password')} />
            </FormField>
            <FormField id="pw-confirm" label="Confirmar nova senha" error={errors.confirm?.message}>
              <PasswordInput id="pw-confirm" autoComplete="new-password" {...register('confirm')} />
            </FormField>
            {formError && (
              <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {formError}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Alterar senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
