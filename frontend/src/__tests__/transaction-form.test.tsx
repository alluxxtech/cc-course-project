import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionsPage from '../app/(dashboard)/transactions/page'
import type { Category } from '../types/category'

jest.mock('../hooks/use-transactions', () => ({
  useTransactions: jest.fn(),
}))
jest.mock('../hooks/use-categories', () => ({
  useCategories: jest.fn(),
}))
jest.mock('../hooks/use-debounce', () => ({
  useDebounce: (v: string) => v,
}))

const mockCategory: Category = {
  id: 'cat-1',
  userId: 'user-1',
  name: 'Food',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
}

function setupMocks() {
  const { useTransactions } =
    jest.requireMock<typeof import('../hooks/use-transactions')>(
      '../hooks/use-transactions',
    )
  const { useCategories } =
    jest.requireMock<typeof import('../hooks/use-categories')>(
      '../hooks/use-categories',
    )

  ;(useTransactions as jest.Mock).mockReturnValue({
    state: { status: 'success', data: [] },
    reload: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  })
  ;(useCategories as jest.Mock).mockReturnValue({
    state: { status: 'success', data: [mockCategory] },
    create: jest.fn(),
    rename: jest.fn(),
    remove: jest.fn(),
  })
}

describe('TransactionModal — form validation', () => {
  beforeEach(() => {
    setupMocks()
  })

  it('shows "Title is required" and "Enter a positive amount" when submitted blank', async () => {
    const user = userEvent.setup()
    render(<TransactionsPage />)

    await user.click(screen.getByText('+ Add transaction'))
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Enter a positive amount')).toBeInTheDocument()
  })

  it('shows "Select a category" when category is cleared before submit', async () => {
    const user = userEvent.setup()
    render(<TransactionsPage />)

    await user.click(screen.getByText('+ Add transaction'))

    // categoryId defaults to categories[0].id — clear it to trigger the error
    const categorySelect = screen.getByDisplayValue('Food')
    fireEvent.change(categorySelect, { target: { value: '' } })

    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => {
      expect(screen.getByText('Select a category')).toBeInTheDocument()
    })
  })

  it('does not submit when validation fails — create callback is not called', async () => {
    const { useTransactions } =
      jest.requireMock<typeof import('../hooks/use-transactions')>(
        '../hooks/use-transactions',
      )
    const mockCreate = jest.fn()
    ;(useTransactions as jest.Mock).mockReturnValue({
      state: { status: 'success', data: [] },
      reload: jest.fn(),
      create: mockCreate,
      update: jest.fn(),
      remove: jest.fn(),
    })

    const user = userEvent.setup()
    render(<TransactionsPage />)

    await user.click(screen.getByText('+ Add transaction'))
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(mockCreate).not.toHaveBeenCalled()
  })
})
