import { render, screen } from '@testing-library/react'
import LoginPage from '../app/login/page'

jest.mock('../lib/api', () => ({
  BACKEND_URL: 'http://test-backend',
  apiFetch: jest.fn(),
}))

describe('LoginPage', () => {
  it('renders the Google OAuth button', () => {
    render(<LoginPage />)
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('renders the GitHub OAuth button', () => {
    render(<LoginPage />)
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument()
  })

  it('Google button links to backend /auth/google', () => {
    render(<LoginPage />)
    const link = screen.getByText('Continue with Google').closest('a')
    expect(link).toHaveAttribute('href', 'http://test-backend/auth/google')
  })

  it('GitHub button links to backend /auth/github', () => {
    render(<LoginPage />)
    const link = screen.getByText('Continue with GitHub').closest('a')
    expect(link).toHaveAttribute('href', 'http://test-backend/auth/github')
  })
})
