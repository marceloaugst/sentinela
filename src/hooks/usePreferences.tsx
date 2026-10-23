import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'
/** Intervalo de atualização em segundos; 0 = manual (sem polling). */
export type RefreshSeconds = 0 | 5 | 10 | 15 | 30 | 60 | 120

export const REFRESH_OPTIONS: { value: RefreshSeconds; label: string }[] = [
  { value: 5, label: 'A cada 5 segundos (tempo real)' },
  { value: 10, label: 'A cada 10 segundos' },
  { value: 15, label: 'A cada 15 segundos' },
  { value: 30, label: 'A cada 30 segundos' },
  { value: 60, label: 'A cada 1 minuto' },
  { value: 120, label: 'A cada 2 minutos' },
  { value: 0, label: 'Somente manual' },
]

interface Preferences {
  theme: Theme
  refreshSeconds: RefreshSeconds
  /** Versão do esquema salvo; permite migrar o intervalo padrão sem perder o tema. */
  v?: number
}

interface PreferencesContextValue extends Preferences {
  setTheme: (t: Theme) => void
  setRefreshSeconds: (s: RefreshSeconds) => void
}

const STORAGE_KEY = 'sentinela.preferences'
const VERSION = 2
const DEFAULTS: Preferences = { theme: 'dark', refreshSeconds: 5, v: VERSION }

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Preferences>
    const valid = REFRESH_OPTIONS.some((o) => o.value === parsed.refreshSeconds)
    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      // Preferências anteriores à v2 guardavam o antigo padrão (30s): adota o novo.
      refreshSeconds: valid && parsed.v === VERSION ? (parsed.refreshSeconds as RefreshSeconds) : DEFAULTS.refreshSeconds,
      v: VERSION,
    }
  } catch {
    return DEFAULTS
  }
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(load)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefs.theme === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      /* armazenamento indisponível: preferência vale só nesta sessão */
    }
  }, [prefs])

  const setTheme = useCallback((theme: Theme) => setPrefs((p) => ({ ...p, theme })), [])
  const setRefreshSeconds = useCallback((refreshSeconds: RefreshSeconds) => setPrefs((p) => ({ ...p, refreshSeconds })), [])

  const value = useMemo(() => ({ ...prefs, setTheme, setRefreshSeconds }), [prefs, setTheme, setRefreshSeconds])
  return <PreferencesContext value={value}>{children}</PreferencesContext>
}

export function usePreferences() {
  const ctx = use(PreferencesContext)
  if (!ctx) throw new Error('usePreferences deve ser usado dentro de PreferencesProvider')
  return ctx
}

/**
 * Intervalo de polling do TanStack Query (ms) ou `false` se manual.
 * `factor` permite dados mais lentos (ex.: listas) que métricas. O Query pausa o polling
 * com a aba oculta (refetchIntervalInBackground = false, o padrão).
 */
export function useRefetchInterval(factor = 1): number | false {
  const { refreshSeconds } = usePreferences()
  return refreshSeconds === 0 ? false : refreshSeconds * 1000 * factor
}
