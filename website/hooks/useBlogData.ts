/**
 * Hook for dynamic blog data loading with hot reload support
 */

import { useState, useEffect } from "react";
import { BlogPost } from "../types/BlogPost";
import { loadBlogs } from "../utils/blogLoader";

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
        
        console.log(`[useBlogData] Loading blogs from: ${directory}`);
        const blogData = await loadBlogs(directory, sortBy);
        
        if (!cancelled) {
          setBlogs(blogData);
          console.log(`[useBlogData] Successfully loaded ${blogData.length} blogs`);
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
