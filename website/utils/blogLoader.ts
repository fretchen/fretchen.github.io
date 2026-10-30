/**
 * Dynamic blog loader for hot reload support
 * This replaces the static JSON generation with dynamic loading
 */

import { BlogPost, NFTMetadata, TokenRef, tokenRefKey } from "../types/BlogPost";
import { getGenAiNFTMainnetNetworks } from "@fretchen/chain-utils";
import { GLOB_REGISTRY, type SupportedDirectory } from "./globRegistry";

// Global cache for build-time to prevent multiple loads during pre-rendering
const buildTimeCache = new Map<string, BlogPost[]>();

/** A frontmatter problem the build must fail on (an invalid declared network would otherwise
 * silently render the post without its image — exactly the ambiguity this exists to remove).
 * Distinguished so the per-file catch in loadBlogs can rethrow it instead of warning. */
export class InvalidFrontmatterError extends Error {}

/**
 * Extracts metadata from a loaded MDX module.
 * Pure function for easy testing.
 *
 * @param module - The loaded module object
 * @param path - The file path (used to generate a fallback title)
 * @returns Partial BlogPost with extracted metadata, or null if invalid
 */
export function extractMetadataFromModule(module: unknown, path: string): Partial<BlogPost> | null {
  if (!module || typeof module !== "object") {
    return null;
  }

  if (!path.endsWith(".mdx")) {
    return null;
  }

  const frontmatter = (module as { frontmatter?: Record<string, unknown> }).frontmatter;
  if (!frontmatter || typeof frontmatter !== "object") {
    return null;
  }

  const title = frontmatter.title as string | undefined;
  const publishingDate = frontmatter.publishing_date as string | undefined;
  const order = frontmatter.order as number | undefined;
  const tokenID = frontmatter.tokenID as number | undefined;
  const description = frontmatter.description as string | undefined;
  const category = frontmatter.category as string | undefined;
  const secondaryCategory = frontmatter.secondaryCategory as string | undefined;

  // A blog token is identified by id AND chain: the two GenImNFT mainnets have independent
  // id sequences (both have a #12), so a bare id alone is not an identifier. The bare form
  // stays valid and means Optimism mainnet — every legacy post's token lives there.
  let network: string | undefined;
  if (tokenID !== undefined) {
    network = (frontmatter.network as string | undefined) ?? "eip155:10";
    if (!getGenAiNFTMainnetNetworks().includes(network)) {
      throw new InvalidFrontmatterError(
        `${path}: frontmatter network "${network}" is not a GenImNFT mainnet network ` +
          `(valid: ${getGenAiNFTMainnetNetworks().join(", ")})`,
      );
    }
  }

  // Generate fallback title from filename if needed
  const cleanPath = path.replace(/\?.*$/, "");
  const fileName = cleanPath.split("/").pop() || "";
  const fallbackTitle = fileName.replace(/\.mdx$/, "");

  return {
    title: title || fallbackTitle,
    content: "",
    publishing_date: publishingDate,
    order: order,
    tokenID: tokenID,
    network: network,
    description: description,
    componentPath: path,
    category: category,
    secondaryCategory: secondaryCategory,
  };
}

/**
 * Attaches NFT metadata to blogs that have tokens.
 * Pure function for easy testing.
 *
 * @param blogs - Array of blog posts
 * @param nftMetadataMap - Map of tokenRefKey(network/id) to NFTMetadata
 * @returns New array with NFT metadata attached
 */
export function attachNFTMetadata(blogs: BlogPost[], nftMetadataMap: Record<string, NFTMetadata>): BlogPost[] {
  return blogs.map((blog) => {
    if (blog.tokenID && blog.network) {
      const metadata = nftMetadataMap[tokenRefKey({ network: blog.network, id: blog.tokenID })];
      if (metadata) {
        return { ...blog, nftMetadata: metadata };
      }
    }
    return blog;
  });
}

/**
 * Extracts unique token refs (network + id) from an array of blogs.
 * Pure function for easy testing.
 *
 * @param blogs - Array of blog posts
 * @returns Array of unique token refs
 */
export function extractTokenRefs(blogs: BlogPost[]): TokenRef[] {
  const seen = new Set<string>();
  const refs: TokenRef[] = [];
  for (const blog of blogs) {
    if (blog.tokenID === undefined || !blog.network) continue;
    const key = tokenRefKey({ network: blog.network, id: blog.tokenID });
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ network: blog.network, id: blog.tokenID });
  }
  return refs;
}

/**
 * Sorts an array of blog posts according to specified criteria.
 *
 * @param blogs - Array of blog posts to sort
 * @param sortBy - Sort criteria: "order" for manual ordering (e.g., tutorials) or "publishing_date" for chronological order
 * @returns Sorted array of blog posts (oldest first for publishing_date to maintain stable URLs)
 *
 * @remarks
 * - When sorting by "order", posts without order values remain in their original positions
 * - When sorting by "publishing_date", older posts appear first to ensure URL stability
 * - Posts without the specified sort field remain in their original order
 */
