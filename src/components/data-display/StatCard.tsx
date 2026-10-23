import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const TONES = {
  default: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  neutral: 'bg-muted text-muted-foreground',
} as const

interface Props {
  label: string
  value: ReactNode
  icon: LucideIcon
  tone?: keyof typeof TONES
  hint?: ReactNode
  loading?: boolean
  className?: string
}

export function StatCard({ label, value, icon: Icon, tone = 'default', hint, loading, className }: Props) {
  return (
    <Card className={cn('flex items-start justify-between gap-3 p-4', className)}>
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {loading ? <Skeleton className="h-8 w-16" /> : <p className="tabular truncate text-2xl font-semibold leading-8">{value}</p>}
        {hint && !loading && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', TONES[tone])}>
        <Icon className="size-[18px]" aria-hidden />
      </div>
    </Card>
  )
}
