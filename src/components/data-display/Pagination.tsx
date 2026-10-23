import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PageMeta } from '@/types/api'

export function Pagination({ meta, onPage }: { meta: PageMeta | undefined; onPage: (page: number) => void }) {
  if (!meta || meta.total === 0) return null
  const from = (meta.page - 1) * meta.per_page + 1
  const to = Math.min(meta.page * meta.per_page, meta.total)
  return (
    <div className="flex flex-col items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row">
      <span className="tabular">
        {from}–{to} de {meta.total}
      </span>
      {meta.total_pages > 1 && (
        <nav className="flex items-center gap-2" aria-label="Paginação">
          <Button size="sm" variant="outline" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
            <ChevronLeft /> Anterior
          </Button>
          <span className="tabular">
            Página {meta.page} de {meta.total_pages}
          </span>
          <Button size="sm" variant="outline" disabled={meta.page >= meta.total_pages} onClick={() => onPage(meta.page + 1)}>
            Próxima <ChevronRight />
          </Button>
        </nav>
      )}
    </div>
  )
}
