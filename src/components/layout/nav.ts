import { Activity, Bell, Gauge, LayoutDashboard, ScrollText, ServerIcon, Settings, ShieldAlert, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/servers', label: 'Servidores', icon: ServerIcon },
  { to: '/metrics', label: 'Métricas', icon: Activity },
  { to: '/services', label: 'Serviços', icon: Gauge },
  { to: '/alerts', label: 'Alertas', icon: Bell },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/incidents', label: 'Incidentes', icon: ShieldAlert },
  { to: '/settings', label: 'Configurações', icon: Settings },
]

const TITLES: Record<string, string> = {
  '': 'Visão geral',
  servers: 'Servidores',
  metrics: 'Métricas',
  services: 'Serviços',
  alerts: 'Alertas',
  logs: 'Logs',
  incidents: 'Incidentes',
  notifications: 'Notificações',
  settings: 'Configurações',
}

/** Título da página e trilha de navegação a partir do caminho atual. */
export function describeRoute(pathname: string): { title: string; crumbs: { label: string; to?: string }[] } {
  const [root = '', child] = pathname.split('/').filter(Boolean)
  const base = TITLES[root] ?? 'Sentinela'
  if (!child) return { title: base, crumbs: [] }
  const detail = root === 'servers' ? 'Detalhes do servidor' : root === 'incidents' ? 'Detalhes do incidente' : 'Detalhes'
  return { title: detail, crumbs: [{ label: base, to: `/${root}` }, { label: detail }] }
}
