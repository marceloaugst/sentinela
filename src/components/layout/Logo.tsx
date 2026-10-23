import { cn } from '@/lib/utils'

export function Logo({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--primary)" />
        <path d="M16 6l8 3v6c0 5-3.4 8.6-8 11-4.6-2.4-8-6-8-11V9l8-3z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        <path d="M11 16h3l1.5-3 2 6L19 16h2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">Sentinela</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Observabilidade</p>
        </div>
      )}
    </div>
  )
}
