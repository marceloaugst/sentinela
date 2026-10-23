import type { ReactNode } from 'react'
import { EmptyState, ErrorState } from '@/components/data-display/states'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartLine } from 'lucide-react'

interface Props {
  title: string
  description?: string
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  empty?: boolean
  emptyText?: string
  height?: number
  actions?: ReactNode
  children: ReactNode
}

/** Moldura de gráfico com os quatro estados: carregando, erro, vazio e dados. */
export function ChartCard({ title, description, loading, error, onRetry, empty, emptyText, height = 220, actions, children }: Props) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton style={{ height }} className="w-full" />
        ) : error ? (
          <div style={{ minHeight: height }} className="flex items-center justify-center">
            <ErrorState error={error} onRetry={onRetry} />
          </div>
        ) : empty ? (
          <div style={{ minHeight: height }} className="flex items-center justify-center">
            <EmptyState icon={<ChartLine className="size-5" />} title="Sem dados no período" description={emptyText ?? 'Nenhuma amostra foi recebida neste intervalo.'} />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
