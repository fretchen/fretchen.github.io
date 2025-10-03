import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { loadBlogs } from "../utils/blogLoader";
import EntryList from "../components/EntryList";

// Mock der Link-Komponente
vi.mock("../components/Link", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

/**
 * Integration test for EntryList component with real blog data from blogLoader
 * This tests the entire flow: loading markdown files -> parsing -> rendering
 */
describe("EntryList with Real Blog Data", () => {
  it("should render markdown blog titles correctly", async () => {
    // Load real blogs from the blog directory
    const blogs = await loadBlogs("blog", "publishing_date");

    console.log(`[EntryList Test] Loaded ${blogs.length} blogs`);
    console.log(
      "[EntryList Test] Blog titles:",
      blogs.map((b) => b.title),
    );

    // Filter to only markdown blogs for this test
    const markdownBlogs = blogs.filter((b) => b.type === "markdown");

    expect(markdownBlogs.length).toBeGreaterThan(0);

    // Convert to the format EntryList expects
    const blogEntries = markdownBlogs.map((blog, index) => ({
      title: blog.title,
      publishing_date: blog.publishing_date,
      description: blog.content.substring(0, 100), // First 100 chars as description
      id: index,
    }));

    // Render EntryList with real blog data
    render(<EntryList blogs={blogEntries} basePath="/blog" showDate={true} />);

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(blogEntries[0].title)).toBeInTheDocument();
    });

    // Check that all blog titles are rendered
    blogEntries.forEach((blog) => {
      const titleElement = screen.getByText(blog.title);
      expect(titleElement).toBeInTheDocument();
      console.log(`[EntryList Test] ✓ Found title: "${blog.title}"`);
    });

    // Specifically check for some known blog titles
    const expectedTitles = [
      "Hello World",
      "Moving old lectures",
      "Are decentral websites a thing for me ?",
      "Running an image generator",
    ];

    expectedTitles.forEach((title) => {
      const blog = blogEntries.find((b) => b.title === title);
      if (blog) {
        expect(screen.getByText(title)).toBeInTheDocument();
        console.log(`[EntryList Test] ✓ Verified expected title: "${title}"`);
      } else {
        console.warn(`[EntryList Test] ⚠ Expected title not found in blogs: "${title}"`);
      }
    });
  });

  it("should render both markdown and typescript blogs", async () => {
    const blogs = await loadBlogs("blog", "publishing_date");

    const markdownBlogs = blogs.filter((b) => b.type === "markdown");
    const typescriptBlogs = blogs.filter((b) => b.type === "typescript");

    console.log(`[EntryList Test] Markdown blogs: ${markdownBlogs.length}`);
    console.log(`[EntryList Test] TypeScript blogs: ${typescriptBlogs.length}`);

    expect(markdownBlogs.length).toBeGreaterThan(0);
    expect(typescriptBlogs.length).toBeGreaterThan(0);

    // All blogs should have titles
    blogs.forEach((blog) => {
      expect(blog.title).toBeDefined();
      expect(blog.title.length).toBeGreaterThan(0);
      console.log(`[EntryList Test] Blog: "${blog.title}" (${blog.type})`);
    });

    // Convert all blogs to EntryList format
    const blogEntries = blogs.map((blog, index) => ({
      title: blog.title,
      publishing_date: blog.publishing_date,
      id: index,
    }));

    render(<EntryList blogs={blogEntries} basePath="/blog" />);

    // Check that titles from both types are rendered
    await waitFor(() => {
      expect(screen.getByText(blogEntries[0].title)).toBeInTheDocument();
    });
  });

  it("should handle blogs with different frontmatter formats", async () => {
    const blogs = await loadBlogs("blog", "publishing_date");
    const markdownBlogs = blogs.filter((b) => b.type === "markdown");

    // Check various frontmatter fields
    const blogsWithDates = markdownBlogs.filter((b) => b.publishing_date);
    const blogsWithTokens = markdownBlogs.filter((b) => b.tokenID);

    console.log(`[EntryList Test] Blogs with dates: ${blogsWithDates.length}`);
    console.log(`[EntryList Test] Blogs with tokenIDs: ${blogsWithTokens.length}`);

    // All should have titles extracted correctly
    markdownBlogs.forEach((blog) => {
      expect(blog.title).toBeDefined();
      expect(blog.title.length).toBeGreaterThan(1); // More than 1 character
      // Title should not be truncated to first word only
      expect(blog.title).not.toMatch(/^[A-Z][a-z]*$/); // Not just a single word
      console.log(`[EntryList Test] Title check: "${blog.title}" - length: ${blog.title.length}`);
    });
  });

  it("should display full multi-word titles, not just first word", async () => {
    const blogs = await loadBlogs("blog", "publishing_date");
    const markdownBlogs = blogs.filter((b) => b.type === "markdown");

    // Find blogs that should have multi-word titles
    const multiWordBlogs = markdownBlogs.filter((b) => {
      // These are known multi-word titles from the blog files
      const multiWordTitles = [
        "Moving old lectures",
        "Are decentral websites a thing for me ?",
        "Is mirror.xyz a thing ?",
        "Running an image generator",
        "My short lived contact with the world of VCs in Germany",
        "Generating AI images, paying anonymously and little",
      ];
      return multiWordTitles.includes(b.title);
    });

    console.log(`[EntryList Test] Multi-word title blogs found: ${multiWordBlogs.length}`);

    multiWordBlogs.forEach((blog) => {
      // Title should contain spaces (multi-word)
      expect(blog.title).toContain(" ");
      console.log(`[EntryList Test] ✓ Multi-word title: "${blog.title}"`);
    });

    expect(multiWordBlogs.length).toBeGreaterThan(0);
  });
});
