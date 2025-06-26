import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EntryList from "../components/EntryList";
import { BlogEntry } from "../types/components";

// Mock der Link-Komponente
vi.mock("../components/Link", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

/**
 * Component tests for the EntryList component
 * Tests blog entry rendering, navigation links, and edge cases
 *
 * @fileoverview Unit tests covering blog list display, link generation,
 * custom styling, and various data scenarios for the EntryList component
 */
describe("EntryList Component", () => {
  const mockBlogs: BlogEntry[] = [
    {
      title: "First Blog Post",
      publishing_date: "2024-01-15",
      description: "Description of the first post",
    },
    {
      title: "Second Blog Post",
      publishing_date: "2024-01-20",
      description: "Description of the second post",
    },
    {
      title: "Third Blog Post",
      publishing_date: "2024-01-25",
      // Keine description - sollte optional sein
    },
  ];

  const defaultProps = {
    blogs: mockBlogs,
    basePath: "/blog",
  };

  /**
   * Tests rendering of all blog entries in the list
   * @test {BlogEntry[]} blogs - Array of blog entries to render
   * @test {HTMLElement[]} entries - Rendered blog entry elements
   */
  it("renders all blog entries by default", () => {
    render(<EntryList {...defaultProps} />);

    expect(screen.getByText("First Blog Post")).toBeInTheDocument();
    expect(screen.getByText("Second Blog Post")).toBeInTheDocument();
    expect(screen.getByText("Third Blog Post")).toBeInTheDocument();
  });

  /**
   * Tests publishing date display when showDate is enabled
   * @test {boolean} showDate - Date display control prop
   * @test {string[]} dates - Published date strings in blog entries
   */
  it("shows publishing dates when showDate is true", () => {
    render(<EntryList {...defaultProps} showDate={true} />);

    expect(screen.getByText("2024-01-15")).toBeInTheDocument();
    expect(screen.getByText("2024-01-20")).toBeInTheDocument();
    expect(screen.getByText("2024-01-25")).toBeInTheDocument();
  });

  /**
   * Tests hiding publishing dates when showDate is disabled
   * @test {boolean} showDate - Date display control prop set to false
   * @test {null} dates - Date elements should not be present in DOM
   */
  it("hides publishing dates when showDate is false", () => {
    render(<EntryList {...defaultProps} showDate={false} />);

    expect(screen.queryByText("2024-01-15")).not.toBeInTheDocument();
    expect(screen.queryByText("2024-01-20")).not.toBeInTheDocument();
    expect(screen.queryByText("2024-01-25")).not.toBeInTheDocument();
  });

  /**
   * Tests description display for blog entries that have descriptions
   * @test {string} description - Optional description text in blog entries
   * @test {HTMLElement} element - Description text element in DOM
   */
  it("shows descriptions when available", () => {
    render(<EntryList {...defaultProps} />);

    expect(screen.getByText("Description of the first post")).toBeInTheDocument();
    expect(screen.getByText("Description of the second post")).toBeInTheDocument();
  });

  /**
   * Tests blog entry order reversal functionality
   * @test {boolean} reverseOrder - Order reversal control prop
   * @test {HTMLAnchorElement[]} links - Navigation links with reversed order URLs
   */
  it("reverses order when reverseOrder is true", () => {
    render(<EntryList {...defaultProps} reverseOrder={true} />);

    // Jetzt ist die ganze Card klickbar, daher suchen wir nach allen Links
    const links = screen.getAllByRole("link");

    // Bei reverseOrder sollte der erste Link zum letzten Blog führen (Index 2)
    expect(links[0]).toHaveAttribute("href", "/blog/2");
    // Der dritte Link sollte zum ersten Blog führen (Index 0)
    expect(links[2]).toHaveAttribute("href", "/blog/0");
  });

  /**
   * Tests entry count limiting functionality
   * @test {number} limit - Maximum number of entries to display
   * @test {HTMLElement[]} entries - Limited set of rendered entries
   */
  it("limits entries when limit prop is provided", () => {
    render(<EntryList {...defaultProps} limit={2} />);

    expect(screen.getByText("First Blog Post")).toBeInTheDocument();
    expect(screen.getByText("Second Blog Post")).toBeInTheDocument();
    expect(screen.queryByText("Third Blog Post")).not.toBeInTheDocument();
  });

  /**
   * Tests "View all" link display when entries are limited
   * @test {boolean} showViewAllLink - Control prop for view all link
   * @test {HTMLAnchorElement} link - View all navigation link
   */
  it('shows "View all" link when limit is set and showViewAllLink is true', () => {
    render(<EntryList {...defaultProps} limit={2} showViewAllLink={true} />);

    const viewAllLink = screen.getByText("View all entries →");
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink.closest("a")).toHaveAttribute("href", "/blog");
  });

  /**
   * Tests correct link generation with basePath and entry indices
   * @test {string} basePath - Base URL path for blog entries
   * @test {HTMLAnchorElement[]} links - Generated navigation links with correct URLs
   */
  it("generates correct links with basePath and indices", () => {
    render(<EntryList {...defaultProps} />);

    // Jetzt ist die ganze Card klickbar, daher suchen wir nach allen Links
    const links = screen.getAllByRole("link");

    expect(links[0]).toHaveAttribute("href", "/blog/0");
    expect(links[1]).toHaveAttribute("href", "/blog/1");
    expect(links[2]).toHaveAttribute("href", "/blog/2");
  });

  /**
   * Tests custom CSS class application to entry titles
   * @test {string} titleClassName - Custom CSS class for title styling
   * @test {HTMLElement} title - Title element with applied custom class
   */
  it("applies custom titleClassName when provided", () => {
    const customClass = "custom-title-class";
    render(<EntryList {...defaultProps} titleClassName={customClass} />);

    const firstTitle = screen.getByText("First Blog Post");
    expect(firstTitle).toHaveClass(customClass);
  });

  /**
   * Tests graceful handling of empty blog array
   * @test {BlogEntry[]} blogs - Empty array of blog entries
   * @test {null} entries - No blog entry elements should be rendered
   */
  it("handles empty blogs array gracefully", () => {
    render(<EntryList blogs={[]} basePath="/blog" />);

    // Container sollte existieren, aber keine Einträge
    expect(screen.queryByText("First Blog Post")).not.toBeInTheDocument();
  });

  /**
   * Tests custom basePath functionality for different URL structures
   * @test {string} basePath - Custom base path for blog entry URLs
   * @test {HTMLAnchorElement[]} links - Links with custom base path URLs
   */
  it("works with custom basePath", () => {
    const customBasePath = "/quantum/basics";
    render(<EntryList {...defaultProps} basePath={customBasePath} />);

    // Jetzt ist die ganze Card klickbar, daher suchen wir nach allen Links
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/quantum/basics/0");

    const viewAllLink = screen.queryByText("View all entries →");
    if (viewAllLink) {
      expect(viewAllLink.closest("a")).toHaveAttribute("href", "/quantum/basics");
    }
  });
});
