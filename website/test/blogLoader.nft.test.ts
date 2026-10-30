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
      modules: {
        "../blog/post_with_token.mdx": {
          frontmatter: {
            title: "Post With Token",
            publishing_date: "2025-01-15",
            tokenID: 26,
          },
        },
        "../blog/post_without_token.mdx": {
          frontmatter: {
            title: "Post Without Token",
            publishing_date: "2025-01-10",
          },
        },
        "../blog/interactive.mdx": {
          frontmatter: {
            title: "Interactive Post",
            publishing_date: "2025-01-20",
            tokenID: 42,
          },
        },
        "../blog/base_post.mdx": {
          frontmatter: {
            title: "Base Post",
            publishing_date: "2025-01-25",
            tokenID: 12,
            network: "eip155:8453",
          },
        },
      },
    },
    // Loaded only by the invalid-network test below — a bad declared network must fail
    // the load rather than degrade into a warning that silently drops the image.
    "quantum/amo": {
      modules: {
        "../quantum/amo/bad_network.mdx": {
          frontmatter: {
            title: "Bad Network Post",
            publishing_date: "2025-01-01",
            tokenID: 1,
            network: "eip155:84532",
          },
        },
      },
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
    expect(blogs.length).toBe(4);

    const titles = blogs.map((b) => b.title);
    expect(titles).toContain("Post With Token");
    expect(titles).toContain("Post Without Token");
    expect(titles).toContain("Interactive Post");
    expect(titles).toContain("Base Post");
  });

  it("should sort blogs by publishing_date (oldest first)", async () => {
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    expect(blogs[0].title).toBe("Post Without Token"); // 2025-01-10
    expect(blogs[1].title).toBe("Post With Token"); // 2025-01-15
    expect(blogs[2].title).toBe("Interactive Post"); // 2025-01-20
    expect(blogs[3].title).toBe("Base Post"); // 2025-01-25
  });

  it("should correctly identify blogs with tokenIDs", async () => {
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    const blogsWithToken = blogs.filter((b) => b.tokenID !== undefined);
    expect(blogsWithToken.length).toBe(3);

    const tokenIDs = blogsWithToken.map((b) => b.tokenID);
    expect(tokenIDs).toContain(26);
    expect(tokenIDs).toContain(42);
    expect(tokenIDs).toContain(12);
  });

  it("resolves a bare tokenID to the legacy Optimism default and passes a declared network through", async () => {
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    // Both legacy posts carry no network in their frontmatter; the loader must make the
    // default concrete so downstream resolution never guesses.
    expect(blogs.find((b) => b.title === "Post With Token")?.network).toBe("eip155:10");
    expect(blogs.find((b) => b.title === "Interactive Post")?.network).toBe("eip155:10");
    expect(blogs.find((b) => b.title === "Base Post")?.network).toBe("eip155:8453");
    expect(blogs.find((b) => b.title === "Post Without Token")?.network).toBeUndefined();
  });

  it("fails the load when a post declares a network GenImNFT is not deployed on", async () => {
    const { loadBlogs } = await import("../utils/blogLoader");

    // Fail the build, not a warning: a Base post whose network is wrong would otherwise
    // render without its image — exactly the ambiguity this validation removes.
    await expect(loadBlogs("quantum/amo", "publishing_date")).rejects.toThrow(/not a GenImNFT mainnet network/);
  });

  it("should handle blogs without tokenID gracefully", async () => {
    const { loadBlogs } = await import("../utils/blogLoader");
    const blogs = await loadBlogs("blog", "publishing_date");

    const blogsWithoutToken = blogs.filter((b) => !b.tokenID);
    expect(blogsWithoutToken.length).toBe(1);
    expect(blogsWithoutToken[0].title).toBe("Post Without Token");
    expect(blogsWithoutToken[0].nftMetadata).toBeUndefined();
  });

  it("should extract unique token refs, distinguishing the same id on two chains", async () => {
    const { extractTokenRefs } = await import("../utils/blogLoader");

    const mockBlogs: BlogPost[] = [
      { title: "A", content: "", tokenID: 26, network: "eip155:10" },
      { title: "B", content: "", tokenID: 12, network: "eip155:10" },
      // The collision this exists for: OP #12 and Base #12 are different tokens.
      { title: "C", content: "", tokenID: 12, network: "eip155:8453" },
      { title: "D", content: "", tokenID: 26, network: "eip155:10" }, // Duplicate ref
      { title: "E", content: "" }, // No tokenID
    ];

    const refs = extractTokenRefs(mockBlogs);

    expect(refs.length).toBe(3);
    expect(refs.map((r) => `${r.network}/${r.id}`)).toEqual(
      expect.arrayContaining(["eip155:10/26", "eip155:10/12", "eip155:8453/12"]),
    );
  });

  it("should attach NFT metadata correctly, keyed per network and id", async () => {
    const { attachNFTMetadata } = await import("../utils/blogLoader");

    const mockBlogs: BlogPost[] = [
      { title: "A", content: "", tokenID: 26, network: "eip155:10" },
      { title: "B", content: "" },
    ];

    const mockNFTMetadata: Record<string, NFTMetadata> = {
      "eip155:10/26": {
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

  it("attaches per-chain metadata when the same id exists on both chains", async () => {
    const { attachNFTMetadata } = await import("../utils/blogLoader");

    // The live collision: OP #12 and Base #12 are both minted. The key decides which image
    // a post gets — the bare id never can.
    const mockBlogs: BlogPost[] = [
      { title: "OP #12", content: "", tokenID: 12, network: "eip155:10" },
      { title: "Base #12", content: "", tokenID: 12, network: "eip155:8453" },
    ];

    const mockNFTMetadata: Record<string, NFTMetadata> = {
      "eip155:10/12": {
        imageUrl: "https://example.com/op-12.png",
        prompt: "p",
        name: "OP 12",
        description: "d",
      },
      "eip155:8453/12": {
        imageUrl: "https://example.com/base-12.png",
        prompt: "p",
        name: "Base 12",
        description: "d",
      },
    };

    const result = attachNFTMetadata(mockBlogs, mockNFTMetadata);

    expect(result[0].nftMetadata?.name).toBe("OP 12");
    expect(result[0].nftMetadata?.imageUrl).toBe("https://example.com/op-12.png");
    expect(result[1].nftMetadata?.name).toBe("Base 12");
    expect(result[1].nftMetadata?.imageUrl).toBe("https://example.com/base-12.png");
  });

  it("should handle NFT loading errors gracefully", async () => {
    const { loadMultipleNFTMetadataNode } = await import("../utils/nodeNftLoader");
    vi.mocked(loadMultipleNFTMetadataNode).mockRejectedValue(new Error("Network error"));

    const { loadBlogs } = await import("../utils/blogLoader");

    // Should not throw
    const blogs = await loadBlogs("blog", "publishing_date");

    expect(blogs.length).toBe(4);
  });

  it("should validate NFT metadata structure", async () => {
    const { attachNFTMetadata } = await import("../utils/blogLoader");

    const mockBlogs: BlogPost[] = [{ title: "A", content: "", tokenID: 123, network: "eip155:10" }];

    const mockNFTMetadata: Record<string, NFTMetadata> = {
      "eip155:10/123": {
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
