import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

/** Mantenha relativo (mesma origem): o cookie de sessão é SameSite=Lax. */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export interface ApiErrorDetail {
  field?: string
  message: string
}

/** Erro normalizado — toda falha HTTP/rede chega à UI neste formato. */
export class ApiError extends Error {
  status: number
  code: string
  details: ApiErrorDetail[]
  retryAfter: number | null
  isNetwork: boolean
  isCanceled: boolean

  constructor(init: {
    message: string
    status?: number
    code?: string
    details?: ApiErrorDetail[]
    retryAfter?: number | null
    isNetwork?: boolean
    isCanceled?: boolean
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status ?? 0
    this.code = init.code ?? 'UNKNOWN'
    this.details = init.details ?? []
    this.retryAfter = init.retryAfter ?? null
    this.isNetwork = init.isNetwork ?? false
    this.isCanceled = init.isCanceled ?? false
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError
}

// O token CSRF fica só em memória (nunca em localStorage).
let csrfToken: string | null = null
export function setCsrfToken(token: string | null) {
  csrfToken = token
}

let onUnauthorized: (() => void) | null = null
/** Registrado pelo AuthProvider para reagir a 401 (sessão expirada/revogada). */
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn
}

const MUTATING = new Set(['post', 'patch', 'put', 'delete'])

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  if (csrfToken && MUTATING.has((config.method ?? 'get').toLowerCase())) {
    config.headers.set('X-CSRF-Token', csrfToken)
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (axios.isCancel(error)) {
      return Promise.reject(new ApiError({ message: 'Requisição cancelada', isCanceled: true }))
    }
    if (error instanceof AxiosError) {
      if (!error.response) {
        const timeout = error.code === 'ECONNABORTED'
        return Promise.reject(
          new ApiError({
            message: timeout ? 'A API demorou demais para responder.' : 'Não foi possível se comunicar com a API.',
            code: timeout ? 'TIMEOUT' : 'NETWORK_ERROR',
            isNetwork: true,
          }),
        )
      }
      const { status, data, headers, config } = error.response
      const body = data as { error?: { code?: string; message?: string; details?: ApiErrorDetail[] } } | undefined
      const retry = Number.parseInt(String(headers['retry-after'] ?? ''), 10)
      const apiError = new ApiError({
        message: body?.error?.message ?? error.message,
        status,
        code: body?.error?.code,
        details: body?.error?.details,
        retryAfter: Number.isFinite(retry) ? retry : null,
      })
      // 401 em /auth/login e /auth/me é esperado (credencial errada / sem sessão).
      const url = config?.url ?? ''
      if (status === 401 && !url.startsWith('/auth/login') && !url.startsWith('/auth/me')) onUnauthorized?.()
      return Promise.reject(apiError)
    }
    return Promise.reject(error)
  },
)

export async function get<T>(url: string, params?: object, signal?: AbortSignal): Promise<T> {
  const res = await http.get<T>(url, { params: clean(params), signal })
  return res.data
}

export async function send<T>(method: 'post' | 'patch' | 'delete', url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.request<T>({ method, url, data: body, ...config })
  return res.data
}

/** Remove chaves indefinidas/vazias dos parâmetros de query. */
export function clean(params?: object): Record<string, unknown> | undefined {
  if (!params) return undefined
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v
  }
  return out
}
