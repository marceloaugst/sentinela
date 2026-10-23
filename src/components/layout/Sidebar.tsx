import * as DialogPrimitive from '@radix-ui/react-dialog'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { useAuth } from '@/features/auth/AuthProvider'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { NAV_ITEMS } from './nav'

const ROLE_LABEL = { viewer: 'Visualizador', operator: 'Operador', admin: 'Administrador' } as const

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

function Nav({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Principal" className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
        const link = (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            aria-label={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        )
        return collapsed ? (
          <Tooltip key={to} content={label}>
            {link}
          </Tooltip>
        ) : (
          link
        )
      })}
    </nav>
  )
}

function Profile({ collapsed }: { collapsed?: boolean }) {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div className={cn('flex items-center gap-3 border-t p-3', collapsed && 'justify-center')}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary" aria-hidden>
        {initials(user.name)}
      </div>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</p>
        </div>
      )}
    </div>
  )
}

interface Props {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileOpenChange }: Props) {
  return (
    <>
      {/* Desktop / tablet largo */}
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex',
          collapsed ? 'w-[68px]' : 'w-60',
        )}
      >
        <div className={cn('flex h-14 items-center border-b px-4', collapsed && 'justify-center px-0')}>
          <Logo collapsed={collapsed} />
        </div>
        <Nav collapsed={collapsed} />
        <div className={cn('px-3 pb-2', collapsed && 'flex justify-center')}>
          <Button variant="ghost" size={collapsed ? 'icon' : 'sm'} onClick={onToggle} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} className={cn(!collapsed && 'w-full justify-start text-muted-foreground')}>
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            {!collapsed && 'Recolher'}
          </Button>
        </div>
        <Profile collapsed={collapsed} />
      </aside>

      {/* Mobile: menu em gaveta */}
      <DialogPrimitive.Root open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60 lg:hidden" />
          <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col border-r bg-sidebar shadow-xl lg:hidden">
            <DialogPrimitive.Title className="sr-only">Menu de navegação</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Navegue entre as páginas da aplicação.</DialogPrimitive.Description>
            <div className="flex h-14 items-center border-b px-4">
              <Logo />
            </div>
            <Nav onNavigate={() => onMobileOpenChange(false)} />
            <Profile />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
