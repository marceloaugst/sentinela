import { get } from '@/lib/api'
import type { PageParams, Paginated, Service, ServiceStatus, ServiceType } from '@/types/api'

export interface ServiceListParams extends PageParams {
  q?: string
  server_id?: string
  status?: ServiceStatus
  service_type?: ServiceType
}

export const servicesService = {
  list: (params: ServiceListParams, signal?: AbortSignal) => get<Paginated<Service>>('/services', params, signal),
}
