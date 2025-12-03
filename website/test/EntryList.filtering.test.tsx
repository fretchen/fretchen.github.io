/**
 * EntryList Filtering Tests
 *
 * Tests that blog entry links remain consistent after filtering.
 * This prevents a bug where filtering by category would change the link indices,
 * causing users to be redirected to the wrong blog post.
 *
 * Problem: When filtering blogs by category, the link index was calculated
 * based on the position in the filtered array instead of the original index.
 *
 * Example:
 * - Blog with originalIndex 15 is at position 15 in full list → Link: /blog/15 ✅
 * - After filtering, same blog is at position 2 → Link: /blog/2 ❌ (wrong!)
 *
 * Solution: Pass originalIndex with each blog entry and use it for link generation.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EntryList from "../components/EntryList";
import { BlogEntry } from "../types/components";
import "@testing-library/jest-dom";

// Mock der Link-Komponente
vi.mock("../components/Link", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe("EntryList - Link consistency after filtering", () => {
  /**
   * Test case: Links should use originalIndex when provided
   *
   * This test simulates a filtered blog list where blogs have their
   * originalIndex preserved from the full list.
   */
  it("should use originalIndex for links when provided", () => {
    const filteredBlogs: BlogEntry[] = [
      {
        title: "AI Blog Post",
        category: "ai",
        originalIndex: 5, // Was at position 5 in original list
      },
      {
        title: "Another AI Post",
        category: "ai",
        originalIndex: 12, // Was at position 12 in original list
      },
      {
        title: "Third AI Post",
        category: "ai",
        originalIndex: 18, // Was at position 18 in original list
      },
    ];

    render(<EntryList blogs={filteredBlogs} basePath="/blog" />);

    const links = screen.getAllByRole("link");

    // Links should use originalIndex, not array position
    expect(links[0]).toHaveAttribute("href", "/blog/5");
    expect(links[1]).toHaveAttribute("href", "/blog/12");
    expect(links[2]).toHaveAttribute("href", "/blog/18");
  });

  /**
   * Test case: Links should fall back to array index when originalIndex is not provided
   *
   * This ensures backward compatibility with existing code that doesn't
   * use originalIndex.
   */
  it("should fall back to array index when originalIndex is not provided", () => {
    const blogs: BlogEntry[] = [{ title: "First Post" }, { title: "Second Post" }, { title: "Third Post" }];

    render(<EntryList blogs={blogs} basePath="/blog" />);

    const links = screen.getAllByRole("link");

    // Without originalIndex, use array position
    expect(links[0]).toHaveAttribute("href", "/blog/0");
    expect(links[1]).toHaveAttribute("href", "/blog/1");
    expect(links[2]).toHaveAttribute("href", "/blog/2");
  });

  /**
   * Test case: Reversed order should still use originalIndex correctly
   */
  it("should use originalIndex correctly when reverseOrder is true", () => {
    const filteredBlogs: BlogEntry[] = [
      { title: "Post A", originalIndex: 3 },
      { title: "Post B", originalIndex: 7 },
      { title: "Post C", originalIndex: 11 },
    ];

    render(<EntryList blogs={filteredBlogs} basePath="/blog" reverseOrder={true} />);

    const links = screen.getAllByRole("link");

    // With reverseOrder, display is reversed but originalIndex stays the same
    // Post C (originalIndex 11) should be first in display
    expect(links[0]).toHaveAttribute("href", "/blog/11");
    // Post B (originalIndex 7) should be second
    expect(links[1]).toHaveAttribute("href", "/blog/7");
    // Post A (originalIndex 3) should be third
    expect(links[2]).toHaveAttribute("href", "/blog/3");
  });

  /**
   * Test case: Mixed blogs (some with originalIndex, some without)
   */
  it("should handle mixed blogs with and without originalIndex", () => {
    const blogs: BlogEntry[] = [
      { title: "With Index", originalIndex: 10 },
      { title: "Without Index" }, // No originalIndex
      { title: "Another With Index", originalIndex: 20 },
    ];

    render(<EntryList blogs={blogs} basePath="/blog" />);

    const links = screen.getAllByRole("link");

    // First blog: use originalIndex
    expect(links[0]).toHaveAttribute("href", "/blog/10");
    // Second blog: fall back to array index (1)
    expect(links[1]).toHaveAttribute("href", "/blog/1");
    // Third blog: use originalIndex
    expect(links[2]).toHaveAttribute("href", "/blog/20");
  });

  /**
   * Test case: Simulates real filtering scenario from blog page
   *
   * This test replicates the actual bug scenario:
   * 1. User has a list of blogs
   * 2. User filters by category
   * 3. Filtered blogs should still link to correct blog IDs
   */
  it("should maintain correct links in realistic filtering scenario", () => {
    // Original blog list (simulating what comes from +data.ts)
    const allBlogs: BlogEntry[] = [
      { title: "Web3 Post 1", category: "web3" },
      { title: "AI Post 1", category: "ai" },
      { title: "Quantum Post 1", category: "quantum" },
      { title: "AI Post 2", category: "ai" },
      { title: "Web3 Post 2", category: "web3" },
      { title: "AI Post 3", category: "ai" },
    ];

    // Add originalIndex (this is what the fix does in +Page.tsx)
    const blogsWithIndex = allBlogs.map((blog, index) => ({
      ...blog,
      originalIndex: index,
    }));

    // Filter by "ai" category
    const filteredBlogs = blogsWithIndex.filter((blog) => blog.category === "ai");
    // filteredBlogs now contains: AI Post 1 (index 1), AI Post 2 (index 3), AI Post 3 (index 5)

    render(<EntryList blogs={filteredBlogs} basePath="/blog" />);

    const links = screen.getAllByRole("link");

    // Links should point to original indices, not filtered positions
    expect(links[0]).toHaveAttribute("href", "/blog/1"); // AI Post 1 was at index 1
    expect(links[1]).toHaveAttribute("href", "/blog/3"); // AI Post 2 was at index 3
    expect(links[2]).toHaveAttribute("href", "/blog/5"); // AI Post 3 was at index 5
  });
});
