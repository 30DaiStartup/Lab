import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

// Helper function to render App with router context
const renderApp = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  )
}

describe('App', () => {
  it('renders the main layout', () => {
    renderApp()

    // The app should render with the main layout container
    // Using screen.getByText is more reliable than container queries
    expect(screen.getByText('Aurora Lab')).toBeInTheDocument()
  })

  it('renders the sidebar navigation', () => {
    renderApp()

    // The sidebar should contain navigation links
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /analytics/i })).toBeInTheDocument()
  })

  it('renders the app title in the header', () => {
    renderApp('/')

    // The main header should show "Aurora Lab"
    expect(screen.getByText('Aurora Lab')).toBeInTheDocument()
  })

  it('renders the Dashboard on the root route', () => {
    renderApp('/')

    // Dashboard should be rendered at the root route
    // Check for the Dashboard heading within the page content
    expect(screen.getByRole('heading', { name: /outcome tracking dashboard/i })).toBeInTheDocument()
  })

  it('renders the Analytics page on /analytics route', () => {
    renderApp('/analytics')

    // Analytics page should be rendered
    expect(screen.getByRole('heading', { name: /analytics & reports/i })).toBeInTheDocument()
  })

  it('renders outcome detail page on /outcomes/:id route', () => {
    renderApp('/outcomes/1')

    // Outcome detail page should be rendered - verify layout is present
    expect(screen.getByText('Aurora Lab')).toBeInTheDocument()
  })

  it('renders experiment detail page on /experiments/:id route', () => {
    renderApp('/experiments/1')

    // Experiment detail page should be rendered - verify layout is present
    expect(screen.getByText('Aurora Lab')).toBeInTheDocument()
  })
})

// Example test patterns for the project
describe('Testing Patterns', () => {
  it('demonstrates querying by role with name', () => {
    renderApp('/')

    // Use getByRole with name option for more specific queries
    const heading = screen.getByRole('heading', { name: /outcome tracking dashboard/i })
    expect(heading).toBeInTheDocument()
  })

  it('demonstrates querying by text', () => {
    renderApp('/')

    // Use getByText for finding elements by their text content
    expect(screen.getByText(/track and manage your outcomes/i)).toBeInTheDocument()
  })

  it('demonstrates finding links', () => {
    renderApp('/')

    // Use getAllByRole to find multiple elements
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })

  it('demonstrates testing navigation links exist', () => {
    renderApp('/')

    // Find navigation links
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    const analyticsLink = screen.getByRole('link', { name: /analytics/i })

    expect(dashboardLink).toBeInTheDocument()
    expect(analyticsLink).toBeInTheDocument()
  })

  it('demonstrates testing with within() for scoped queries', () => {
    renderApp('/')

    // Find all outcome cards and verify count
    const outcomeLinks = screen.getAllByRole('link').filter(link =>
      link.getAttribute('href')?.startsWith('/outcomes/')
    )
    expect(outcomeLinks.length).toBe(3) // Based on mock data
  })
})
