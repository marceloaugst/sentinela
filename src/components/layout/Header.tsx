import { ChevronRight, Menu, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConnectionIndicator } from './ConnectionIndicator'
import { describeRoute } from './nav'
import { NotificationsMenu } from './NotificationsMenu'
import { UserMenu } from './UserMenu'

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { title, crumbs } = describeRoute(pathname)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/servers?q=${encodeURIComponent(q)}` : '/servers')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="Abrir menu">
        <Menu />
      </Button>

      <div className="min-w-0 flex-1">
        {crumbs.length > 0 ? (
          <nav aria-label="Trilha de navegação" className="flex items-center gap-1 text-sm">
            {crumbs.map((c, i) => (
              <span key={c.label} className="flex min-w-0 items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />}
                {c.to ? (
                  <Link to={c.to} className="text-muted-foreground hover:text-foreground">
                    {c.label}
                  </Link>
                ) : (
                  <span className="truncate font-medium" aria-current="page">
                    {c.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <p className="truncate text-sm font-semibold">{title}</p>
        )}
      </div>

      <form onSubmit={submit} role="search" className="relative hidden w-64 md:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar servidor…" aria-label="Buscar servidor" className="pl-8" />
      </form>

      <ConnectionIndicator />
      <NotificationsMenu />
      <UserMenu />
    </header>
  )
}
