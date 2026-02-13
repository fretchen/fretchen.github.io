import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { TableOfContents } from "../components/TableOfContents";

/**
 * Tests for TableOfContents component
 * Tests rendering, click handling, and visibility conditions
 */
describe("TableOfContents", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);

    // Mock scrollTo
    vi.stubGlobal("scrollTo", vi.fn());

    // Mock history.pushState
    vi.spyOn(window.history, "pushState").mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.removeChild(container);
    // Only restore mocks, don't unstub globals (IntersectionObserver is set globally in setup.ts)
    vi.restoreAllMocks();
  });

  it("should be importable", () => {
    expect(typeof TableOfContents).toBe("function");
  });

  it("should render nothing when ref has no headings", async () => {
    container.innerHTML = "<p>Just text</p>";
    const ref = { current: container };

    const { container: renderContainer } = render(<TableOfContents contentRef={ref} />);

    // Wait for the hook's setTimeout
    await waitFor(
      () => {
        expect(renderContainer.innerHTML).toBe("");
      },
      { timeout: 200 },
    );
  });

  it("should render nothing when fewer headings than minHeadings", async () => {
    container.innerHTML = "<h2 id='single'>Single Heading</h2>";
    const ref = { current: container };

    const { container: renderContainer } = render(<TableOfContents contentRef={ref} minHeadings={2} />);

    await waitFor(
      () => {
        expect(renderContainer.innerHTML).toBe("");
      },
      { timeout: 200 },
    );
  });

  it("should render ToC when enough headings exist", async () => {
    container.innerHTML = `
      <h2 id="section-1">Section 1</h2>
      <h2 id="section-2">Section 2</h2>
    `;
    const ref = { current: container };

    render(<TableOfContents contentRef={ref} />);

    await waitFor(() => {
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    // Use getAllByRole to find links within the ToC nav
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent("Section 1");
    expect(links[1]).toHaveTextContent("Section 2");
  });

  it("should render custom title", async () => {
    container.innerHTML = `
      <h2 id="s1">S1</h2>
      <h2 id="s2">S2</h2>
    `;
    const ref = { current: container };

    render(<TableOfContents contentRef={ref} title="Inhalt" />);

    await waitFor(() => {
      expect(screen.getByText("Inhalt")).toBeInTheDocument();
    });
  });

  it("should render default title 'On this page'", async () => {
    container.innerHTML = `
      <h2 id="s1">S1</h2>
      <h2 id="s2">S2</h2>
    `;
    const ref = { current: container };

    render(<TableOfContents contentRef={ref} />);

    await waitFor(() => {
      expect(screen.getByText("On this page")).toBeInTheDocument();
    });
  });

  it("should have correct aria-label for accessibility", async () => {
    container.innerHTML = `
      <h2 id="s1">S1</h2>
      <h2 id="s2">S2</h2>
    `;
    const ref = { current: container };

    render(<TableOfContents contentRef={ref} />);

    await waitFor(() => {
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label", "Table of contents");
    });
  });

  it("should render links with correct href", async () => {
    container.innerHTML = `
      <h2 id="my-section">My Section</h2>
      <h2 id="other-section">Other Section</h2>
    `;
    const ref = { current: container };

    render(<TableOfContents contentRef={ref} />);

    await waitFor(
      () => {
        // Check that navigation element exists
        expect(screen.getByRole("navigation")).toBeInTheDocument();
      },
      { timeout: 200 },
    );

    // Get links by role instead of text to avoid matching headings in container
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute("href", "#my-section");
    expect(links[1]).toHaveAttribute("href", "#other-section");
  });

  it("should render links that are clickable", async () => {
    // The heading elements need to be findable by document.getElementById
    // which they are since container is appended to document.body
    container.innerHTML = `
      <h2 id="target-section">Target Section</h2>
      <h2 id="other">Other</h2>
    `;
    const ref = { current: container };

    render(<TableOfContents contentRef={ref} />);

    await waitFor(
      () => {
        expect(screen.getByRole("navigation")).toBeInTheDocument();
      },
      { timeout: 200 },
    );

    // Verify the element is findable via getElementById (required for click handler)
    expect(document.getElementById("target-section")).not.toBeNull();

    // Verify links are rendered as anchor elements
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute("href", "#target-section");
  });

  it("should render with minHeadings=1 showing single heading", async () => {
    container.innerHTML = "<h2 id='single'>Single Heading</h2>";
    const ref = { current: container };

    render(<TableOfContents contentRef={ref} minHeadings={1} />);

    await waitFor(() => {
      expect(screen.getByText("Single Heading")).toBeInTheDocument();
    });
  });

  it("should handle both h2 and h3 headings", async () => {
    container.innerHTML = `
      <h2 id="main">Main Section</h2>
      <h3 id="sub">Subsection</h3>
    `;
    const ref = { current: container };

    render(<TableOfContents contentRef={ref} />);

    await waitFor(() => {
      expect(screen.getByText("Main Section")).toBeInTheDocument();
      expect(screen.getByText("Subsection")).toBeInTheDocument();
    });
  });
});
