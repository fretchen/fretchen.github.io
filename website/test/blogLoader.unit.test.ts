/**
 * Unit Tests for blogLoader Pure Functions
 *
 * These tests are fast and deterministic because they test pure functions
 * without any I/O or module loading.
 */

import { describe, it, expect } from "vitest";
import { sortBlogs, extractMetadataFromModule, attachNFTMetadata, extractTokenIDs } from "../utils/blogLoader";
import type { BlogPost, NFTMetadata } from "../types/BlogPost";

describe("blogLoader - Pure Functions", () => {
  describe("sortBlogs", () => {
    const createBlog = (overrides: Partial<BlogPost> = {}): BlogPost => ({
      title: "Test Blog",
      content: "",
      type: "react",
      ...overrides,
    });

    it("should sort by publishing_date (oldest first)", () => {
      const blogs = [
        createBlog({ title: "New", publishing_date: "2025-03-01" }),
        createBlog({ title: "Old", publishing_date: "2025-01-01" }),
        createBlog({ title: "Mid", publishing_date: "2025-02-01" }),
      ];

      const sorted = sortBlogs(blogs, "publishing_date");

      expect(sorted[0].title).toBe("Old");
      expect(sorted[1].title).toBe("Mid");
      expect(sorted[2].title).toBe("New");
    });

    it("should sort by order field", () => {
      const blogs = [
        createBlog({ title: "Third", order: 3 }),
        createBlog({ title: "First", order: 1 }),
        createBlog({ title: "Second", order: 2 }),
      ];

      const sorted = sortBlogs(blogs, "order");

      expect(sorted[0].title).toBe("First");
      expect(sorted[1].title).toBe("Second");
      expect(sorted[2].title).toBe("Third");
    });

    it("should handle blogs without sort field", () => {
      const blogs = [
        createBlog({ title: "No Date 1" }),
        createBlog({ title: "Has Date", publishing_date: "2025-01-01" }),
        createBlog({ title: "No Date 2" }),
      ];

      const sorted = sortBlogs(blogs, "publishing_date");

      // Blogs without dates should remain in relative order
      expect(sorted.length).toBe(3);
      expect(sorted.map((b) => b.title)).toContain("Has Date");
    });

    it("should not mutate the original array", () => {
      const blogs = [
        createBlog({ title: "B", publishing_date: "2025-02-01" }),
        createBlog({ title: "A", publishing_date: "2025-01-01" }),
      ];

      const sorted = sortBlogs(blogs, "publishing_date");

      expect(blogs[0].title).toBe("B"); // Original unchanged
      expect(sorted[0].title).toBe("A"); // Sorted copy
    });

    it("should default to publishing_date sort", () => {
      const blogs = [
        createBlog({ title: "New", publishing_date: "2025-02-01" }),
        createBlog({ title: "Old", publishing_date: "2025-01-01" }),
      ];

      const sorted = sortBlogs(blogs);

      expect(sorted[0].title).toBe("Old");
    });
  });

  describe("extractMetadataFromModule", () => {
    it("should extract metadata from MDX module with frontmatter", () => {
      const module = {
        frontmatter: {
          title: "My Blog Post",
          publishing_date: "2025-01-15",
          tokenID: 42,
          description: "A test blog post",
        },
      };

      const result = extractMetadataFromModule(module, "../blog/test.md");

      expect(result).not.toBeNull();
      expect(result?.title).toBe("My Blog Post");
      expect(result?.publishing_date).toBe("2025-01-15");
      expect(result?.tokenID).toBe(42);
      expect(result?.description).toBe("A test blog post");
      expect(result?.type).toBe("react");
    });

    it("should extract metadata from TSX module with meta", () => {
      const module = {
        meta: {
          title: "Interactive Post",
          publishing_date: "2025-02-01",
          tokenID: 99,
        },
      };

      const result = extractMetadataFromModule(module, "../blog/interactive.tsx");

      expect(result).not.toBeNull();
      expect(result?.title).toBe("Interactive Post");
      expect(result?.tokenID).toBe(99);
    });

    it("should generate fallback title from MDX filename", () => {
      const module = {
        frontmatter: {
          publishing_date: "2025-01-01",
        },
      };

      const result = extractMetadataFromModule(module, "../blog/my_awesome_post.md");

      expect(result?.title).toBe("my_awesome_post");
    });

    it("should generate fallback title from TSX filename with formatting", () => {
      const module = {
        meta: {},
      };

      const result = extractMetadataFromModule(module, "../blog/my_cool_component.tsx");

      expect(result?.title).toBe("My Cool Component");
    });

    it("should return null for invalid module", () => {
      expect(extractMetadataFromModule(null, "test.md")).toBeNull();
      expect(extractMetadataFromModule(undefined, "test.md")).toBeNull();
      expect(extractMetadataFromModule("string", "test.md")).toBeNull();
    });

    it("should return null for MDX without frontmatter", () => {
      const module = {};

      const result = extractMetadataFromModule(module, "../blog/test.md");

      expect(result).toBeNull();
    });

    it("should return null for unsupported file types", () => {
      const module = { frontmatter: { title: "Test" } };

      const result = extractMetadataFromModule(module, "../blog/test.json");

      expect(result).toBeNull();
    });

    it("should set componentPath correctly", () => {
      const module = {
        frontmatter: { title: "Test" },
      };

      const result = extractMetadataFromModule(module, "../blog/special.mdx");

      expect(result?.componentPath).toBe("../blog/special.mdx");
    });
  });

  describe("attachNFTMetadata", () => {
    const createBlog = (tokenID?: number): BlogPost => ({
      title: `Blog ${tokenID || "none"}`,
      content: "",
      type: "react",
      tokenID,
    });

    const mockNFTMetadata: Record<number, NFTMetadata> = {
      26: {
        imageUrl: "https://example.com/26.png",
        prompt: "Test prompt 26",
        name: "NFT 26",
        description: "Description 26",
      },
      42: {
        imageUrl: "https://example.com/42.png",
        prompt: "Test prompt 42",
        name: "NFT 42",
        description: "Description 42",
      },
    };

    it("should attach NFT metadata to matching blogs", () => {
      const blogs = [createBlog(26), createBlog(42), createBlog(99)];

      const result = attachNFTMetadata(blogs, mockNFTMetadata);

      expect(result[0].nftMetadata).toBeDefined();
      expect(result[0].nftMetadata?.name).toBe("NFT 26");
      expect(result[1].nftMetadata?.name).toBe("NFT 42");
      expect(result[2].nftMetadata).toBeUndefined();
    });

    it("should not modify blogs without tokenID", () => {
      const blogs = [createBlog(), createBlog()];

      const result = attachNFTMetadata(blogs, mockNFTMetadata);

      expect(result[0].nftMetadata).toBeUndefined();
      expect(result[1].nftMetadata).toBeUndefined();
    });

    it("should return new array (immutable)", () => {
      const blogs = [createBlog(26)];

      const result = attachNFTMetadata(blogs, mockNFTMetadata);

      expect(result).not.toBe(blogs);
      expect(result[0]).not.toBe(blogs[0]);
      expect(blogs[0].nftMetadata).toBeUndefined(); // Original unchanged
    });

    it("should handle empty blogs array", () => {
      const result = attachNFTMetadata([], mockNFTMetadata);

      expect(result).toEqual([]);
    });

    it("should handle empty metadata map", () => {
      const blogs = [createBlog(26)];

      const result = attachNFTMetadata(blogs, {});

      expect(result[0].nftMetadata).toBeUndefined();
    });
  });

  describe("extractTokenIDs", () => {
    const createBlog = (tokenID?: number): BlogPost => ({
      title: `Blog ${tokenID || "none"}`,
      content: "",
      type: "react",
      tokenID,
    });

    it("should extract unique tokenIDs", () => {
      const blogs = [createBlog(26), createBlog(42), createBlog(26), createBlog(99)];

      const result = extractTokenIDs(blogs);

      expect(result).toHaveLength(3);
      expect(result).toContain(26);
      expect(result).toContain(42);
      expect(result).toContain(99);
    });

    it("should skip blogs without tokenID", () => {
      const blogs = [createBlog(26), createBlog(), createBlog(42), createBlog()];

      const result = extractTokenIDs(blogs);

      expect(result).toHaveLength(2);
      expect(result).toContain(26);
      expect(result).toContain(42);
    });

    it("should return empty array for blogs without tokenIDs", () => {
      const blogs = [createBlog(), createBlog(), createBlog()];

      const result = extractTokenIDs(blogs);

      expect(result).toEqual([]);
    });

    it("should return empty array for empty input", () => {
      const result = extractTokenIDs([]);

      expect(result).toEqual([]);
    });
  });
});
