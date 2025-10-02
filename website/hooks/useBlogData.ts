/**
 * Hook for dynamic blog data loading with hot reload support
 */

import { useState, useEffect } from "react";
import { BlogPost } from "../types/BlogPost";
import { loadBlogsWithFallback } from "../utils/blogLoader";

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
    
    async function loadBlogs() {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[useBlogData] Loading blogs from: ${directory}`);
        const blogData = await loadBlogsWithFallback(directory, sortBy);
        
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
    
    loadBlogs();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      cancelled = true;
    };
  }, [directory, sortBy]);
  
  return { blogs, loading, error };
}

// Static hook that uses the existing JSON import (for comparison/fallback)
export function useStaticBlogData(directory: string): BlogPost[] {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  
  useEffect(() => {
    async function loadStaticBlogs() {
      try {
        let staticBlogs: BlogPost[] = [];
        
        switch (directory) {
          case "/blog":
          case "blog": {
            const blogModule = await import("../blog/blogs.json");
            staticBlogs = blogModule.default;
            break;
          }
          case "/quantum/amo":
          case "quantum/amo": {
            const amoModule = await import("../quantum/amo/blogs.json");
            staticBlogs = amoModule.default;
            break;
          }
          case "/quantum/basics":
          case "quantum/basics": {
            const basicsModule = await import("../quantum/basics/blogs.json");
            staticBlogs = basicsModule.default;
            break;
          }
          case "/quantum/hardware":
          case "quantum/hardware": {
            const hardwareModule = await import("../quantum/hardware/blogs.json");
            staticBlogs = hardwareModule.default;
            break;
          }
          case "/quantum/qml":
          case "quantum/qml": {
            const qmlModule = await import("../quantum/qml/blogs.json");
            staticBlogs = qmlModule.default;
            break;
          }
          default:
            console.warn(`[useStaticBlogData] No static data available for directory: ${directory}`);
        }
        
        setBlogs(staticBlogs);
      } catch (error) {
        console.error(`[useStaticBlogData] Failed to load static blogs for ${directory}:`, error);
        setBlogs([]);
      }
    }
    
    loadStaticBlogs();
  }, [directory]);
  
  return blogs;
}