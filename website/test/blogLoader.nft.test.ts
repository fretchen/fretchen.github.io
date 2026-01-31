/**
 * Test Suite for NFT Metadata Loading in blogLoader
 *
 * These tests mock GLOB_REGISTRY to avoid loading real blog files,
 * making tests fast and deterministic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NFTMetadata, BlogPost } from "../types/BlogPost";

// Mock GLOB_REGISTRY with minimal test data
vi.mock("../utils/globRegistry", () => ({
  GLOB_REGISTRY: {
    blog: {
      lazy: {
        "../blog/post_with_token.md": async () => ({
          frontmatter: {
            title: "Post With Token",
            publishing_date: "2025-01-15",
            tokenID: 26,
          },
        }),
        "../blog/post_without_token.md": async () => ({
          frontmatter: {
            title: "Post Without Token",
            publishing_date: "2025-01-10",
          },
        }),
        "../blog/interactive.tsx": async () => ({
          meta: {
            title: "Interactive Post",
            publishing_date: "2025-01-20",
            tokenID: 42,
          },
        }),
      },
      eager: {},
    },
  },
}));

// Mock nodeNftLoader
vi.mock("../utils/nodeNftLoader", () => ({
  loadMultipleNFTMetadataNode: vi.fn(),
}));

describe("blogLoader - NFT Metadata Loading (Mocked)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache to get fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have NFT loader module available", async () => {
    const { loadMultipleNFTMetadataNode } = await import("../utils/nodeNftLoader");
    expect(loadMultipleNFTMetadataNode).toBeDefined();
    expect(typeof loadMultipleNFTMetadataNode).toBe("function");
  });

  it("should load blogs from mocked registry", async () => {
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    expect(blogs).toBeDefined();
    expect(Array.isArray(blogs)).toBe(true);
    expect(blogs.length).toBe(3);

    const titles = blogs.map((b) => b.title);
    expect(titles).toContain("Post With Token");
    expect(titles).toContain("Post Without Token");
    expect(titles).toContain("Interactive Post");
  });

  it("should sort blogs by publishing_date (oldest first)", async () => {
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    expect(blogs[0].title).toBe("Post Without Token"); // 2025-01-10
    expect(blogs[1].title).toBe("Post With Token"); // 2025-01-15
    expect(blogs[2].title).toBe("Interactive Post"); // 2025-01-20
  });

  it("should correctly identify blogs with tokenIDs", async () => {
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    const blogsWithToken = blogs.filter((b) => b.tokenID !== undefined);
    expect(blogsWithToken.length).toBe(2);

    const tokenIDs = blogsWithToken.map((b) => b.tokenID);
    expect(tokenIDs).toContain(26);
    expect(tokenIDs).toContain(42);
  });

  it("should handle blogs without tokenID gracefully", async () => {
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    const blogsWithoutToken = blogs.filter((b) => !b.tokenID);
    expect(blogsWithoutToken.length).toBe(1);
    expect(blogsWithoutToken[0].title).toBe("Post Without Token");
    expect(blogsWithoutToken[0].nftMetadata).toBeUndefined();
  });

  it("should extract unique tokenIDs", async () => {
    const { extractTokenIDs } = await import("../utils/blogLoader");

    const mockBlogs: BlogPost[] = [
      { title: "A", content: "", type: "react", tokenID: 26 },
      { title: "B", content: "", type: "react", tokenID: 42 },
      { title: "C", content: "", type: "react", tokenID: 26 }, // Duplicate
      { title: "D", content: "", type: "react" }, // No tokenID
    ];

    const tokenIDs = extractTokenIDs(mockBlogs);

    expect(tokenIDs.length).toBe(2);
    expect(tokenIDs).toContain(26);
    expect(tokenIDs).toContain(42);
  });

  it("should attach NFT metadata correctly", async () => {
    const { attachNFTMetadata } = await import("../utils/blogLoader");

    const mockBlogs: BlogPost[] = [
      { title: "A", content: "", type: "react", tokenID: 26 },
      { title: "B", content: "", type: "react" },
    ];

    const mockNFTMetadata: Record<number, NFTMetadata> = {
      26: {
        imageUrl: "https://example.com/26.png",
        prompt: "Test prompt",
        name: "NFT 26",
        description: "Test description",
      },
    };

    const result = attachNFTMetadata(mockBlogs, mockNFTMetadata);

    expect(result[0].nftMetadata).toBeDefined();
    expect(result[0].nftMetadata?.name).toBe("NFT 26");
    expect(result[1].nftMetadata).toBeUndefined();
  });

  it("should handle NFT loading errors gracefully", async () => {
    const { loadMultipleNFTMetadataNode } = await import("../utils/nodeNftLoader");
    vi.mocked(loadMultipleNFTMetadataNode).mockRejectedValue(new Error("Network error"));

    const { loadBlogs } = await import("../utils/blogLoader");

    // Should not throw
    const blogs = await loadBlogs("blog", "publishing_date");

    expect(blogs.length).toBe(3);
  });

  it("should validate NFT metadata structure", async () => {
    const { attachNFTMetadata } = await import("../utils/blogLoader");

    const mockBlogs: BlogPost[] = [{ title: "A", content: "", type: "react", tokenID: 123 }];

    const mockNFTMetadata: Record<number, NFTMetadata> = {
      123: {
        imageUrl: "https://example.com/image.png",
        prompt: "Test prompt",
        name: "Test NFT",
        description: "Test description",
      },
    };

    const result = attachNFTMetadata(mockBlogs, mockNFTMetadata);

    const nft = result[0].nftMetadata;
    expect(nft).toHaveProperty("imageUrl");
    expect(nft).toHaveProperty("prompt");
    expect(nft).toHaveProperty("name");
    expect(nft).toHaveProperty("description");
    expect(typeof nft?.imageUrl).toBe("string");
    expect(nft?.imageUrl.length).toBeGreaterThan(0);
  });

  it("should maintain blog structure with or without NFT metadata", async () => {
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    blogs.forEach((blog) => {
      expect(blog).toHaveProperty("title");
      expect(blog).toHaveProperty("content");
      expect(blog).toHaveProperty("type");
      expect(typeof blog.title).toBe("string");
      expect(blog.title.length).toBeGreaterThan(0);
    });
  });

  it("should return empty array for unsupported directory", async () => {
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("nonexistent", "publishing_date");

    expect(blogs).toEqual([]);
  });
});
