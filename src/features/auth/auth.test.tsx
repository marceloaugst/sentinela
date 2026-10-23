import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api'
import { makeUser, renderApp } from '@/test/utils'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { authService } from './services/authService'
import { extractToken } from '@/features/servers/components/CredentialsPanel'

vi.mock('./services/authService', () => ({
  authService: { me: vi.fn(), login: vi.fn(), logout: vi.fn(), logoutAll: vi.fn(), changePassword: vi.fn() },
}))
const mocked = vi.mocked(authService)

const session = (role: 'admin' | 'viewer' = 'admin') => ({ user: makeUser(role), via: 'session' as const, csrf_token: 't', expires_at: '', idle_expires_at: '' })

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<p>Área interna</p>} />
      </Route>
    </Routes>
  )
}

beforeEach(() => vi.resetAllMocks())

describe('rotas protegidas', () => {
  it('redireciona para o login quando não há sessão (401)', async () => {
    mocked.me.mockRejectedValue(new ApiError({ message: 'x', status: 401 }))
    renderApp(<App />)
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByText('Área interna')).not.toBeInTheDocument()
  })

  it('libera o conteúdo com sessão válida', async () => {
    mocked.me.mockResolvedValue(session())
    renderApp(<App />)
    expect(await screen.findByText('Área interna')).toBeInTheDocument()
  })

  it('mostra erro (não login) quando a API está fora do ar', async () => {
    mocked.me.mockRejectedValue(new ApiError({ message: 'sem rede', isNetwork: true }))
    renderApp(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível|indisponível/i)
    expect(screen.queryByRole('heading', { name: 'Entrar' })).not.toBeInTheDocument()
  })
})

describe('login', () => {
  beforeEach(() => {
    mocked.me.mockRejectedValue(new ApiError({ message: 'x', status: 401 }))
  })

  it('valida o formulário antes de chamar a API', async () => {
    renderApp(<App />, { route: '/login' })
    await userEvent.click(await screen.findByRole('button', { name: /entrar/i }))
    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(mocked.login).not.toHaveBeenCalled()
  })

  it('exibe mensagem para credenciais inválidas', async () => {
    mocked.login.mockRejectedValue(new ApiError({ message: 'x', status: 401, code: 'INVALID_CREDENTIALS' }))
    renderApp(<App />, { route: '/login' })
    await userEvent.type(await screen.findByLabelText('E-mail'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument()
  })

  it('informa o tempo de bloqueio (429 LOGIN_LOCKED)', async () => {
    mocked.login.mockRejectedValue(new ApiError({ message: 'x', status: 429, code: 'LOGIN_LOCKED', retryAfter: 600 }))
    renderApp(<App />, { route: '/login' })
    await userEvent.type(await screen.findByLabelText('E-mail'), 'a@b.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'x')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByText(/10 min/)).toBeInTheDocument()
  })

  it('entra e vai para a área interna', async () => {
    mocked.login.mockResolvedValue(session())
    renderApp(<App />, { route: '/login' })
    await userEvent.type(await screen.findByLabelText('E-mail'), 'ada@example.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-correta-123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => expect(screen.getByText('Área interna')).toBeInTheDocument())
    expect(mocked.login).toHaveBeenCalledWith('ada@example.com', 'senha-correta-123')
  })
})

describe('extractToken', () => {
  it('encontra o token do agente em qualquer formato de resposta', () => {
    expect(extractToken({ token: 'snt_abc123' })).toBe('snt_abc123')
    expect(extractToken({ id: '1', credential: { value: 'snt_xyz' } })).toBe('snt_xyz')
    expect(extractToken({ id: '1' })).toBeNull()
    expect(extractToken(undefined)).toBeNull()
  })
})