export function sortBlogs(blogs: BlogPost[], sortBy: "order" | "publishing_date" = "publishing_date"): BlogPost[] {
  const sortedBlogs = [...blogs];

  if (sortBy === "order") {
    sortedBlogs.sort((a, b) => {
      if (a.order && b.order) {
        return a.order - b.order;
      }
      return 0;
    });
  } else if (sortBy === "publishing_date") {
    // Sort by publishing date with OLDEST first to keep stable URLs
    sortedBlogs.sort((a, b) => {
      if (a.publishing_date && b.publishing_date) {
        return new Date(a.publishing_date).getTime() - new Date(b.publishing_date).getTime();
      }
      return 0;
    });
  }

  return sortedBlogs;
}

/**
 * Dynamically loads blog posts from a specified directory with hot reload support.
 *
 * @param directory - Target directory path (e.g., "blog", "quantum/basics", "quantum/amo")
 * @param sortBy - Sort criteria: "order" for manual ordering or "publishing_date" for chronological
 * @returns Promise resolving to array of loaded and sorted blog posts
 *
 * @remarks
 * This function replaces the old static JSON generation system with dynamic loading:
 * - Uses Vite's `import.meta.glob` for automatic dependency tracking and HMR
 * - Processes MDX files, extracting frontmatter metadata automatically via remark plugins
 * - Supports hot reload: changes to blog files trigger instant updates without page refresh
 *
 * @example
 * ```typescript
 * // Load blog posts sorted by publishing date
 * const blogs = await loadBlogs("blog", "publishing_date");
 *
 * // Load tutorial posts sorted by manual order
 * const tutorials = await loadBlogs("quantum/basics", "order");
 * ```
 *
 * @throws Will log warnings for files that fail to load but continues processing other files
 */
export async function loadBlogs(
  directory: string,
  sortBy: "order" | "publishing_date" = "publishing_date",
): Promise<BlogPost[]> {
  const normalizedDir = directory.replace(/^\//, "").replace(/\/$/, "");

  // Check cache during build-time to prevent multiple loads
  const cacheKey = `${normalizedDir}-${sortBy}`;
  if (import.meta.env.SSR && buildTimeCache.has(cacheKey)) {
    return buildTimeCache.get(cacheKey)!;
  }

  // Check if directory is supported by glob registry
  const registry = GLOB_REGISTRY[normalizedDir as SupportedDirectory];
  if (!registry) {
    console.warn(
      `[BlogLoader] Directory "${normalizedDir}" not found in glob registry. Supported: ${Object.keys(GLOB_REGISTRY).join(", ")}`,
    );
    return [];
  }

  // Process all MDX files
  const blogs: BlogPost[] = [];

  for (const [path, module] of Object.entries(registry.modules)) {
    try {
      const cleanPath = path.replace(/\?.*$/, "");

      const metadata = extractMetadataFromModule(module, path);
      if (!metadata) {
        console.warn(`[BlogLoader] No valid metadata found in ${cleanPath}, skipping`);
        continue;
      }

      blogs.push(metadata as BlogPost);
    } catch (error) {
      // An invalid declared network must fail the build, not degrade into a warning —
      // a Base-minted post that silently renders without its image is the ambiguity this
      // validation exists to prevent.
      if (error instanceof InvalidFrontmatterError) throw error;
      console.warn(`[BlogLoader] Failed to process ${path}:`, error);
    }
  }

  const sortedBlogs = sortBlogs(blogs, sortBy);

  // Load NFT metadata for blogs with tokenIDs (only during SSR/build)
  if (import.meta.env.SSR) {
    const tokenRefs = extractTokenRefs(sortedBlogs);

    if (tokenRefs.length > 0) {
      try {
        console.log(
          `[BlogLoader] Loading NFT metadata for ${tokenRefs.length} tokens: ${tokenRefs.map(tokenRefKey).join(", ")}`,
        );

        // Dynamically import the Node.js-specific NFT loader
        const { loadMultipleNFTMetadataNode } = await import("./nodeNftLoader");
        const nftMetadataMap = await loadMultipleNFTMetadataNode(tokenRefs);

        // Use pure function for attaching NFT metadata
        const blogsWithNFT = attachNFTMetadata(sortedBlogs, nftMetadataMap);

        console.log(`[BlogLoader] Successfully loaded metadata for ${Object.keys(nftMetadataMap).length} NFTs`);

        // Cache for build-time to prevent reloading
        buildTimeCache.set(cacheKey, blogsWithNFT);
        return blogsWithNFT;
      } catch (error) {
        console.warn("[BlogLoader] Failed to load NFT metadata:", error);
      }
    }

    // Cache for build-time to prevent reloading
    buildTimeCache.set(cacheKey, sortedBlogs);
  }

  return sortedBlogs;
}
