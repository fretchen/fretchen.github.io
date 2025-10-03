/**
 * Dynamic blog loader for hot reload support
 * This replaces the static JSON generation with dynamic loading
 */

import { BlogPost } from "../types/BlogPost";

// Utility function to extract frontmatter metadata
function extractMeta(metaString: string, key: string): string | undefined {
  const patterns = [
    new RegExp(`${key}:\\s*"([^"]*)"`, "i"), // Double quotes
    new RegExp(`${key}:\\s*'([^']*)'`, "i"), // Single quotes
    new RegExp(`${key}:\\s*(.+?)(?:\\n|$)`, "i"), // Rest of line until newline or end
  ];

  for (const pattern of patterns) {
    const match = metaString.match(pattern);
    if (match) {
      return match[1].trim();
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
export async function loadBlogs(
  directory: string,
  sortBy: "order" | "publishing_date" = "publishing_date",
): Promise<BlogPost[]> {
  console.log(`[BlogLoader] Loading blogs from directory: ${directory}`);

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

  console.log(`[BlogLoader] All markdown module paths:`, Object.keys(allMarkdownModules));

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

  console.log(`[BlogLoader] Total markdown files found:`, Object.keys(allMarkdownModules).length);
  console.log(`[BlogLoader] Total TypeScript files found:`, Object.keys(allTsxModules).length);

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

  console.log(`[BlogLoader] Filtered to ${Object.keys(relevantMarkdownModules).length} markdown files for directory: ${normalizedDir}`);
  console.log(`[BlogLoader] Filtered to ${Object.keys(relevantTsxModules).length} TypeScript files for directory: ${normalizedDir}`);
  console.log(`[BlogLoader] Relevant markdown files:`, Object.keys(relevantMarkdownModules));
  console.log(`[BlogLoader] Relevant TypeScript files:`, Object.keys(relevantTsxModules));

  const blogs: BlogPost[] = [];

  // Process markdown files
  for (const [path] of Object.entries(relevantMarkdownModules)) {
    try {
      const cleanPath = path.replace(/\?.*$/, "");
      console.log(`[BlogLoader] Processing markdown file: ${cleanPath}`);
      
      // Load the MDX module - it will be a React component with exported frontmatter
      const module = await relevantMarkdownModules[path]();
      console.log(`[BlogLoader] Module type:`, typeof module);
      console.log(`[BlogLoader] Module keys:`, module ? Object.keys(module) : "null");
      
      // MDX modules export: default (component), frontmatter (metadata)
      if (module && typeof module === "object") {
        const frontmatter = (module as { frontmatter?: Record<string, unknown> }).frontmatter;
        console.log(`[BlogLoader] Frontmatter:`, frontmatter);
        
        if (frontmatter && typeof frontmatter === "object") {
          // Extract metadata from frontmatter
          const title = frontmatter.title as string | undefined;
          const publishingDate = frontmatter.publishing_date as string | undefined;
          const order = frontmatter.order as number | undefined;
          const tokenID = frontmatter.tokenID as number | undefined;
          
          // Create blog post with MDX component
          const blog: BlogPost = {
            title: title || cleanPath.split("/").pop()?.replace(/\.(md|mdx)$/, "") || "",
            content: "", // MDX content is rendered as component
            type: "react", // MDX files are now React components
            publishing_date: publishingDate,
            order: order,
            tokenID: tokenID,
            componentPath: path, // Store path for rendering
          };
          
          blogs.push(blog);
          console.log(`[BlogLoader] Successfully loaded MDX: ${cleanPath} - Title: "${blog.title}"`);
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
