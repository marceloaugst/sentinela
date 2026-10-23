import { cn } from '@/lib/utils'

/** Barra de ocupação. A cor segue os limiares de saúde (70% / 90%). */
export function UsageBar({ percent, className, label }: { percent: number | null | undefined; className?: string; label?: string }) {
  const value = percent == null || !Number.isFinite(percent) ? null : Math.min(100, Math.max(0, percent))
  const tone = value == null ? 'bg-muted' : value >= 90 ? 'bg-danger' : value >= 70 ? 'bg-warning' : 'bg-primary'
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value ?? undefined}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${value ?? 0}%` }} />
    </div>
  )
}
