import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, get, http, send, setCsrfToken, setUnauthorizedHandler } from './api'

type Reply = { status: number; data?: unknown; headers?: Record<string, string> }

function mockServer(handler: (config: InternalAxiosRequestConfig) => Reply | 'network') {
  const seen: InternalAxiosRequestConfig[] = []
  const adapter: AxiosAdapter = (config) => {
    seen.push(config)
    const r = handler(config)
    if (r === 'network') return Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config))
    const response = { status: r.status, statusText: '', data: r.data ?? {}, headers: r.headers ?? {}, config }
    if (r.status >= 400) return Promise.reject(new AxiosError('fail', 'ERR_BAD_REQUEST', config, null, response))
    return Promise.resolve(response)
  }
  http.defaults.adapter = adapter
  return seen
}

describe('cliente HTTP', () => {
  beforeEach(() => setCsrfToken(null))
  afterEach(() => setUnauthorizedHandler(null))

  it('envia X-CSRF-Token apenas em requisições que alteram estado', async () => {
    const seen = mockServer(() => ({ status: 200, data: { data: 1 } }))
    setCsrfToken('tok123')
    await get('/servers')
    await send('post', '/alerts/1/resolve')
    await send('delete', '/servers/1')
    expect(seen[0]!.headers.get('X-CSRF-Token')).toBeFalsy()
    expect(seen[1]!.headers.get('X-CSRF-Token')).toBe('tok123')
    expect(seen[2]!.headers.get('X-CSRF-Token')).toBe('tok123')
  })

  it('envia cookies (withCredentials) e descarta parâmetros vazios', async () => {
    const seen = mockServer(() => ({ status: 200 }))
    await get('/servers', { q: '', status: undefined, page: 2 })
    expect(seen[0]!.withCredentials).toBe(true)
    expect(seen[0]!.params).toEqual({ page: 2 })
  })

  it('normaliza o envelope de erro da API (422 com detalhes por campo)', async () => {
    mockServer(() => ({ status: 422, data: { error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos', details: [{ field: 'name', message: 'obrigatório' }] } } }))
    const err = await get('/x').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 422, code: 'VALIDATION_ERROR', details: [{ field: 'name', message: 'obrigatório' }] })
  })

  it('expõe Retry-After em 429', async () => {
    mockServer(() => ({ status: 429, data: { error: { code: 'LOGIN_LOCKED', message: 'x', details: [] } }, headers: { 'retry-after': '120' } }))
    const err = (await get('/x').catch((e: unknown) => e)) as ApiError
    expect(err.retryAfter).toBe(120)
    expect(err.code).toBe('LOGIN_LOCKED')
  })

  it('marca falha de rede como isNetwork', async () => {
    mockServer(() => 'network')
    const err = (await get('/x').catch((e: unknown) => e)) as ApiError
    expect(err.isNetwork).toBe(true)
  })

  it('aciona o handler de sessão expirada em 401, exceto no login', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    mockServer(() => ({ status: 401, data: { error: { code: 'UNAUTHENTICATED', message: 'x', details: [] } } }))
    await get('/servers').catch(() => undefined)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    await send('post', '/auth/login', {}).catch(() => undefined)
    await get('/auth/me').catch(() => undefined)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })
})
