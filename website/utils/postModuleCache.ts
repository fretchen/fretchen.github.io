/**
 * SPIKE (Stufe 2.0, website/MDX_MIGRATION.md): module-scope cache so a post's
 * component can be resolved once, awaited, and then rendered SYNCHRONOUSLY —
 * no React.lazy, no Suspense, no risk of React parking late content in a
 * <template> tag at the end of the document.
 *
 * Primed by +onBeforeRenderHtml.ts (server) and +onBeforeRenderClient.ts
 * (client) before React ever renders the page; components/Post.tsx then
 * reads it synchronously in render.
 *
 * Throwaway: if the spike is kept, this earns proper doc comments as part of
 * 2.1/2.2. If discarded, delete this file along with the two page hooks and
 * the cache branch in Post.tsx.
 */
import type { ComponentType } from "react";
import { loadLazyModuleFromDirectory } from "./lazyGlobRegistry";
import { isSupportedDirectory, getSupportedDirectories } from "./supportedDirectories";

type PostComponent = ComponentType<{ components?: Record<string, ComponentType> }>;

const cache = new Map<string, PostComponent>();

/**
 * Resolves componentPath (e.g. "../blog/ipfs.mdx") to its module and caches
 * it. Safe to call multiple times for the same path (idempotent, no re-fetch
 * once cached). Swallows errors — a miss just means Post.tsx's synchronous
 * read finds nothing and falls back to the existing useEffect loader.
 */
export async function primePostModule(componentPath: string | undefined): Promise<void> {
  if (!componentPath || cache.has(componentPath)) return;

  const pathParts = componentPath.replace(/^\.\.\//, "").split("/");
  const directory = pathParts.slice(0, -1).join("/");
  const filename = pathParts[pathParts.length - 1];

  if (!isSupportedDirectory(directory)) {
    console.warn(
      `[postModuleCache] Unsupported directory: ${directory}. Supported: ${getSupportedDirectories().join(", ")}`,
    );
    return;
  }

  try {
    const module = await loadLazyModuleFromDirectory(directory, filename);
    if (module.default) {
      cache.set(componentPath, module.default as PostComponent);
    }
  } catch (err) {
    console.warn(`[postModuleCache] Failed to prime ${componentPath}:`, err);
  }
}

/** Synchronous read — undefined until primePostModule() has resolved for this path. */
export function getPostModule(componentPath: string | undefined): PostComponent | undefined {
  if (!componentPath) return undefined;
  return cache.get(componentPath);
}
