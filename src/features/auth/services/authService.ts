import { get, send, setCsrfToken } from '@/lib/api'
import type { Envelope, SessionInfo } from '@/types/api'

export const authService = {
  async login(email: string, password: string) {
    const res = await send<Envelope<SessionInfo>>('post', '/auth/login', { email, password })
    setCsrfToken(res.data.csrf_token)
    return res.data
  },
  /** Restaura a sessão após recarregar a página (devolve também um csrf_token novo). */
  async me(signal?: AbortSignal) {
    const res = await get<Envelope<SessionInfo>>('/auth/me', undefined, signal)
    setCsrfToken(res.data.csrf_token)
    return res.data
  },
  async logout() {
    await send<void>('post', '/auth/logout')
    setCsrfToken(null)
  },
  async logoutAll() {
    await send<void>('post', '/auth/logout-all')
    setCsrfToken(null)
  },
  async changePassword(current_password: string, new_password: string) {
    const res = await send<Envelope<{ csrf_token: string }>>('post', '/auth/change-password', { current_password, new_password })
    setCsrfToken(res.data.csrf_token)
  },
}
