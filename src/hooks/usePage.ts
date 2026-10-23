import { useCallback, useState } from 'react'

/**
 * Página atual de uma listagem que volta para 1 sempre que `resetKey` muda
 * (filtros, busca, ordenação), sem precisar de efeito para isso.
 */
export function usePage(resetKey: string) {
  const [state, setState] = useState({ key: resetKey, page: 1 })
  const page = state.key === resetKey ? state.page : 1
  const setPage = useCallback((p: number) => setState({ key: resetKey, page: p }), [resetKey])
  return [page, setPage] as const
}
