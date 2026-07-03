/**
 * Lazy (code-split) counterpart of globRegistry.ts's GLOB_REGISTRY.
 * Used by Post.tsx (client-rendered) so a post page only downloads its own
 * component instead of every blog post and quantum lecture in the site.
 *
 * Deliberately kept in its own file, separate from the eager GLOB_REGISTRY:
 * Rollup can't split out a module via dynamic import if that same module is
 * also statically imported anywhere in the build graph, and import.meta.glob's
 * eager mode compiles to literal static imports.
 */

import React from "react";
import type { SupportedDirectory } from "./supportedDirectories";

export const LAZY_GLOB_REGISTRY = {
  blog: {
    modules: import.meta.glob<{ default: React.ComponentType }>(["../blog/*.{tsx,mdx}", "!../blog/*.plan.md"]),
  },
  "quantum/amo": {
    modules: import.meta.glob<{ default: React.ComponentType }>("../quantum/amo/*.{tsx,mdx}"),
  },
  "quantum/basics": {
    modules: import.meta.glob<{ default: React.ComponentType }>("../quantum/basics/*.{tsx,mdx}"),
  },
  "quantum/hardware": {
    modules: import.meta.glob<{ default: React.ComponentType }>("../quantum/hardware/*.{tsx,mdx}"),
  },
  "quantum/qml": {
    modules: import.meta.glob<{ default: React.ComponentType }>("../quantum/qml/*.{tsx,mdx}"),
  },
} as const satisfies Record<SupportedDirectory, { modules: Record<string, unknown> }>;

/**
 * Helper function to lazily load a module from a supported directory.
 *
 * @param directory - The directory to load from (e.g., "blog", "quantum/amo")
 * @param filename - The filename to load (e.g., "hello_world.mdx")
 * @returns A promise resolving to the loaded module with a default export
 * @throws Error if directory is unsupported or module not found
 */
export const loadLazyModuleFromDirectory = async (
  directory: SupportedDirectory,
  filename: string,
): Promise<{ default: React.ComponentType }> => {
  const registry = LAZY_GLOB_REGISTRY[directory];

  if (!registry) {
    throw new Error(`Unsupported directory: ${directory}. Supported: ${Object.keys(LAZY_GLOB_REGISTRY).join(", ")}`);
  }

  const modulePath = `../${directory}/${filename}`;
  const moduleLoader = registry.modules[modulePath];

  if (!moduleLoader) {
    const available = Object.keys(registry.modules).join(", ");
    throw new Error(`Module not found: ${modulePath}. Available modules: ${available}`);
  }

  return (await moduleLoader()) as { default: React.ComponentType };
};
