/**
 * Canonical list of content directories, shared by the eager glob registry
 * (globRegistry.ts, used server-side for metadata) and the lazy glob registry
 * (lazyGlobRegistry.ts, used client-side for on-demand component loading).
 *
 * This has zero import.meta.glob calls so importing it never pulls in any
 * blog/quantum content — keeping the eager and lazy registries' module
 * graphs fully decoupled, which is required for Rollup to actually code-split
 * the lazy one (a module that's statically imported anywhere can't also be
 * split out via a dynamic import elsewhere).
 */
export const SUPPORTED_DIRECTORIES = [
  "blog",
  "quantum/amo",
  "quantum/basics",
  "quantum/hardware",
  "quantum/qml",
] as const;

export type SupportedDirectory = (typeof SUPPORTED_DIRECTORIES)[number];

export const isSupportedDirectory = (directory: string): directory is SupportedDirectory =>
  (SUPPORTED_DIRECTORIES as readonly string[]).includes(directory);

export const getSupportedDirectories = (): SupportedDirectory[] => [...SUPPORTED_DIRECTORIES];
