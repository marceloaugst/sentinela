import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHealth } from '../hooks/useSettings'

declare const __APP_VERSION__: string

export function AboutTab() {
  const health = useHealth()
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Sobre o Sentinela</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <div className="grid grid-cols-3 gap-2">
            <dt className="text-muted-foreground">Versão do painel</dt>
            <dd className="col-span-2">{__APP_VERSION__}</dd>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <dt className="text-muted-foreground">Versão da API</dt>
            <dd className="col-span-2">{health.isPending ? 'Consultando…' : health.isError ? 'Indisponível' : health.data.version}</dd>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <dt className="text-muted-foreground">Contrato</dt>
            <dd className="col-span-2">OpenAPI v0.6.0</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
