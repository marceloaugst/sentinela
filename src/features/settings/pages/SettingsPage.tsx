import { PageHeader } from '@/components/data-display/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/features/auth/AuthProvider'
import { useSearchParams } from 'react-router-dom'
import { AboutTab } from '../components/AboutTab'
import { AccountTab } from '../components/AccountTab'
import { AlertRulesTab } from '../components/AlertRulesTab'
import { AuditTab } from '../components/AuditTab'
import { ChannelsTab } from '../components/ChannelsTab'
import { PreferencesTab } from '../components/PreferencesTab'
import { UsersTab } from '../components/UsersTab'

export function SettingsPage() {
  const { can } = useAuth()
  const isAdmin = can('admin')
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab') ?? 'preferences'
  const adminOnly = ['channels', 'users', 'audit']
  const tab = adminOnly.includes(requested) && !isAdmin ? 'preferences' : requested

  return (
    <>
      <PageHeader title="Configurações" description="Preferências, regras vigiadas, canais de notificação e conta." />
      <Tabs value={tab} onValueChange={(t) => setParams({ tab: t }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="rules">Regras vigiadas</TabsTrigger>
          {isAdmin && <TabsTrigger value="channels">Notificações</TabsTrigger>}
          {isAdmin && <TabsTrigger value="users">Usuários</TabsTrigger>}
          {isAdmin && <TabsTrigger value="audit">Auditoria</TabsTrigger>}
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="about">Sobre</TabsTrigger>
        </TabsList>
        <TabsContent value="preferences">
          <PreferencesTab />
        </TabsContent>
        <TabsContent value="rules">
          <AlertRulesTab />
        </TabsContent>
        {isAdmin && (
          <>
            <TabsContent value="channels">
              <ChannelsTab />
            </TabsContent>
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
            <TabsContent value="audit">
              <AuditTab />
            </TabsContent>
          </>
        )}
        <TabsContent value="account">
          <AccountTab />
        </TabsContent>
        <TabsContent value="about">
          <AboutTab />
        </TabsContent>
      </Tabs>
    </>
  )
}
