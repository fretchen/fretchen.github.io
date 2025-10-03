/**
 * Hook for dynamic blog data loading with hot reload support
 */

import { useState, useEffect } from "react";
import { BlogPost } from "../types/BlogPost";
import { loadBlogs } from "../utils/blogLoader";

/**
 * React hook for loading blog data with automatic hot reload support.
 *
 * @param directory - Target directory path (e.g., "blog", "quantum/basics", "quantum/amo")
 * @param sortBy - Sort criteria: "order" for manual ordering or "publishing_date" for chronological
 * @returns Object containing blogs array, loading state, and error message
 *
 * @remarks
 * This hook provides a React-friendly interface to the dynamic blog loader:
 * - Automatically loads blogs when component mounts or parameters change
 * - Provides loading state for rendering skeleton/spinner UIs
 * - Handles errors gracefully with error messages
 * - Prevents memory leaks by cancelling pending requests on unmount
 * - Supports hot reload: blog file changes trigger automatic re-fetch
 *
 * @example
 * ```typescript
 * function BlogList() {
 *   const { blogs, loading, error } = useBlogData("blog", "publishing_date");
 *
 *   if (loading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error}</p>;
 *
 *   return <EntryList blogs={blogs} />;
 * }
 * ```
 */
export function useBlogData(
  directory: string,
  sortBy: "order" | "publishing_date" = "publishing_date",
): {
  blogs: BlogPost[];
  loading: boolean;
  error: string | null;
} {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchBlogs() {
      try {
        setLoading(true);
        setError(null);

        const blogData = await loadBlogs(directory, sortBy);

        if (!cancelled) {
          setBlogs(blogData);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
          setError(errorMessage);
          console.error(`[useBlogData] Failed to load blogs from ${directory}:`, err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBlogs();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      cancelled = true;
    };
  }, [directory, sortBy]);

  return { blogs, loading, error };
}
