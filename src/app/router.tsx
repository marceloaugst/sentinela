import { createBrowserRouter, Link, type RouteObject } from 'react-router-dom'
import { RouteError } from '@/app/RouteError'
import { EmptyState } from '@/components/data-display/states'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'

function NotFound() {
  return (
    <EmptyState
      title="Página não encontrada"
      description="O endereço informado não existe."
      action={
        <Button asChild size="sm">
          <Link to="/">Voltar ao início</Link>
        </Button>
      }
    />
  )
}

// Páginas carregadas sob demanda: mantém o bundle inicial pequeno.
const lazyPage = (load: () => Promise<{ [k: string]: React.ComponentType }>, name: string): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await load())[name] }),
})

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteError />,
        children: [
          { index: true, ...lazyPage(() => import('@/features/dashboard/pages/DashboardPage'), 'DashboardPage') },
          { path: 'servers', ...lazyPage(() => import('@/features/servers/pages/ServersPage'), 'ServersPage') },
          { path: 'servers/:id', ...lazyPage(() => import('@/features/servers/pages/ServerDetailPage'), 'ServerDetailPage') },
          { path: 'metrics', ...lazyPage(() => import('@/features/metrics/pages/MetricsPage'), 'MetricsPage') },
          { path: 'services', ...lazyPage(() => import('@/features/services/pages/ServicesPage'), 'ServicesPage') },
          { path: 'alerts', ...lazyPage(() => import('@/features/alerts/pages/AlertsPage'), 'AlertsPage') },
          { path: 'logs', ...lazyPage(() => import('@/features/logs/pages/LogsPage'), 'LogsPage') },
          { path: 'incidents', ...lazyPage(() => import('@/features/incidents/pages/IncidentsPage'), 'IncidentsPage') },
          { path: 'incidents/:id', ...lazyPage(() => import('@/features/incidents/pages/IncidentDetailPage'), 'IncidentDetailPage') },
          { path: 'notifications', ...lazyPage(() => import('@/features/notifications/pages/NotificationsPage'), 'NotificationsPage') },
          { path: 'settings', ...lazyPage(() => import('@/features/settings/pages/SettingsPage'), 'SettingsPage') },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
