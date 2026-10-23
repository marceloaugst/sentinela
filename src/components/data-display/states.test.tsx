import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api'
import { AlertStatusBadge } from './status'
import { EmptyState, ErrorState } from './states'
import { Pagination } from './Pagination'

describe('estados de lista', () => {
  it('diferencia falha de comunicação de ausência de dados', () => {
    const { rerender } = render(<EmptyState title="Nenhum alerta ativo" />)
    expect(screen.getByText('Nenhum alerta ativo')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    rerender(<ErrorState error={new ApiError({ message: 'Falhou', isNetwork: true })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('API indisponível')
  })

  it('oferece nova tentativa quando há erro', async () => {
    const onRetry = vi.fn()
    render(<ErrorState error={new ApiError({ message: 'x', status: 500 })} onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('reconhecido e resolvido são estados distintos', () => {
    const { rerender } = render(<AlertStatusBadge status="acknowledged" />)
    expect(screen.getByText('Reconhecido')).toBeInTheDocument()
    expect(screen.queryByText('Resolvido')).not.toBeInTheDocument()
    rerender(<AlertStatusBadge status="resolved" />)
    expect(screen.getByText('Resolvido')).toBeInTheDocument()
  })
})

describe('Pagination', () => {
  it('navega entre páginas e desabilita os limites', async () => {
    const onPage = vi.fn()
    render(<Pagination meta={{ page: 1, per_page: 10, total: 25, total_pages: 3 }} onPage={onPage} />)
    expect(screen.getByText('1–10 de 25')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /próxima/i }))
    expect(onPage).toHaveBeenCalledWith(2)
  })

  it('não renderiza quando não há itens', () => {
    const { container } = render(<Pagination meta={{ page: 1, per_page: 10, total: 0, total_pages: 1 }} onPage={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
