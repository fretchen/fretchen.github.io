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
import type { PageContext } from "vike/types";
import { loadLazyModuleFromDirectory } from "./lazyGlobRegistry";
import { isSupportedDirectory, getSupportedDirectories } from "./supportedDirectories";
import type { BlogPost } from "../types/BlogPost";

type PostComponent = ComponentType<{ components?: Record<string, ComponentType> }>;

type CacheEntry = { component: PostComponent } | { error: string };

const cache = new Map<string, CacheEntry>();

/** The componentPath the current page's post data carries, if any — shared by both
 * pages/+onBeforeRenderHtml.ts (server) and pages/+onBeforeRenderClient.ts (client)
 * so the cast against the real BlogPost type lives in one place. */
export function getBlogComponentPath(pageContext: PageContext): string | undefined {
  return (pageContext.data as { blog?: Pick<BlogPost, "componentPath"> } | undefined)?.blog?.componentPath;
}

/**
 * Resolves componentPath (e.g. "../blog/ipfs.mdx") to its module and caches
 * the outcome — component on success, message on failure. A cached success
 * is never retried. A cached failure IS retried on the next call — on the
 * client that's the reader revisiting the post later in the session (stale
 * hashed chunk URL after a redeploy, flaky network — both can clear up), and
 * a retry there is harmless since it's only ever one call per navigation.
 *
 * Always rethrows on failure — resolving a module is environment-agnostic.
 * It's the two call sites that decide what a failure means for them:
 * - **pages/+onBeforeRenderHtml.ts (server/prerender)**: lets it propagate.
 *   A module that can't resolve during the build is a build bug (bad
 *   content, broken import) — it must fail the build loudly, not get baked
 *   into static HTML as a rendered error page with an exit code of 0.
 * - **pages/+onBeforeRenderClient.ts (client)**: catches it and calls
 *   recordPostModuleError below. Here a failure is a runtime event outside
 *   our control (stale hashed chunk URL after a redeploy, flaky network) —
 *   Post.tsx's error UI with a reload button is the right response, and
 *   there's no "build" to fail.
 */
export async function primePostModule(componentPath: string | undefined): Promise<void> {
  if (!componentPath) return;
  const existing = cache.get(componentPath);
  if (existing && "component" in existing) return;

  const pathParts = componentPath.replace(/^\.\.\//, "").split("/");
  const directory = pathParts.slice(0, -1).join("/");
  const filename = pathParts[pathParts.length - 1];

  if (!isSupportedDirectory(directory)) {
    throw new Error(`Unsupported directory: ${directory}. Supported: ${getSupportedDirectories().join(", ")}`);
  }

  const module = await loadLazyModuleFromDirectory(directory, filename);
  if (!module.default) {
    throw new Error(`No default export found in ${filename}`);
  }

  cache.set(componentPath, { component: module.default as PostComponent });
}

/** Records a componentPath as failed to load — the client-only counterpart to a
 * successful primePostModule() call. See primePostModule's doc comment for why
 * only the client call site (pages/+onBeforeRenderClient.ts) calls this. */
export function recordPostModuleError(componentPath: string, err: unknown): void {
  const message = err instanceof Error ? err.message : "Unknown error occurred";
  console.warn(`[postModuleCache] Failed to prime ${componentPath}:`, err);
  cache.set(componentPath, { error: message });
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
