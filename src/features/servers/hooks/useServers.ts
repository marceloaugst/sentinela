import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { isApiError } from '@/lib/api'
import { useRefetchInterval } from '@/hooks/usePreferences'
import type { DockerAction, ProcessAction, Server } from '@/types/api'
import { serversService, type ProcessListParams, type ServerInput, type ServerListParams } from '../services/serversService'

export function useServers(params: ServerListParams, options?: { enabled?: boolean }) {
  const refetchInterval = useRefetchInterval(1)
  return useQuery({
    queryKey: ['servers', 'list', params],
    queryFn: ({ signal }) => serversService.list(params, signal),
    refetchInterval,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}

export function useServer(id: string | undefined) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['servers', id, 'detail'],
    queryFn: ({ signal }) => serversService.get(id!, signal),
    enabled: !!id,
    refetchInterval,
  })
}

export function useServerSummary(id: string | undefined) {
  const refetchInterval = useRefetchInterval()
  return useQuery({
    queryKey: ['servers', id, 'summary'],
    queryFn: ({ signal }) => serversService.summary(id!, signal),
    enabled: !!id,
    refetchInterval,
  })
}

/** CPU/RAM/disco da lista: o contrato só os expõe por servidor (`/summary`), então buscamos por linha. */
export function useServerSummaries(servers: Server[]) {
  const refetchInterval = useRefetchInterval()
  const results = useQueries({
    queries: servers.map((s) => ({
      queryKey: ['servers', s.id, 'summary'],
      queryFn: ({ signal }: { signal: AbortSignal }) => serversService.summary(s.id, signal),
      // Servidor sem comunicação não tem amostra recente: evita requisições inúteis.
      enabled: s.connection_status !== 'unknown',
      refetchInterval,
    })),
  })
  return Object.fromEntries(servers.map((s, i) => [s.id, results[i]!]))
}

export function useServerServices(id: string) {
  return useQuery({
    queryKey: ['services', 'by-server', id],
    queryFn: ({ signal }) => serversService.services(id, signal),
    refetchInterval: useRefetchInterval(),
  })
}

export function useServerDiscovery(id: string) {
  return useQuery({
    queryKey: ['services', 'discovery', id],
    queryFn: ({ signal }) => serversService.discovery(id, signal),
    refetchInterval: 30_000,
  })
}

export function useServerDocker(id: string | undefined) {
  return useQuery({
    queryKey: ['servers', id, 'docker'],
    queryFn: ({ signal }) => serversService.docker(id!, signal),
    enabled: !!id,
    refetchInterval: 60_000,
  })
}

export function useServerProcesses(id: string, params: ProcessListParams) {
  return useQuery({
    queryKey: ['servers', id, 'processes', params],
    queryFn: ({ signal }) => serversService.processes(id, params, signal),
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useProcessAction(serverId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pid, startTime, action }: { pid: number; startTime: number; action: ProcessAction }) =>
      serversService.processAction(serverId, pid, startTime, action),
    onError: (error) => {
      // O processo mudou ou já há pedido em andamento: recarrega para refletir a realidade.
      if (isApiError(error) && (error.status === 404 || error.status === 409 || error.status === 422)) {
        void qc.invalidateQueries({ queryKey: ['servers', serverId, 'processes'] })
        void qc.invalidateQueries({ queryKey: ['servers', serverId, 'commands'] })
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['servers', serverId, 'commands'] }),
  })
}

export function useServerCommands(id: string, limit = 20) {
  return useQuery({
    queryKey: ['servers', id, 'commands', limit],
    queryFn: ({ signal }) => serversService.commands(id, limit, signal),
  })
}

const TERMINAL = new Set(['succeeded', 'failed', 'expired'])

/** Acompanha um comando (polling a cada ~2 s) até ele terminar. */
export function useServiceCommand(commandId: string | undefined) {
  return useQuery({
    queryKey: ['service-commands', commandId],
    queryFn: ({ signal }) => serversService.command(commandId!, signal),
    enabled: !!commandId,
    refetchInterval: (q) => (q.state.data && TERMINAL.has(q.state.data.status) ? false : 2000),
  })
}

export function useDockerAction(serverId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ containerId, action }: { containerId: string; action: DockerAction }) =>
      serversService.dockerAction(serverId, containerId, action),
    onError: (error) => {
      // O estado mudou ou há comando em andamento: recarrega a lista para refletir a realidade.
      if (isApiError(error) && (error.status === 404 || error.status === 409 || error.status === 422)) {
        void qc.invalidateQueries({ queryKey: ['servers', serverId, 'docker'] })
        void qc.invalidateQueries({ queryKey: ['servers', serverId, 'commands'] })
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['servers', serverId, 'commands'] }),
  })
}

export function useServerIncidents(id: string, page: number) {
  return useQuery({
    queryKey: ['incidents', 'by-server', id, page],
    queryFn: ({ signal }) => serversService.incidents(id, { page, per_page: 10 }, signal),
    refetchInterval: useRefetchInterval(),
    placeholderData: keepPreviousData,
  })
}

export function useServerAlerts(id: string, page: number) {
  return useQuery({
    queryKey: ['alerts', 'by-server', id, page],
    queryFn: ({ signal }) => serversService.alerts(id, { page, per_page: 10 }, signal),
    refetchInterval: useRefetchInterval(),
    placeholderData: keepPreviousData,
  })
}

export function useCredentials(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['servers', id, 'credentials'],
    queryFn: ({ signal }) => serversService.credentials(id, signal),
    enabled,
  })
}

export function useCreateServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ServerInput) => serversService.create(input),
    meta: { silent: true },
    onSuccess: () => {
      toast.success('Servidor cadastrado.')
      void qc.invalidateQueries({ queryKey: ['servers'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<ServerInput> & { status?: Server['status'] }) => serversService.update(id, input),
    meta: { silent: true },
    onSuccess: () => {
      toast.success('Servidor atualizado.')
      void qc.invalidateQueries({ queryKey: ['servers'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => serversService.remove(id),
    onSuccess: () => {
      toast.success('Servidor removido.')
      void qc.invalidateQueries({ queryKey: ['servers'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useIssueCredential(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { expires_in_days?: number; replace?: boolean }) => serversService.issueCredential(id, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['servers', id, 'credentials'] }),
  })
}

export function useRevokeCredential(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (credentialId: string) => serversService.revokeCredential(id, credentialId),
    onSuccess: () => {
      toast.success('Credencial revogada.')
      void qc.invalidateQueries({ queryKey: ['servers', id, 'credentials'] })
    },
  })
}
