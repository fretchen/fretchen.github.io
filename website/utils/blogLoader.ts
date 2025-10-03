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
  // Vite's import.meta.glob requires static patterns, so we define all possible patterns
  // Load markdown files - they will be processed by MDX plugin
  const allMarkdownModules = import.meta.glob(
    [
      "../blog/*.{md,mdx}",
      "../quantum/amo/*.{md,mdx}",
      "../quantum/basics/*.{md,mdx}",
      "../quantum/hardware/*.{md,mdx}",
      "../quantum/qml/*.{md,mdx}",
    ],
    {
      eager: false,
    },
  );

  const allTsxModules = import.meta.glob(
    [
      "../blog/*.tsx",
      "../quantum/amo/*.tsx",
      "../quantum/basics/*.tsx",
      "../quantum/hardware/*.tsx",
      "../quantum/qml/*.tsx",
    ],
    {
      eager: false,
    },
  );

  // Filter modules by target directory
  const normalizedDir = directory.replace(/^\//, "").replace(/\/$/, "");

  // Filter markdown modules
  const relevantMarkdownModules: Record<string, () => Promise<unknown>> = {};
  const relevantTsxModules: Record<string, () => Promise<unknown>> = {};

  for (const [path, loader] of Object.entries(allMarkdownModules)) {
    const isTargetFile =
      (normalizedDir === "blog" && path.includes("../blog/") && !path.includes("/quantum/")) ||
      path.includes(`../${normalizedDir}/`);

    if (isTargetFile) {
      relevantMarkdownModules[path] = loader;
    }
  }

  for (const [path, loader] of Object.entries(allTsxModules)) {
    const isTargetFile =
      (normalizedDir === "blog" && path.includes("../blog/") && !path.includes("/quantum/")) ||
      path.includes(`../${normalizedDir}/`);

    if (isTargetFile) {
      relevantTsxModules[path] = loader;
    }
  }

  const blogs: BlogPost[] = [];

  // Process markdown files
  for (const [path] of Object.entries(relevantMarkdownModules)) {
    try {
      const cleanPath = path.replace(/\?.*$/, "");

      // Load the MDX module - it will be a React component with exported frontmatter
      const module = await relevantMarkdownModules[path]();

      // MDX modules export: default (component), frontmatter (metadata)
      if (module && typeof module === "object") {
        const frontmatter = (module as { frontmatter?: Record<string, unknown> }).frontmatter;

        if (frontmatter && typeof frontmatter === "object") {
          // Extract metadata from frontmatter
          const title = frontmatter.title as string | undefined;
          const publishingDate = frontmatter.publishing_date as string | undefined;
          const order = frontmatter.order as number | undefined;
          const tokenID = frontmatter.tokenID as number | undefined;

          // Create blog post with MDX component
          const blog: BlogPost = {
            title:
              title ||
              cleanPath
                .split("/")
                .pop()
                ?.replace(/\.(md|mdx)$/, "") ||
              "",
            content: "", // MDX content is rendered as component
            type: "react", // MDX files are now React components
            publishing_date: publishingDate,
            order: order,
            tokenID: tokenID,
            componentPath: path, // Store path for rendering
          };

          blogs.push(blog);
        } else {
          console.warn(`[BlogLoader] No frontmatter found in ${cleanPath}, skipping`);
        }
      } else {
        console.error(`[BlogLoader] Invalid module structure for ${cleanPath}`);
      }
    } catch (error) {
      console.warn(`[BlogLoader] Failed to process ${path}:`, error);
    }
  }

  // Process TypeScript blog files
  for (const [path, module] of Object.entries(relevantTsxModules)) {
    try {
      // Import the module to get meta export
      const mod = await module();
      const meta = (mod as { meta?: { title?: string; publishing_date?: string; tokenID?: number } })?.meta || {};

      const fileName = path.split("/").pop()?.replace(".tsx", "") || "";

      // Create blog entry for TypeScript files
      const blog: BlogPost = {
        title: meta.title || fileName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        publishing_date: meta.publishing_date,
        tokenID: meta.tokenID,
        content: "", // TypeScript blogs have their own rendering
        type: "react", // Changed from "typescript" to "react" to use ReactPostRenderer
        componentPath: path,
      };

      blogs.push(blog);
    } catch (error) {
      console.warn(`[BlogLoader] Failed to process TypeScript blog ${path}:`, error);
    }
  }

  const sortedBlogs = sortBlogs(blogs, sortBy);
  return sortedBlogs;
}
