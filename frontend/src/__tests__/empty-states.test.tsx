import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoriesPage from '../app/(dashboard)/categories/page'
import TransactionsPage from '../app/(dashboard)/transactions/page'

jest.mock('../hooks/use-categories', () => ({
  useCategories: jest.fn(),
}))
jest.mock('../hooks/use-transactions', () => ({
  useTransactions: jest.fn(),
}))
jest.mock('../hooks/use-debounce', () => ({
  useDebounce: (v: string) => v,
}))

function mockCategories(data: unknown) {
  const { useCategories } =
    jest.requireMock<typeof import('../hooks/use-categories')>(
      '../hooks/use-categories',
    )
  ;(useCategories as jest.Mock).mockReturnValue(data)
}

function mockTransactions(data: unknown) {
  const { useTransactions } =
    jest.requireMock<typeof import('../hooks/use-transactions')>(
      '../hooks/use-transactions',
    )
  ;(useTransactions as jest.Mock).mockReturnValue(data)
}

const noOpCategory = { create: jest.fn(), rename: jest.fn(), remove: jest.fn() }
const noOpTransaction = { reload: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() }

describe('Empty states', () => {
  describe('CategoriesPage', () => {
    it('shows "No categories yet" when the list is empty', () => {
      mockCategories({
        state: { status: 'success', data: [] },
        ...noOpCategory,
      })

      render(<CategoriesPage />)

      expect(screen.getByText('No categories yet')).toBeInTheDocument()
    })

    it('shows a loading spinner while categories are being fetched', () => {
      mockCategories({
        state: { status: 'loading' },
        ...noOpCategory,
      })

      const { container } = render(<CategoriesPage />)

      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('TransactionsPage', () => {
    beforeEach(() => {
      mockCategories({
        state: { status: 'success', data: [] },
        ...noOpCategory,
      })
    })

    it('shows "No transactions yet" when list is empty and no filters are active', () => {
      mockTransactions({
        state: { status: 'success', data: [] },
        ...noOpTransaction,
      })

      render(<TransactionsPage />)

      expect(screen.getByText('No transactions yet')).toBeInTheDocument()
    })

    it('shows "No results for this search" when search is active but list is empty', async () => {
      mockTransactions({
        state: { status: 'success', data: [] },
        ...noOpTransaction,
      })

      const user = userEvent.setup()
      render(<TransactionsPage />)

      const searchInput = screen.getByPlaceholderText('Search by title or notes…')
      await user.type(searchInput, 'coffee')

      expect(screen.getByText('No results for this search')).toBeInTheDocument()
    })
  })
})
