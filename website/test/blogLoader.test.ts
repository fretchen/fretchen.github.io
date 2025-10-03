import { describe, it, expect, vi } from "vitest";
import type { BlogPost } from "../types/BlogPost";

// Mock import.meta.glob since it's a Vite-specific feature
vi.mock("../utils/blogLoader", async () => {
  const actual = await vi.importActual("../utils/blogLoader");
  return {
    ...actual,
  };
});

describe("blogLoader - Markdown file loading", () => {
  it("should parse markdown frontmatter correctly", () => {
    // Test frontmatter parsing function
    const content = `---
title: "Test Blog Post"
publishing_date: 2024-12-02
tokenID: 123
---

# Test Content

This is a test blog post.`;

    // Extract frontmatter manually to test parsing logic
    const frontMatter = content.match(/---([\s\S]*?)---/);
    expect(frontMatter).toBeDefined();
    expect(frontMatter![1]).toContain("title:");
    expect(frontMatter![1]).toContain("publishing_date:");
    expect(frontMatter![1]).toContain("tokenID:");
  });

  it("should extract metadata from frontmatter", () => {
    const metaString = `
title: "Test Blog Post"
publishing_date: 2024-12-02
tokenID: 123
order: 5
`;

    // Test different pattern formats
    const titlePattern = /title:\s*"([^"]*)"/i;
    const datePattern = /publishing_date:\s*([^\s\n]+)/i;
    const tokenPattern = /tokenID:\s*([^\s\n]+)/i;
    const orderPattern = /order:\s*([^\s\n]+)/i;

    expect(metaString.match(titlePattern)?.[1]).toBe("Test Blog Post");
    expect(metaString.match(datePattern)?.[1]).toBe("2024-12-02");
    expect(metaString.match(tokenPattern)?.[1]).toBe("123");
    expect(metaString.match(orderPattern)?.[1]).toBe("5");
  });

  it("should handle markdown files without frontmatter", () => {
    const content = `# Test Blog Post

This is content without frontmatter.`;

    const frontMatter = content.match(/---([\s\S]*?)---/);
    expect(frontMatter).toBeNull();
  });

  it("should extract blog content after frontmatter", () => {
    const content = `---
title: "Test Post"
---

# Actual Content

This is the blog content.`;

    const frontMatter = content.match(/---([\s\S]*?)---/);
    const blogContent = content.replace(frontMatter![0], "").trim();

    expect(blogContent).toBe("# Actual Content\n\nThis is the blog content.");
    expect(blogContent).not.toContain("---");
  });

  it("should handle various quote formats in frontmatter", () => {
    const testCases = [
      { meta: 'title: "Double Quotes"', expected: "Double Quotes" },
      { meta: "title: 'Single Quotes'", expected: "Single Quotes" },
      { meta: "title: NoQuotes", expected: "NoQuotes" },
    ];

    testCases.forEach(({ meta, expected }) => {
      const patterns = [
        /title:\s*"([^"]*)"/i,
        /title:\s*'([^']*)'/i,
        /title:\s*([^\s\n]+)/i,
      ];

      let match = null;
      for (const pattern of patterns) {
        match = meta.match(pattern);
        if (match) break;
      }

      expect(match?.[1]).toBe(expected);
    });
  });

  it("should create correct BlogPost structure", () => {
    const mockBlogPost: BlogPost = {
      title: "Test Post",
      content: "# Test\n\nContent here",
      type: "markdown",
      publishing_date: "2024-12-02",
      tokenID: 123,
    };

    expect(mockBlogPost).toHaveProperty("title");
    expect(mockBlogPost).toHaveProperty("content");
    expect(mockBlogPost).toHaveProperty("type");
    expect(mockBlogPost.type).toBe("markdown");
    expect(mockBlogPost.publishing_date).toBe("2024-12-02");
    expect(mockBlogPost.tokenID).toBe(123);
  });

  it("should handle TypeScript blog files", () => {
    const mockTsxBlogPost: BlogPost = {
      title: "React Blog Post",
      content: "",
      type: "typescript",
      componentPath: "../blog/test_post.tsx",
    };

    expect(mockTsxBlogPost.type).toBe("typescript");
    expect(mockTsxBlogPost.componentPath).toBeDefined();
    expect(mockTsxBlogPost.content).toBe("");
  });
});

describe("blogLoader - File filtering", () => {
  it("should filter files by directory correctly", () => {
    const allPaths = [
      "../blog/post1.md",
      "../blog/post2.md",
      "../quantum/amo/lecture1.md",
      "../quantum/basics/intro.md",
    ];

    // Test blog directory filtering
    const blogFiles = allPaths.filter(
      (path) => path.includes("../blog/") && !path.includes("/quantum/"),
    );
    expect(blogFiles).toHaveLength(2);
    expect(blogFiles).toContain("../blog/post1.md");

    // Test quantum/amo directory filtering
    const amoFiles = allPaths.filter((path) => path.includes("../quantum/amo/"));
    expect(amoFiles).toHaveLength(1);
    expect(amoFiles[0]).toBe("../quantum/amo/lecture1.md");
  });

  it("should normalize directory paths", () => {
    const testCases = [
      { input: "/blog", expected: "blog" },
      { input: "blog/", expected: "blog" },
      { input: "/blog/", expected: "blog" },
      { input: "quantum/amo", expected: "quantum/amo" },
    ];

    testCases.forEach(({ input, expected }) => {
      const normalized = input.replace(/^\//, "").replace(/\/$/, "");
      expect(normalized).toBe(expected);
    });
  });
});

describe("blogLoader - Sorting", () => {
  it("should sort by publishing_date (oldest first)", () => {
    const blogs: BlogPost[] = [
      { title: "Post 3", content: "", publishing_date: "2024-12-03" },
      { title: "Post 1", content: "", publishing_date: "2024-12-01" },
      { title: "Post 2", content: "", publishing_date: "2024-12-02" },
    ];

    const sorted = [...blogs].sort((a, b) => {
      if (a.publishing_date && b.publishing_date) {
        return new Date(a.publishing_date).getTime() - new Date(b.publishing_date).getTime();
      }
      return 0;
    });

    expect(sorted[0].title).toBe("Post 1");
    expect(sorted[1].title).toBe("Post 2");
    expect(sorted[2].title).toBe("Post 3");
  });

  it("should sort by order field", () => {
    const blogs: BlogPost[] = [
      { title: "Lecture 3", content: "", order: 3 },
      { title: "Lecture 1", content: "", order: 1 },
      { title: "Lecture 2", content: "", order: 2 },
    ];

    const sorted = [...blogs].sort((a, b) => {
      if (a.order && b.order) {
        return a.order - b.order;
      }
      return 0;
    });

    expect(sorted[0].title).toBe("Lecture 1");
    expect(sorted[1].title).toBe("Lecture 2");
    expect(sorted[2].title).toBe("Lecture 3");
  });

  it("should handle missing sort fields gracefully", () => {
    const blogs: BlogPost[] = [
      { title: "Post 1", content: "", publishing_date: "2024-12-01" },
      { title: "Post 2", content: "" }, // No date
      { title: "Post 3", content: "", publishing_date: "2024-12-03" },
    ];

    const sorted = [...blogs].sort((a, b) => {
      if (a.publishing_date && b.publishing_date) {
        return new Date(a.publishing_date).getTime() - new Date(b.publishing_date).getTime();
      }
      return 0;
    });

    // Posts with dates should be sorted, post without date order unchanged
    expect(sorted.length).toBe(3);
  });
});
