import { QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { PreferencesProvider, usePreferences } from '@/hooks/usePreferences'
import { createQueryClient } from './queryClient'

function ThemedToaster() {
  const { theme } = usePreferences()
  return <Toaster theme={theme} position="bottom-right" richColors closeButton />
}

export function Providers({ children, client }: { children: ReactNode; client?: ReturnType<typeof createQueryClient> }) {
  const [queryClient] = useState(() => client ?? createQueryClient())
  return (
    <PreferencesProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>{children}</AuthProvider>
        </TooltipProvider>
        <ThemedToaster />
      </QueryClientProvider>
    </PreferencesProvider>
  )
}
