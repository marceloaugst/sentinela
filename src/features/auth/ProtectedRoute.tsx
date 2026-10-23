import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ErrorState } from '@/components/data-display/states'
import { useAuth } from './AuthProvider'

/**
 * Protege as rotas internas. A checagem aqui é só de experiência de uso:
 * a autorização de verdade é aplicada pela API (401/403).
 */
export function ProtectedRoute() {
  const { status, error, retry } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground" role="status" aria-label="Carregando sessão">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <ErrorState error={new Error(error ?? 'Falha ao contatar a API.')} onRetry={retry} />
      </div>
    )
  }
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}
