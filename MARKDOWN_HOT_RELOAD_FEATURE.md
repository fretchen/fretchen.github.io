# Markdown Hot Reload Feature Implementation

## Summary

This document describes a streamlined implementation for adding hot reload support to markdown blog posts. The approach uses a single dynamic loading system for both development and production, eliminating build-time JSON generation and focusing on immediate developer experience improvements.

**Implementation Strategy**: Direct migration with unified dynamic loading - no fallback systems or dual implementations.

## Overview

This feature adds instant hot reload support for markdown blog posts, providing the same immediate development experience as TypeScript blog posts. When a markdown file is edited, changes appear instantly in the browser without requiring build restarts or page refreshes.

## Current State vs. Target State

### Current Implementation
- **TypeScript blogs** (`.tsx`): ✅ Hot reload works perfectly
- **Markdown blogs** (`.md`): ❌ Requires build restart to see changes
- **Build process**: Static JSON generation via `getBlogs()` in `preBuild.ts`
- **Runtime**: Pages import static `blogs.json` files

### Target Implementation
- **TypeScript blogs** (`.tsx`): ✅ Hot reload (unchanged)
- **Markdown blogs** (`.md`): ✅ Hot reload with instant preview
- **Build process**: No JSON generation needed
- **Runtime**: Dynamic loading with Vite's dependency tracking for all environments

## Technical Architecture

### Unified Implementation Approach
Single dynamic loading system that works identically in development and production. No environment-specific code paths or fallback mechanisms.

#### Core Blog Loader (`utils/blogLoader.ts`)
```typescript
// Static glob patterns for all blog directories (Vite requirement)
const ALL_BLOG_MODULES = {
  blog: import.meta.glob("../blog/*.{md,mdx,tsx}", { as: "raw" }),
  "quantum/amo": import.meta.glob("../quantum/amo/*.{md,mdx,tsx}", { as: "raw" }),
  "quantum/basics": import.meta.glob("../quantum/basics/*.{md,mdx,tsx}", { as: "raw" }),
  "quantum/hardware": import.meta.glob("../quantum/hardware/*.{md,mdx,tsx}", { as: "raw" }),
  "quantum/qml": import.meta.glob("../quantum/qml/*.{md,mdx,tsx}", { as: "raw" }),
};

export async function loadBlogs(
  directory: string,
  sortBy: "order" | "publishing_date" = "publishing_date"
): Promise<BlogPost[]>
```

**Key Features:**
- Static glob patterns satisfy Vite's requirements
- Directory-based module selection
- Frontmatter parsing with existing format support
- Mixed markdown and TypeScript file handling
- Flexible sorting options

#### React Blog Hook (`hooks/useBlogData.ts`)
```typescript
export function useBlogData(
  directory: string,
  sortBy?: "order" | "publishing_date"
): {
  blogs: BlogPost[];
  loading: boolean;
  error: string | null;
}
```

**Key Features:**
- Simple loading states for UI feedback
- Error handling with descriptive messages
- Automatic cleanup on component unmount
- Works identically in all environments

## Implementation Plan

### Single Phase: Direct Migration
Combine infrastructure creation with immediate migration for rapid implementation.

#### Step 1: Create Core Infrastructure (2-3 hours)
1. **Create `utils/blogLoader.ts`**
   - Define static glob patterns for all directories
   - Implement frontmatter parsing
   - Add sorting and filtering logic

2. **Create `hooks/useBlogData.ts`**
   - React hook with loading states
   - Error boundaries and cleanup

3. **Update `types/BlogPost.ts`**
   - Add "typescript" to PostType union

#### Step 2: Update Blog Pages (1 day)
Replace static imports with dynamic loading across all blog sections:

**Main Blog Section:**
```typescript
// pages/blog/+Page.tsx
import { useBlogData } from "../../hooks/useBlogData";
const { blogs, loading, error } = useBlogData("blog", "publishing_date");

// pages/blog/@id/+Page.tsx  
const { blogs, loading, error } = useBlogData("blog", "publishing_date");
const blog = blogs[id];
```

**Quantum Sections:**
```typescript
// pages/quantum/amo/+Page.tsx
const { blogs } = useBlogData("quantum/amo", "order");

// pages/quantum/amo/@id/+Page.tsx
const { blogs } = useBlogData("quantum/amo", "order");
```

**Home Page Preview:**
```typescript
// pages/index/+Page.tsx
const { blogs } = useBlogData("blog", "publishing_date");
// Use first 3 blogs for preview
```

