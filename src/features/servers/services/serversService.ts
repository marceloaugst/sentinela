import { get, send } from '@/lib/api'
import type {
  AdminStatus,
  Alert,
  ConnectionStatus,
  Credential,
  Disk,
  Discovery,
  DockerAction,
  Envelope,
  Incident,
  IssuedCredential,
  PageParams,
  Paginated,
  ProcessAction,
  ProcessSort,
  Server,
  ServerDocker,
  ServerProcesses,
  ServerSummary,
  Service,
  ServiceCommand,
} from '@/types/api'

export interface ServerListParams extends PageParams {
  q?: string
  status?: AdminStatus
  connection?: ConnectionStatus
  sort?: 'name' | 'hostname' | 'status' | 'created_at' | 'last_seen_at'
  order?: 'asc' | 'desc'
}

export interface ProcessListParams {
  sort?: ProcessSort
  limit?: number
  q?: string
}

export interface ServerInput {
  name: string
  hostname: string
}

export const serversService = {
  list: (params: ServerListParams, signal?: AbortSignal) => get<Paginated<Server>>('/servers', params, signal),
  get: (id: string, signal?: AbortSignal) => get<Envelope<Server>>(`/servers/${id}`, undefined, signal).then((r) => r.data),
  summary: (id: string, signal?: AbortSignal) =>
    get<Envelope<ServerSummary>>(`/servers/${id}/summary`, undefined, signal).then((r) => r.data),
  disks: (id: string, signal?: AbortSignal) => get<Envelope<Disk[]>>(`/servers/${id}/disks`, undefined, signal).then((r) => r.data),
  services: (id: string, signal?: AbortSignal) => get<Paginated<Service>>(`/servers/${id}/services`, { per_page: 100 }, signal),
  discovery: (id: string, signal?: AbortSignal) => get<Envelope<Discovery>>(`/servers/${id}/discovery`, undefined, signal).then((r) => r.data),
  docker: (id: string, signal?: AbortSignal) => get<Envelope<ServerDocker>>(`/servers/${id}/docker`, undefined, signal).then((r) => r.data),
  dockerAction: (id: string, containerId: string, action: DockerAction) =>
    send<Envelope<ServiceCommand>>('post', `/servers/${id}/docker/containers/${containerId}/actions`, { action }).then((r) => r.data),
  processes: (id: string, params: ProcessListParams, signal?: AbortSignal) =>
    get<Envelope<ServerProcesses>>(`/servers/${id}/processes`, params, signal).then((r) => r.data),
  processAction: (id: string, pid: number, startTime: number, action: ProcessAction) =>
    send<Envelope<ServiceCommand>>('post', `/servers/${id}/processes/${pid}/actions`, { action, start_time: startTime }).then((r) => r.data),
  commands: (id: string, limit: number, signal?: AbortSignal) =>
    get<Envelope<ServiceCommand[]>>(`/servers/${id}/service-commands`, { limit }, signal).then((r) => r.data),
  command: (commandId: string, signal?: AbortSignal) =>
    get<Envelope<ServiceCommand>>(`/service-commands/${commandId}`, undefined, signal).then((r) => r.data),
  incidents: (id: string, params: PageParams, signal?: AbortSignal) => get<Paginated<Incident>>(`/servers/${id}/incidents`, params, signal),
  alerts: (id: string, params: PageParams, signal?: AbortSignal) => get<Paginated<Alert>>('/alerts', { ...params, server_id: id }, signal),

  create: (input: ServerInput) => send<Envelope<Server>>('post', '/servers', input).then((r) => r.data),
  update: (id: string, input: Partial<ServerInput> & { status?: AdminStatus }) =>
    send<Envelope<Server>>('patch', `/servers/${id}`, input).then((r) => r.data),
  remove: (id: string) => send<void>('delete', `/servers/${id}`),

  credentials: (id: string, signal?: AbortSignal) =>
    get<Envelope<Credential[]>>(`/servers/${id}/agent-credentials`, undefined, signal).then((r) => r.data),
  issueCredential: (id: string, body: { expires_in_days?: number; replace?: boolean }) =>
    send<Envelope<IssuedCredential>>('post', `/servers/${id}/agent-credentials`, body).then((r) => r.data),
  revokeCredential: (id: string, credentialId: string) => send<void>('delete', `/servers/${id}/agent-credentials/${credentialId}`),
}
