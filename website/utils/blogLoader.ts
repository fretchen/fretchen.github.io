/**
 * Dynamic blog loader for hot reload support
 * This replaces the static JSON generation with dynamic loading
 */

import { BlogPost } from "../types/BlogPost";

// Utility function to extract frontmatter metadata
function extractMeta(metaString: string, key: string): string | undefined {
  const patterns = [
    new RegExp(`${key}:\\s*"([^"]*)"`, "i"),
    new RegExp(`${key}:\\s*'([^']*)'`, "i"),
    new RegExp(`${key}:\\s*([^\\s\\n]+)`, "i"),
  ];
  
  for (const pattern of patterns) {
    const match = metaString.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return undefined;
}

// Parse markdown content with frontmatter
function parseMarkdownWithFrontmatter(content: string, filePath: string): BlogPost {
  console.log(`[Parser] Parsing file: ${filePath}`);
  console.log(`[Parser] Content preview: ${content.substring(0, 200)}...`);
  
  const frontMatter = content.match(/---([\s\S]*?)---/);
  
  if (frontMatter) {
    console.log(`[Parser] Found frontmatter in ${filePath}`);
    const blogContent = content.replace(frontMatter[0], "").trim();
    const meta = frontMatter[1];
    
    console.log(`[Parser] Frontmatter content: ${meta}`);
    
    const title = extractMeta(meta, "title");
    const publishingDate = extractMeta(meta, "publishing_date");
    const order = extractMeta(meta, "order");
    const tokenID = extractMeta(meta, "tokenID");
    
    console.log(`[Parser] Extracted metadata - Title: "${title}", Date: "${publishingDate}", Order: "${order}", TokenID: "${tokenID}"`);
    
    const blogPost = {
      title: title || "",
      content: blogContent,
      type: "markdown" as const,
      publishing_date: publishingDate,
      order: order ? parseInt(order) : undefined,
      tokenID: tokenID ? parseInt(tokenID) : undefined,
    };
    
    console.log(`[Parser] Created blog post object:`, blogPost);
    return blogPost;
  }
  
  // Fallback without frontmatter
  console.log(`[Parser] No frontmatter found in ${filePath}, using filename as title`);
  const fileName =
    filePath
      .split("/")
      .pop()
      ?.replace(/\.(md|mdx)$/, "") || "";
      
  const blogPost = {
    title: fileName,
    content: content,
    type: "markdown" as const,
  };
  
  console.log(`[Parser] Created fallback blog post:`, blogPost);
  return blogPost;
}

// Sort blogs according to criteria
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

// Runtime blog loader using Vite's import.meta.glob
export async function loadBlogsRuntime(
  directory: string,
  sortBy: "order" | "publishing_date" = "publishing_date",
): Promise<BlogPost[]> {
  console.log(`[BlogLoader] Loading blogs from directory: ${directory}`);
  
  // Vite's import.meta.glob requires static patterns, so we define all possible patterns
  const allMarkdownModules = import.meta.glob([
    "../blog/*.{md,mdx}",
    "../quantum/amo/*.{md,mdx}",
    "../quantum/basics/*.{md,mdx}",
    "../quantum/hardware/*.{md,mdx}",
    "../quantum/qml/*.{md,mdx}",
  ], {
    as: "raw",
    eager: false,
  });
  
  const allTsxModules = import.meta.glob([
    "../blog/*.tsx",
    "../quantum/amo/*.tsx",
    "../quantum/basics/*.tsx",
    "../quantum/hardware/*.tsx",
    "../quantum/qml/*.tsx",
  ], {
    eager: false,
  });
  
  console.log(`[BlogLoader] Total markdown files found:`, Object.keys(allMarkdownModules).length);
  console.log(`[BlogLoader] Total TypeScript files found:`, Object.keys(allTsxModules).length);
  
  // Filter modules by target directory
  const normalizedDir = directory.replace(/^\//, "").replace(/\/$/, "");
  
  // Filter markdown modules
  const relevantMarkdownModules: Record<string, () => Promise<string>> = {};
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
  
  console.log(`[BlogLoader] Filtered to ${Object.keys(relevantMarkdownModules).length} markdown files for directory: ${normalizedDir}`);
  console.log(`[BlogLoader] Filtered to ${Object.keys(relevantTsxModules).length} TypeScript files for directory: ${normalizedDir}`);
  console.log(`[BlogLoader] Relevant markdown files:`, Object.keys(relevantMarkdownModules));
  console.log(`[BlogLoader] Relevant TypeScript files:`, Object.keys(relevantTsxModules));
  
  const blogs: BlogPost[] = [];
  
  // Process markdown files
  for (const [path, loader] of Object.entries(relevantMarkdownModules)) {
    try {
      console.log(`[BlogLoader] Processing markdown file: ${path}`);
      const content = (await loader()) as string;
      console.log(`[BlogLoader] Loaded content length: ${content.length} characters`);
      const blog = parseMarkdownWithFrontmatter(content, path);
      blogs.push(blog);
      console.log(`[BlogLoader] Successfully parsed markdown: ${path} - Title: "${blog.title}"`);
    } catch (error) {
      console.warn(`[BlogLoader] Failed to load ${path}:`, error);
    }
  }
  
  // Process TypeScript blog files
  for (const [path] of Object.entries(relevantTsxModules)) {
    try {
      console.log(`[BlogLoader] Processing TypeScript file: ${path}`);
      const fileName = path.split("/").pop()?.replace(".tsx", "") || "";
      
      // Create blog entry for TypeScript files
      const blog: BlogPost = {
        title: fileName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        content: "", // TypeScript blogs have their own rendering
        type: "typescript",
        componentPath: path,
      };
      
      blogs.push(blog);
      console.log(`[BlogLoader] Successfully loaded TypeScript blog: ${path} - Title: "${blog.title}"`);
    } catch (error) {
      console.warn(`[BlogLoader] Failed to process TypeScript blog ${path}:`, error);
    }
  }
  
  const sortedBlogs = sortBlogs(blogs, sortBy);
  console.log(`[BlogLoader] Loaded ${sortedBlogs.length} blogs from ${directory}`);
  
  return sortedBlogs;
}

// Load blogs with fallback to static JSON (for production compatibility)
export async function loadBlogsWithFallback(
  directory: string,
  sortBy: "order" | "publishing_date" = "publishing_date",
): Promise<BlogPost[]> {
  if (import.meta.env.DEV) {
    // Development: Use dynamic loading
    return loadBlogsRuntime(directory, sortBy);
  } else {
    // Production: Fallback to static JSON for now
    try {
      const jsonPath = directory.startsWith("/") ? directory.substring(1) : directory;
      const response = await fetch(`/${jsonPath}/blogs.json`);
      if (response.ok) {
        const blogs = await response.json();
        console.log(`[BlogLoader] Loaded ${blogs.length} blogs from static JSON: ${jsonPath}/blogs.json`);
        return blogs;
      }
    } catch (error) {
      console.warn(`[BlogLoader] Failed to load static JSON for ${directory}, falling back to dynamic loading:`, error);
    }
    
    // Fallback to dynamic loading even in production
    return loadBlogsRuntime(directory, sortBy);
  }
}