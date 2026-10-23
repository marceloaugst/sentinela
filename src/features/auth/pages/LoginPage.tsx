import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { FormField } from '@/components/data-display/FormField'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import { Input } from '@/components/ui/input'
import { isApiError } from '@/lib/api'
import { useAuth } from '../AuthProvider'

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail.').email('E-mail inválido.'),
  password: z.string().min(1, 'Informe a senha.'),
})
type LoginValues = z.infer<typeof loginSchema>

function loginErrorMessage(e: unknown): string {
  if (!isApiError(e)) return 'Não foi possível entrar. Tente novamente.'
  if (e.code === 'LOGIN_LOCKED') return `Muitas tentativas. Tente novamente${e.retryAfter ? ` em ${Math.ceil(e.retryAfter / 60)} min` : ' mais tarde'}.`
  if (e.status === 429) return `Limite de requisições atingido. Aguarde${e.retryAfter ? ` ${e.retryAfter}s` : ' alguns instantes'}.`
  if (e.status === 401) return 'E-mail ou senha incorretos.'
  if (e.isNetwork) return 'API indisponível. Verifique sua conexão e o certificado do servidor.'
  return e.message
}

export function LoginPage() {
  const { status, login } = useAuth()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const from = (location.state as { from?: string } | null)?.from ?? '/'
  if (status === 'authenticated') return <Navigate to={from} replace />

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values.email, values.password)
    } catch (e) {
      setFormError(loginErrorMessage(e))
    }
  })

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <Logo className="justify-center" />
        <Card className="space-y-5 p-6">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Entrar</h1>
            <p className="text-sm text-muted-foreground">Acesse o painel de monitoramento.</p>
          </div>
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <FormField id="email" label="E-mail" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="username" autoFocus aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} {...register('email')} />
            </FormField>
            <FormField id="password" label="Senha" error={errors.password?.message}>
              <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} {...register('password')} />
            </FormField>
            {formError && (
              <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {formError}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />}
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
