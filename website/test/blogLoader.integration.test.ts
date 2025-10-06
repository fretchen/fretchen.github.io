import { describe, it, expect } from "vitest";
import { loadBlogs } from "../utils/blogLoader";

describe("blogLoader - Integration Test", () => {
  it("should load blogs from blog directory", async () => {
    // This test will actually use import.meta.glob
    // It should load real markdown and tsx files from the blog directory
    const blogs = await loadBlogs("blog", "publishing_date");

    console.log(`[Integration Test] Loaded ${blogs.length} blogs`);
    console.log(
      "[Integration Test] Blog titles:",
      blogs.map((b) => b.title),
    );
    console.log(
      "[Integration Test] Blog types:",
      blogs.map((b) => b.type),
    );

    // We should have at least some blogs
    expect(blogs.length).toBeGreaterThan(0);

    // After MDX migration, all blogs have type "react"
    // Distinguish by componentPath extension
    const markdownBlogs = blogs.filter(
      (b) => b.componentPath && (b.componentPath.endsWith(".md") || b.componentPath.endsWith(".mdx")),
    );
    const typescriptBlogs = blogs.filter((b) => b.componentPath && b.componentPath.endsWith(".tsx"));

    console.log(`[Integration Test] Markdown blogs: ${markdownBlogs.length}`);
    console.log(`[Integration Test] TypeScript blogs: ${typescriptBlogs.length}`);

    // Verify that we have both types
    expect(markdownBlogs.length).toBeGreaterThan(0);
    expect(typescriptBlogs.length).toBeGreaterThan(0);

    // Verify that markdown blogs have required metadata
    markdownBlogs.forEach((blog) => {
      expect(blog.title).toBeDefined();
      expect(blog.title.length).toBeGreaterThan(0);
      expect(blog.componentPath).toBeDefined();
      // MDX blogs don't have content in the BlogPost object - it's in the component
      expect(blog.content).toBe("");
    });

    // Verify that typescript blogs have componentPath
    typescriptBlogs.forEach((blog) => {
      expect(blog.componentPath).toBeDefined();
      expect(blog.componentPath).toMatch(/\.tsx$/);
      expect(blog.type).toBe("react");
      expect(blog.content).toBe("");
    });
  });

  it.skip("should load quantum/amo blogs sorted by order (not in MVP scope)", { timeout: 20000 }, async () => {
    const blogs = await loadBlogs("quantum/amo", "order");

    console.log(`[Integration Test] Loaded ${blogs.length} AMO blogs`);

    if (blogs.length > 0) {
      // Check sorting by order
      for (let i = 0; i < blogs.length - 1; i++) {
        if (blogs[i].order !== undefined && blogs[i + 1].order !== undefined) {
          expect(blogs[i].order).toBeLessThanOrEqual(blogs[i + 1].order!);
        }
      }
    }

    expect(blogs.length).toBeGreaterThan(0);
  });

  it("should parse frontmatter from real markdown files", async () => {
    const blogs = await loadBlogs("blog", "publishing_date");
    // After MDX migration, markdown blogs have componentPath ending in .md/.mdx
    const markdownBlogs = blogs.filter(
      (b) => b.componentPath && (b.componentPath.endsWith(".md") || b.componentPath.endsWith(".mdx")),
    );

    expect(markdownBlogs.length).toBeGreaterThan(0);

    if (markdownBlogs.length > 0) {
      const firstBlog = markdownBlogs[0];

      console.log("[Integration Test] First markdown blog:", {
        title: firstBlog.title,
        type: firstBlog.type,
        hasContent: firstBlog.content.length > 0,
        publishing_date: firstBlog.publishing_date,
        tokenID: firstBlog.tokenID,
      });

      // Should have extracted title from frontmatter
      expect(firstBlog.title).toBeDefined();
      expect(firstBlog.title).not.toBe("");

      // Should have content (without frontmatter)
      expect(firstBlog.content).toBeDefined();
      expect(firstBlog.content).not.toContain("---"); // Frontmatter should be removed
    } else {
      console.warn("[Integration Test] No markdown blogs found in blog directory!");
    }
  });

  it("should handle blogs with and without metadata", async () => {
    const blogs = await loadBlogs("blog", "publishing_date");

    console.log(
      "[Integration Test] Blog metadata:",
      blogs.map((b) => ({
        title: b.title,
        date: b.publishing_date,
        token: b.tokenID,
        type: b.type,
      })),
    );

    // All blogs should have at least a title
    blogs.forEach((blog) => {
      expect(blog.title).toBeDefined();
      expect(blog.title.length).toBeGreaterThan(0);
    });
  });
});
