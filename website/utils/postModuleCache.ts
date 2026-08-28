/**
 * Module-scope cache so a post's component is resolved once, awaited, and
 * then rendered SYNCHRONOUSLY — no React.lazy, no Suspense, no risk of React
 * parking late content in a <template> tag at the end of the document.
 *
 * Primed by pages/+onBeforeRenderHtml.ts (server) and
 * pages/+onBeforeRenderClient.ts (client), both awaited by vike-react before
 * render/hydrate — so by the time components/Post.tsx's ReactPostRenderer
 * mounts, the entry (component or error) is already here to read.
 *
 * Stufe 2, website/MDX_MIGRATION.md.
 */
import type { ComponentType } from "react";
import { loadLazyModuleFromDirectory } from "./lazyGlobRegistry";
import { isSupportedDirectory, getSupportedDirectories } from "./supportedDirectories";

type PostComponent = ComponentType<{ components?: Record<string, ComponentType> }>;

type CacheEntry = { component: PostComponent } | { error: string };

const cache = new Map<string, CacheEntry>();

/**
 * Resolves componentPath (e.g. "../blog/ipfs.mdx") to its module and caches
 * the outcome — component on success, message on failure. Idempotent — a
 * path already in the cache, success or failure, is not retried.
 *
 * Failure handling differs by environment, deliberately:
 * - **Server (prerender)**: rethrows. A module that can't resolve during the
 *   build is a build bug (bad content, broken import) — it must fail the
 *   build loudly, not get baked into static HTML as a rendered error page
 *   with an exit code of 0.
 * - **Client**: catches and records the error instead. Here a failure is a
 *   runtime event outside our control (stale hashed chunk URL after a
 *   redeploy, flaky network) — Post.tsx's error UI with a reload button is
 *   the right response, and there's no "build" to fail.
 */
export async function primePostModule(componentPath: string | undefined): Promise<void> {
  if (!componentPath || cache.has(componentPath)) return;

  const pathParts = componentPath.replace(/^\.\.\//, "").split("/");
  const directory = pathParts.slice(0, -1).join("/");
  const filename = pathParts[pathParts.length - 1];

  try {
    if (!isSupportedDirectory(directory)) {
      throw new Error(`Unsupported directory: ${directory}. Supported: ${getSupportedDirectories().join(", ")}`);
    }

    const module = await loadLazyModuleFromDirectory(directory, filename);
    if (!module.default) {
      throw new Error(`No default export found in ${filename}`);
    }

    cache.set(componentPath, { component: module.default as PostComponent });
  } catch (err) {
    if (import.meta.env.SSR) throw err;

    const message = err instanceof Error ? err.message : "Unknown error occurred";
    console.warn(`[postModuleCache] Failed to prime ${componentPath}:`, err);
    cache.set(componentPath, { error: message });
  }
}

/** Synchronous read — undefined until primed successfully, or if priming failed. */
export function getPostModule(componentPath: string | undefined): PostComponent | undefined {
  const entry = componentPath ? cache.get(componentPath) : undefined;
  return entry && "component" in entry ? entry.component : undefined;
}

/** The failure reason, if priming was attempted and failed. Undefined if never primed or if it succeeded. */
export function getPostModuleError(componentPath: string | undefined): string | undefined {
  const entry = componentPath ? cache.get(componentPath) : undefined;
  return entry && "error" in entry ? entry.error : undefined;
}

/** Test-only: clears the module-scope cache so tests don't leak state into each other. */
export function __resetPostModuleCacheForTests(): void {
  cache.clear();
}
