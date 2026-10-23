import { MutationCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { isApiError } from '@/lib/api'

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: { silent?: boolean }
  }
}

export function errorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 403 && error.code === 'FORBIDDEN') return 'Você não tem permissão para realizar esta ação.'
    if (error.status === 429) return `Muitas requisições. Tente novamente${error.retryAfter ? ` em ${error.retryAfter}s` : ' em instantes'}.`
    return error.message
  }
  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        refetchOnWindowFocus: true,
        retry: (count, error) => {
          // Só vale insistir em falhas de rede/5xx; 4xx não muda ao repetir.
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false
          return count < 2
        },
      },
    },
    // Falhas de mutação viram toast, exceto quando o formulário trata o erro (meta.silent).
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (mutation.meta?.silent) return
        if (isApiError(error) && error.isCanceled) return
        toast.error(errorMessage(error))
      },
    }),
  })
}
