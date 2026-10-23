import { get } from '@/lib/api'
import type { Envelope, Incident, IncidentDetail, IncidentEvent, IncidentStatus, PageParams, Paginated, Priority, Severity } from '@/types/api'

export interface IncidentListParams extends PageParams {
  status?: IncidentStatus
  severity?: Severity
  priority?: Priority
  server_id?: string
  from?: string
  to?: string
}

export const incidentsService = {
  list: (params: IncidentListParams, signal?: AbortSignal) => get<Paginated<Incident>>('/incidents', params, signal),
  get: (id: string, signal?: AbortSignal) => get<Envelope<IncidentDetail>>(`/incidents/${id}`, undefined, signal).then((r) => r.data),
  events: (id: string, signal?: AbortSignal) =>
    get<Envelope<IncidentEvent[]>>(`/incidents/${id}/events`, undefined, signal).then((r) => r.data),
}
