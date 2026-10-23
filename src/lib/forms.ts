import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { isApiError } from '@/lib/api'

/**
 * Aplica `error.details[].field` da API (422) nos campos do formulário.
 * Devolve a mensagem geral quando não há detalhe por campo.
 */
export function applyApiErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, known: string[]): string | null {
  if (!isApiError(error)) return 'Ocorreu um erro inesperado.'
  let applied = 0
  for (const d of error.details) {
    // Campos aninhados (ex.: "config.interval_seconds") mapeiam para o campo plano do formulário.
    const field = d.field?.replace(/^config\./, '')
    if (field && known.includes(field)) {
      setError(field as Path<T>, { type: 'server', message: d.message })
      applied++
    }
  }
  return applied > 0 ? null : error.message
}