#### Step 3: Cleanup and Optimization (1 day)
1. Remove static JSON imports
2. Remove `preBuild.ts` JSON generation
3. Update prerendering configuration
4. Add comprehensive error handling
5. Performance testing and optimization

## File Structure Changes

### New Files
```
website/
├── utils/
│   └── blogLoader.ts          # Unified dynamic blog loading
└── hooks/
    └── useBlogData.ts         # React hook for blog data
```

### Modified Files
```
website/
├── types/
│   └── BlogPost.ts            # Add "typescript" to PostType
├── pages/
│   ├── blog/
│   │   ├── +Page.tsx          # Use useBlogData hook
│   │   └── @id/+Page.tsx      # Use useBlogData hook
│   ├── index/
│   │   └── +Page.tsx          # Use useBlogData for preview
│   └── quantum/
│       └── */+Page.tsx        # All quantum sections use useBlogData
└── package.json               # Remove preBuild script dependency
```

### Removed Files
```
website/
├── blog/blogs.json            # No longer needed
├── quantum/*/blogs.json       # No longer needed
└── utils/preBuild.ts          # No longer needed
```

## Hot Reload Mechanism

### How It Works
1. **Vite's import.meta.glob** automatically tracks all markdown files as dependencies
2. **File changes trigger HMR** through Vite's built-in dependency system
3. **React hook re-executes** and fetches updated content
4. **Component re-renders** with new content immediately
5. **No page refresh** required - seamless like TypeScript blogs

### Technical Implementation
```typescript
// Vite automatically tracks these as dependencies
const modules = ALL_BLOG_MODULES[directory];

// When any tracked file changes, this function re-executes
for (const [path, loader] of Object.entries(modules)) {
  const content = await loader(); // Fresh content on file change
  // Process and return updated blog data
}
```

## Benefits

### Developer Experience
- **Instant feedback**: See markdown changes immediately (< 1 second)
- **No build restarts**: Edit and preview seamlessly
- **Unified experience**: Same hot reload for both TypeScript and markdown
- **Live preview**: Write and see results simultaneously

### Performance Advantages
- **Code splitting**: Vite automatically optimizes bundle loading
- **Tree shaking**: Unused blogs excluded from bundles
- **Lazy loading**: Blog content loaded on demand
- **Better caching**: Individual file changes don't invalidate entire cache

### Architecture Simplification
- **Single implementation**: Same code path for all environments
- **No build dependencies**: Remove complex preBuild step
- **Reduced complexity**: Eliminate dual systems and fallbacks
- **Easier maintenance**: One system to debug and optimize

## Implementation Checklist

### Core Implementation
- [ ] Create `utils/blogLoader.ts` with static glob patterns
- [ ] Create `hooks/useBlogData.ts` with React state management
- [ ] Update `types/BlogPost.ts` to include "typescript" type
- [ ] Test basic functionality with one blog section

### Blog Section Migration
- [ ] Update `pages/blog/+Page.tsx` and `pages/blog/@id/+Page.tsx`
- [ ] Update all quantum section pages (`quantum/*/+Page.tsx`)
- [ ] Update home page blog preview (`pages/index/+Page.tsx`)
- [ ] Test hot reload with markdown file changes

### Cleanup and Optimization
- [ ] Remove all static JSON imports
- [ ] Remove `utils/preBuild.ts` and build script references
- [ ] Update prerendering configuration if needed
- [ ] Add comprehensive error boundaries
- [ ] Performance testing and bundle size analysis

### Validation
- [ ] Test hot reload functionality (< 1 second updates)
- [ ] Verify all existing blog posts work correctly
- [ ] Test frontmatter parsing (title, date, order, tokenID)
- [ ] Test TypeScript blog compatibility
- [ ] Test production build and deployment
- [ ] Verify navigation and sorting functionality

## Success Criteria

1. **Hot reload works for markdown files** (< 1 second update time)
2. **All existing blog functionality preserved** (navigation, sorting, metadata)
3. **No performance regression** in production builds
4. **Simplified development workflow** (no build restarts needed)
5. **Unified developer experience** across TypeScript and markdown blogs

## Risk Mitigation

### Potential Issues
- **Bundle size increase**: Dynamic imports may increase initial bundle
- **Runtime processing**: Frontmatter parsing moved from build to runtime
- **Prerendering compatibility**: Ensure static generation still works

### Mitigation Strategies
- **Bundle optimization**: Leverage Vite's code splitting and tree shaking
- **Error handling**: Comprehensive error boundaries for malformed content
- **Performance monitoring**: Track bundle size and runtime performance
- **Gradual rollout**: Test with one section before full migration