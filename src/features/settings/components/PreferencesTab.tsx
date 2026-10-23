import { Moon, Sun } from 'lucide-react'
import { FormField } from '@/components/data-display/FormField'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { REFRESH_OPTIONS, usePreferences, type RefreshSeconds, type Theme } from '@/hooks/usePreferences'
import { cn } from '@/lib/utils'

const THEMES: { value: Theme; label: string; icon: typeof Moon }[] = [
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'light', label: 'Claro', icon: Sun },
]

export function PreferencesTab() {
  const { theme, setTheme, refreshSeconds, setRefreshSeconds } = usePreferences()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Salvo apenas neste navegador.</CardDescription>
        </CardHeader>
        <CardContent>
          <div role="radiogroup" aria-label="Tema" className="grid grid-cols-2 gap-3">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                onClick={() => setTheme(value)}
                className={cn('flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-accent', theme === value && 'border-primary bg-primary/10 text-primary')}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Atualização dos dados</CardTitle>
          <CardDescription>Frequência de consulta à API. Eventos em tempo real (SSE) atualizam a tela imediatamente, independente deste intervalo. O polling pausa quando a aba está oculta.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormField id="refresh" label="Intervalo">
            <Select id="refresh" value={refreshSeconds} onChange={(e) => setRefreshSeconds(Number(e.target.value) as RefreshSeconds)}>
              {REFRESH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </FormField>
        </CardContent>
      </Card>
    </div>
  )
}
