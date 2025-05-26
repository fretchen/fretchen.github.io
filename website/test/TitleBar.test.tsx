import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TitleBar from '../components/TitleBar'

// Mock SupportArea da es komplexe Blockchain-Abhängigkeiten hat
vi.mock('../components/SupportArea', () => ({
  default: () => <div data-testid="support-area">Mocked Support Area</div>
}))

describe('TitleBar Component', () => {
  it('renders title correctly', () => {
    const testTitle = 'Test Page Title'
    render(<TitleBar title={testTitle} />)
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(testTitle)
  })

  it('includes SupportArea component', () => {
    render(<TitleBar title="Test Title" />)
    
    expect(screen.getByTestId('support-area')).toBeInTheDocument()
  })

  it('has correct layout structure', () => {
    const { container } = render(<TitleBar title="Test Title" />)
    
    const titleBarDiv = container.querySelector('.TitleBar')
    expect(titleBarDiv).toBeInTheDocument()
    expect(titleBarDiv).toHaveStyle({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    })
  })

  it('handles long titles without breaking layout', () => {
    const longTitle = 'This is a very long title that should still be displayed properly without breaking the layout'
    render(<TitleBar title={longTitle} />)
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(longTitle)
  })

  it('handles empty title', () => {
    render(<TitleBar title="" />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('')
  })

  it('handles special characters in title', () => {
    const specialTitle = 'Title with & special <characters> and "quotes"'
    render(<TitleBar title={specialTitle} />)
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(specialTitle)
  })
})
