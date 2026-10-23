import { useQueryClient } from '@tanstack/react-query'
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isApiError, setCsrfToken, setUnauthorizedHandler } from '@/lib/api'
import type { User, UserRole } from '@/types/api'
import { authService } from './services/authService'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error'

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  /** Mensagem do erro de restauração de sessão (API fora do ar). */
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  retry: () => void
  /** A UI só esconde o que o papel não permite; quem garante é a API. */
  can: (role: UserRole) => boolean
}

const RANK: Record<UserRole, number> = { viewer: 0, operator: 1, admin: 2 }

export function roleAtLeast(user: User | null, role: UserRole): boolean {
  return !!user && RANK[user.role] >= RANK[role]
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const clearSession = useCallback(() => {
    setCsrfToken(null)
    setUser(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    const controller = new AbortController()
    authService
      .me(controller.signal)
      .then((s) => {
        setUser(s.user)
        setStatus('authenticated')
      })
      .catch((e: unknown) => {
        if (isApiError(e) && e.isCanceled) return
        if (isApiError(e) && e.status === 401) {
          setStatus('anonymous')
        } else {
          setError(e instanceof Error ? e.message : 'Falha ao contatar a API.')
          setStatus('error')
        }
      })
    return () => controller.abort()
  }, [attempt])

  // 401 em qualquer requisição = sessão expirada ou revogada.
  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  const login = useCallback(async (email: string, password: string) => {
    const session = await authService.login(email, password)
    setUser(session.user)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const logoutAll = useCallback(async () => {
    try {
      await authService.logoutAll()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const retry = useCallback(() => {
    setStatus('loading')
    setAttempt((n) => n + 1)
  }, [])
  const can = useCallback((role: UserRole) => roleAtLeast(user, role), [user])

  const value = useMemo(
    () => ({ status, user, error, login, logout, logoutAll, retry, can }),
    [status, user, error, login, logout, logoutAll, retry, can],
  )
  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth() {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
