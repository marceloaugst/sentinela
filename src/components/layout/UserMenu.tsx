import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/AuthProvider'

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null
  const first = user.name.split(/\s+/)[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2" aria-label="Menu do usuário">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary" aria-hidden>
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden max-w-28 truncate text-sm sm:inline">{first}</span>
          <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="space-y-0.5">
          <span className="block text-sm font-medium text-foreground">{user.name}</span>
          <span className="block font-normal">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings /> Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            void logout().finally(() => navigate('/login', { replace: true }))
          }}
        >
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
