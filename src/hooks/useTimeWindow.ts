import { useState } from 'react'

export const WINDOWS = [
  { key: 'all', label: 'Todo o histórico', ms: 0 },
  { key: '24h', label: 'Últimas 24 horas', ms: 24 * 3600_000 },
  { key: '7d', label: 'Últimos 7 dias', ms: 7 * 24 * 3600_000 },
  { key: '30d', label: 'Últimos 30 dias', ms: 30 * 24 * 3600_000 },
] as const

export type WindowKey = (typeof WINDOWS)[number]['key']

function fromFor(key: WindowKey): string | undefined {
  const ms = WINDOWS.find((w) => w.key === key)?.ms ?? 0
  // Arredonda ao minuto: a chave da query não muda a cada render.
  return ms ? new Date(Math.floor((Date.now() - ms) / 60_000) * 60_000).toISOString() : undefined
}

/** Filtro de período para listagens: o `from` é fixado quando o usuário escolhe a janela. */
export function useTimeWindow() {
  const [state, setState] = useState<{ key: WindowKey; from: string | undefined }>({ key: 'all', from: undefined })
  const setWindow = (key: WindowKey) => setState({ key, from: fromFor(key) })
  return { window: state.key, from: state.from, setWindow }
}
