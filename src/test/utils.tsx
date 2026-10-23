import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { PreferencesProvider } from '@/hooks/usePreferences'
import type { PageMeta, User } from '@/types/api'

export function makeUser(role: User['role'] = 'admin'): User {
  return {
    id: 'u1',
    name: 'Ada Admin',
    email: 'ada@example.com',
    role,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    last_login_at: null,
    password_changed_at: '2026-01-01T00:00:00Z',
  }
}

export function meta(total: number, page = 1, per_page = 10): PageMeta {
  return { page, per_page, total, total_pages: Math.max(1, Math.ceil(total / per_page)) }
}

export function renderApp(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false }, mutations: { retry: false } } })
  return {
    client,
    ...render(
      <PreferencesProvider>
        <QueryClientProvider client={client}>
          <TooltipProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </PreferencesProvider>,
    ),
  }
}
