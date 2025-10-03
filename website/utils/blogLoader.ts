/**
 * Dynamic blog loader for hot reload support
 * This replaces the static JSON generation with dynamic loading
 */

import { BlogPost } from "../types/BlogPost";

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
function sortBlogs(blogs: BlogPost[], sortBy: "order" | "publishing_date" = "publishing_date"): BlogPost[] {
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
 * - Processes both Markdown/MDX files (.md, .mdx) and TypeScript files (.tsx)
 * - Extracts frontmatter metadata automatically via remark plugins
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

  // MVP: Only support blog directory to avoid memory issues
  if (normalizedDir !== "blog") {
    console.warn(`[BlogLoader] Only "blog" directory is supported in MVP. Requested: ${normalizedDir}`);
    return [];
  }

  // Environment-based loading: eager in production, lazy in development
  let allMarkdownModules: Record<string, () => Promise<unknown>>;
  let allTsxModules: Record<string, () => Promise<unknown>>;

  if (import.meta.env.PROD) {
    // Production: eager loading to prevent memory issues during build
    const markdownEager = import.meta.glob("../blog/*.{md,mdx}", { eager: true }) as Record<string, unknown>;
    const tsxEager = import.meta.glob("../blog/*.tsx", { eager: true }) as Record<string, unknown>;

    // Convert eager imports to loader functions for consistent interface
    allMarkdownModules = Object.fromEntries(
      Object.entries(markdownEager).map(([path, module]) => [path, async () => module])
    );
    allTsxModules = Object.fromEntries(
      Object.entries(tsxEager).map(([path, module]) => [path, async () => module])
    );
  } else {
    // Development: lazy loading for HMR support
    allMarkdownModules = import.meta.glob("../blog/*.{md,mdx}", { eager: false });
    allTsxModules = import.meta.glob("../blog/*.tsx", { eager: false });
  }

  // No filtering needed since we only load blog files
  const blogs: BlogPost[] = [];

  // Process all blog files (MDX and TSX) - they're all React components now
  const allModules = {
    ...allMarkdownModules,
    ...allTsxModules,
  };

  for (const [path, moduleLoader] of Object.entries(allModules)) {
    try {
      const cleanPath = path.replace(/\?.*$/, "");
      const isTsx = path.endsWith(".tsx");
      const isMdx = path.endsWith(".md") || path.endsWith(".mdx");

      // Load the module
      const module = await moduleLoader();

      if (!module || typeof module !== "object") {
        console.error(`[BlogLoader] Invalid module structure for ${cleanPath}`);
        continue;
      }

      // Extract metadata (different sources for MDX vs TSX)
      let title: string | undefined;
      let publishingDate: string | undefined;
      let order: number | undefined;
      let tokenID: number | undefined;

      if (isMdx) {
        // MDX files export frontmatter
        const frontmatter = (module as { frontmatter?: Record<string, unknown> }).frontmatter;

        if (!frontmatter || typeof frontmatter !== "object") {
          console.warn(`[BlogLoader] No frontmatter found in ${cleanPath}, skipping`);
          continue;
        }

        title = frontmatter.title as string | undefined;
        publishingDate = frontmatter.publishing_date as string | undefined;
        order = frontmatter.order as number | undefined;
        tokenID = frontmatter.tokenID as number | undefined;
      } else if (isTsx) {
        // TSX files export meta object
        const meta = (module as { meta?: { title?: string; publishing_date?: string; tokenID?: number } })?.meta || {};

        title = meta.title;
        publishingDate = meta.publishing_date;
        tokenID = meta.tokenID;
      }

      // Generate fallback title from filename if needed
      const fileName = cleanPath.split("/").pop() || "";
      const fallbackTitle = isTsx
        ? fileName
            .replace(".tsx", "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())
        : fileName.replace(/\.(md|mdx)$/, "");

      // Create blog post object
      const blog: BlogPost = {
        title: title || fallbackTitle,
        content: "", // Content is rendered as React component
        type: "react",
        publishing_date: publishingDate,
        order: order,
        tokenID: tokenID,
        componentPath: path,
      };

      blogs.push(blog);
    } catch (error) {
      console.warn(`[BlogLoader] Failed to process ${path}:`, error);
    }
  }

  const sortedBlogs = sortBlogs(blogs, sortBy);
  return sortedBlogs;
}
