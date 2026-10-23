import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { RealtimeProvider } from '@/features/realtime/RealtimeProvider'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const KEY = 'sentinela.sidebar.collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, collapsed ? '1' : '0')
    } catch {
      /* ignora */
    }
  }, [collapsed])

  return (
    <RealtimeProvider>
      <div className="flex min-h-dvh">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
          Ir para o conteúdo
        </a>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onOpenMenu={() => setMobileOpen(true)} />
          <main id="conteudo" className="mx-auto w-full max-w-[1500px] flex-1 space-y-6 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </RealtimeProvider>
  )
}
