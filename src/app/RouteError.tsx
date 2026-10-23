import { TriangleAlert } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'

// Falha ao baixar o chunk de uma página lazy (deploy novo, dev server reiniciado, rede).
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i

export function RouteError() {
  const error = useRouteError()
  const chunk = error instanceof Error && CHUNK_ERROR.test(error.message)

  let title = 'Algo deu errado'
  let description = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? 'Página não encontrada' : `Erro ${error.status}`
    description = error.statusText || description
  } else if (chunk) {
    title = 'Não foi possível carregar esta página'
    description = 'Uma versão nova da aplicação pode estar disponível ou a conexão falhou. Recarregue para tentar novamente.'
  }

  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-danger/15 text-danger">
        <TriangleAlert className="size-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={() => window.location.reload()}>
          Recarregar página
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  )
}
