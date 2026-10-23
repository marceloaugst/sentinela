import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '@/features/auth/services/authService'
import { ApiError } from '@/lib/api'
import { makeUser, meta, renderApp } from '@/test/utils'
import type { Server } from '@/types/api'
import { serversService } from '../services/serversService'
import { ServersPage } from './ServersPage'

vi.mock('@/features/auth/services/authService', () => ({ authService: { me: vi.fn() } }))
vi.mock('../services/serversService', () => ({
  serversService: { list: vi.fn(), summary: vi.fn(), remove: vi.fn(), create: vi.fn(), update: vi.fn() },
}))
const svc = vi.mocked(serversService)

const server = (over: Partial<Server> = {}): Server => ({
  id: 's1',
  name: 'web-01',
  hostname: 'web01.example.com',
  operating_system: 'Ubuntu',
  operating_system_version: '24.04',
  architecture: 'amd64',
  agent_version: '0.1.0',
  status: 'active',
  connection_status: 'online',
  last_seen_at: new Date().toISOString(),
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
})

const summary = {
  server: server(),
  latest: {
    collected_at: '',
    received_at: '',
    cpu_usage_percent: 42,
    cpu_count: 4,
    load_average: { m1: 1, m5: 1, m15: 1 },
    memory: { total_bytes: 100, used_bytes: 60, available_bytes: 40, used_percent: 60, swap_total_bytes: 0, swap_used_bytes: 0 },
    uptime_seconds: 100,
    network: null,
  },
  disks: [{ mount_point: '/', filesystem: 'ext4', total_bytes: 100, used_bytes: 80, available_bytes: 20, used_percent: 80, collected_at: '' }],
  alerts: { active: 0, critical: 0, warning: 0, info: 0 },
  incidents: { open: 0 },
  services: { total: 0, up: 0, down: 0, degraded: 0, unknown: 0 },
  availability: { window_seconds: 0, percent: null },
}

function page(role: 'admin' | 'viewer' = 'admin') {
  vi.mocked(authService.me).mockResolvedValue({ user: makeUser(role), via: 'session', csrf_token: 't', expires_at: '', idle_expires_at: '' })
  return renderApp(
    <Routes>
      <Route path="/servers" element={<ServersPage />} />
    </Routes>,
    { route: '/servers' },
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  svc.summary.mockResolvedValue(summary)
})

describe('ServersPage', () => {
  it('mostra carregamento e depois a tabela com métricas do servidor', async () => {
    svc.list.mockResolvedValue({ data: [server()], meta: meta(1) })
    page()
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
    const row = (await screen.findByRole('link', { name: 'web-01' })).closest('tr')!
    expect(within(row).getByText('Online')).toBeInTheDocument()
    expect(await within(row).findByText('42%')).toBeInTheDocument()
    expect(within(row).getByText('80%')).toBeInTheDocument() // volume mais ocupado
  })

  it('exibe estado vazio sem filtros e orienta o cadastro', async () => {
    svc.list.mockResolvedValue({ data: [], meta: meta(0) })
    page()
    expect(await screen.findByText('Nenhum servidor cadastrado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cadastrar servidor/i })).toBeInTheDocument()
  })

  it('exibe erro de API — distinto de lista vazia — e permite tentar de novo', async () => {
    svc.list.mockRejectedValueOnce(new ApiError({ message: 'sem rede', isNetwork: true }))
    page()
    expect(await screen.findByRole('alert')).toHaveTextContent('API indisponível')
    expect(screen.queryByText('Nenhum servidor cadastrado')).not.toBeInTheDocument()
    svc.list.mockResolvedValue({ data: [server()], meta: meta(1) })
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
    expect(await screen.findByRole('link', { name: 'web-01' })).toBeInTheDocument()
  })

  it('envia filtros e ordenação para a API e volta à página 1', async () => {
    svc.list.mockResolvedValue({ data: [server()], meta: meta(25) })
    page()
    await screen.findByRole('link', { name: 'web-01' })

    await userEvent.click(screen.getByRole('button', { name: /próxima/i }))
    await waitFor(() => expect(svc.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), expect.anything()))

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por conexão'), 'offline')
    await waitFor(() => expect(svc.list).toHaveBeenLastCalledWith(expect.objectContaining({ connection: 'offline', page: 1 }), expect.anything()))

    await userEvent.click(screen.getByRole('button', { name: /última comunicação/i }))
    await waitFor(() => expect(svc.list).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'last_seen_at', order: 'asc' }), expect.anything()))
  })

  it('pesquisa por nome/hostname (com debounce)', async () => {
    svc.list.mockResolvedValue({ data: [server()], meta: meta(1) })
    page()
    await screen.findByRole('link', { name: 'web-01' })
    await userEvent.type(screen.getByLabelText('Buscar servidores'), 'db')
    await waitFor(() => expect(svc.list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'db' }), expect.anything()))
  })

  it('esconde ações administrativas de quem não é admin', async () => {
    svc.list.mockResolvedValue({ data: [server()], meta: meta(1) })
    page('viewer')
    await screen.findByRole('link', { name: 'web-01' })
    expect(screen.queryByRole('button', { name: /cadastrar servidor/i })).not.toBeInTheDocument()
  })

  it('valida o formulário de cadastro e mostra erros por campo', async () => {
    svc.list.mockResolvedValue({ data: [], meta: meta(0) })
    page()
    await userEvent.click(await screen.findByRole('button', { name: /cadastrar servidor/i }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await within(dialog).findByText('Informe o nome.')).toBeInTheDocument()
    expect(within(dialog).getByText('Informe o hostname ou IP.')).toBeInTheDocument()
    expect(svc.create).not.toHaveBeenCalled()
  })

  it('aplica o erro 422 da API ao campo correspondente', async () => {
    svc.list.mockResolvedValue({ data: [], meta: meta(0) })
    svc.create.mockRejectedValue(new ApiError({ message: 'Dados inválidos', status: 422, code: 'VALIDATION_ERROR', details: [{ field: 'name', message: 'Nome já em uso' }] }))
    page()
    await userEvent.click(await screen.findByRole('button', { name: /cadastrar servidor/i }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'web-01')
    await userEvent.type(within(dialog).getByLabelText('Hostname ou IP'), '10.0.0.1')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))
    expect(await within(dialog).findByText('Nome já em uso')).toBeInTheDocument()
  })
})
