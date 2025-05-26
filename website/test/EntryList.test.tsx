import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import EntryList, { BlogEntry } from '../components/EntryList'

// Mock der Link-Komponente
vi.mock('../components/Link', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  )
}))

describe('EntryList Component', () => {
  const mockBlogs: BlogEntry[] = [
    {
      title: 'First Blog Post',
      publishing_date: '2024-01-15',
      description: 'Description of the first post'
    },
    {
      title: 'Second Blog Post',
      publishing_date: '2024-01-20',
      description: 'Description of the second post'
    },
    {
      title: 'Third Blog Post',
      publishing_date: '2024-01-25'
      // Keine description - sollte optional sein
    }
  ]

  const defaultProps = {
    blogs: mockBlogs,
    basePath: '/blog'
  }

  it('renders all blog entries by default', () => {
    render(<EntryList {...defaultProps} />)
    
    expect(screen.getByText('First Blog Post')).toBeInTheDocument()
    expect(screen.getByText('Second Blog Post')).toBeInTheDocument()
    expect(screen.getByText('Third Blog Post')).toBeInTheDocument()
  })

  it('shows publishing dates when showDate is true', () => {
    render(<EntryList {...defaultProps} showDate={true} />)
    
    expect(screen.getByText('2024-01-15')).toBeInTheDocument()
    expect(screen.getByText('2024-01-20')).toBeInTheDocument()
    expect(screen.getByText('2024-01-25')).toBeInTheDocument()
  })

  it('hides publishing dates when showDate is false', () => {
    render(<EntryList {...defaultProps} showDate={false} />)
    
    expect(screen.queryByText('2024-01-15')).not.toBeInTheDocument()
    expect(screen.queryByText('2024-01-20')).not.toBeInTheDocument()
    expect(screen.queryByText('2024-01-25')).not.toBeInTheDocument()
  })

  it('shows descriptions when available', () => {
    render(<EntryList {...defaultProps} />)
    
    expect(screen.getByText('Description of the first post')).toBeInTheDocument()
    expect(screen.getByText('Description of the second post')).toBeInTheDocument()
  })

  it('reverses order when reverseOrder is true', () => {
    render(<EntryList {...defaultProps} reverseOrder={true} />)
    
    const entries = screen.getAllByRole('link', { name: /read more/i })
    
    // Bei reverseOrder sollte der erste Link zum letzten Blog führen (Index 2)
    expect(entries[0]).toHaveAttribute('href', '/blog/2')
    // Der dritte Link sollte zum ersten Blog führen (Index 0)
    expect(entries[2]).toHaveAttribute('href', '/blog/0')
  })

  it('limits entries when limit prop is provided', () => {
    render(<EntryList {...defaultProps} limit={2} />)
    
    expect(screen.getByText('First Blog Post')).toBeInTheDocument()
    expect(screen.getByText('Second Blog Post')).toBeInTheDocument()
    expect(screen.queryByText('Third Blog Post')).not.toBeInTheDocument()
  })

  it('shows "View all" link when limit is set and showViewAllLink is true', () => {
    render(<EntryList {...defaultProps} limit={2} showViewAllLink={true} />)
    
    const viewAllLink = screen.getByText('View all entries →')
    expect(viewAllLink).toBeInTheDocument()
    expect(viewAllLink.closest('a')).toHaveAttribute('href', '/blog')
  })

  it('generates correct links with basePath and indices', () => {
    render(<EntryList {...defaultProps} />)
    
    const readMoreLinks = screen.getAllByRole('link', { name: /read more/i })
    
    expect(readMoreLinks[0]).toHaveAttribute('href', '/blog/0')
    expect(readMoreLinks[1]).toHaveAttribute('href', '/blog/1')
    expect(readMoreLinks[2]).toHaveAttribute('href', '/blog/2')
  })

  it('applies custom titleClassName when provided', () => {
    const customClass = 'custom-title-class'
    render(<EntryList {...defaultProps} titleClassName={customClass} />)
    
    const firstTitle = screen.getByText('First Blog Post')
    expect(firstTitle).toHaveClass(customClass)
  })

  it('handles empty blogs array gracefully', () => {
    render(<EntryList blogs={[]} basePath="/blog" />)
    
    // Container sollte existieren, aber keine Einträge
    expect(screen.queryByText('First Blog Post')).not.toBeInTheDocument()
  })

  it('works with custom basePath', () => {
    const customBasePath = '/quantum/basics'
    render(<EntryList {...defaultProps} basePath={customBasePath} />)
    
    const readMoreLinks = screen.getAllByRole('link', { name: /read more/i })
    expect(readMoreLinks[0]).toHaveAttribute('href', '/quantum/basics/0')
    
    const viewAllLink = screen.queryByText('View all entries →')
    if (viewAllLink) {
      expect(viewAllLink.closest('a')).toHaveAttribute('href', '/quantum/basics')
    }
  })
})
