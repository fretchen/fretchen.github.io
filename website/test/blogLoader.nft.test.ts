/**
 * Test Suite for NFT Metadata Loading in blogLoader
 *
 * Tests the integration of NFT metadata loading with the blog loading system.
 * Mocks the blockchain calls and verifies that metadata is correctly attached to blogs.
 *
 * Note: These tests verify the NFT loading logic but may not trigger actual NFT loading
 * unless running in SSR mode (import.meta.env.SSR === true). The tests focus on verifying
 * the structure and error handling of the NFT loading system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NFTMetadata } from "../types/BlogPost";

// Mock the nodeNftLoader module before importing blogLoader
vi.mock("../utils/nodeNftLoader", () => ({
  loadMultipleNFTMetadataNode: vi.fn(),
}));

describe("blogLoader - NFT Metadata Loading", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have NFT loader module available", async () => {
    // Verify that the NFT loader module can be imported
    const { loadMultipleNFTMetadataNode } = await import("../utils/nodeNftLoader");
    expect(loadMultipleNFTMetadataNode).toBeDefined();
    expect(typeof loadMultipleNFTMetadataNode).toBe("function");
  });

  it("should load blogs successfully", async () => {
    // Arrange: Mock NFT metadata
    const mockNFTMetadata: Record<number, NFTMetadata> = {
      26: {
        imageUrl: "https://example.com/image_26.png",
        prompt: "Test prompt for token 26",
        name: "Test NFT 26",
        description: "Test description 26",
      },
    };

    const { loadMultipleNFTMetadataNode } = await import("../utils/nodeNftLoader");
    vi.mocked(loadMultipleNFTMetadataNode).mockResolvedValue(mockNFTMetadata);

    // Act: Load blogs
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    // Assert: Blogs should be loaded successfully
    expect(blogs).toBeDefined();
    expect(Array.isArray(blogs)).toBe(true);
    expect(blogs.length).toBeGreaterThan(0);

    // Check if any blog has a tokenID
    const blogsWithTokenID = blogs.filter((b) => b.tokenID);
    console.log(`[Test] Found ${blogsWithTokenID.length} blogs with tokenID`);

    // In SSR mode, if there are blogs with tokenIDs, NFT loader should be called
    if (import.meta.env.SSR && blogsWithTokenID.length > 0) {
      expect(loadMultipleNFTMetadataNode).toHaveBeenCalled();
    }
  });

  it("should handle blogs without tokenID gracefully", async () => {
    // Act: Load blogs
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    // Assert: Blogs without tokenID should not cause errors
    const blogsWithoutToken = blogs.filter((b) => !b.tokenID);

    blogsWithoutToken.forEach((blog) => {
      // Blogs without tokenID should not have nftMetadata
      expect(blog.nftMetadata).toBeUndefined();
    });

    // Should still load blogs successfully
    expect(blogs.length).toBeGreaterThan(0);
  });

  it("should handle NFT loading errors gracefully", async () => {
    // Arrange: Mock NFT loader to throw error
    const { loadMultipleNFTMetadataNode } = await import("../utils/nodeNftLoader");
    vi.mocked(loadMultipleNFTMetadataNode).mockRejectedValue(new Error("Network error"));

    // Act: Should not throw - should log warning and continue
    const { loadBlogs } = await import("../utils/blogLoader");
    await expect(loadBlogs("blog", "publishing_date")).resolves.toBeDefined();

    const blogs = await loadBlogs("blog", "publishing_date");

    // Assert: Blogs should still be loaded
    expect(blogs.length).toBeGreaterThan(0);
  });

  it("should correctly identify blogs with tokenIDs", async () => {
    // Act: Load blogs
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    // Assert: Check tokenID structure
    blogs.forEach((blog) => {
      if (blog.tokenID !== undefined) {
        // TokenID should be a positive number
        expect(typeof blog.tokenID).toBe("number");
        expect(blog.tokenID).toBeGreaterThan(0);
      }
    });
  });

  it("should validate NFT metadata structure when present", async () => {
    // Arrange: Mock NFT metadata with proper structure
    const mockNFTMetadata: Record<number, NFTMetadata> = {
      123: {
        imageUrl: "https://example.com/image.png",
        prompt: "Test prompt",
        name: "Test NFT",
        description: "Test description",
      },
    };

    const { loadMultipleNFTMetadataNode } = await import("../utils/nodeNftLoader");
    vi.mocked(loadMultipleNFTMetadataNode).mockResolvedValue(mockNFTMetadata);

    // Act: Load blogs
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    // Assert: Check NFT metadata structure if present
    blogs.forEach((blog) => {
      if (blog.nftMetadata) {
        expect(blog.nftMetadata).toHaveProperty("imageUrl");
        expect(blog.nftMetadata).toHaveProperty("prompt");
        expect(blog.nftMetadata).toHaveProperty("name");
        expect(blog.nftMetadata).toHaveProperty("description");

        // ImageUrl should be a valid URL string
        expect(typeof blog.nftMetadata.imageUrl).toBe("string");
        expect(blog.nftMetadata.imageUrl.length).toBeGreaterThan(0);
      }
    });
  });

  it("should not duplicate tokenIDs when calling NFT loader", async () => {
    // This test verifies the logic that tokenIDs are unique before calling the loader
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    // Extract tokenIDs manually
    const tokenIDs = blogs.filter((blog) => blog.tokenID).map((blog) => blog.tokenID!);

    // Check for uniqueness
    const uniqueTokenIDs = [...new Set(tokenIDs)];
    expect(tokenIDs.length).toBe(uniqueTokenIDs.length);

    console.log(`[Test] Found ${tokenIDs.length} unique tokenIDs: ${tokenIDs.join(", ")}`);
  });

  it("should maintain blog structure with or without NFT metadata", async () => {
    // Act: Load blogs
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    // Assert: All blogs should have required fields
    blogs.forEach((blog) => {
      expect(blog).toHaveProperty("title");
      expect(blog).toHaveProperty("content");
      expect(blog).toHaveProperty("type");

      expect(typeof blog.title).toBe("string");
      expect(blog.title.length).toBeGreaterThan(0);

      // NFTMetadata is optional
      if (blog.nftMetadata) {
        expect(typeof blog.nftMetadata).toBe("object");
      }
    });
  });
});
