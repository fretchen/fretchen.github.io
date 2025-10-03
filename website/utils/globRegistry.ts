/**
 * Central registry for all content directory glob patterns.
 * This provides a single source of truth for loading MDX/TSX components
 * across the application (used in Post.tsx and blogLoader.ts).
 *
 * Why is this necessary?
 * - Vite's import.meta.glob requires STATIC patterns at build time
 * - We cannot dynamically construct glob patterns from variables
 * - This registry pre-defines all patterns with both eager and lazy loading
 */

import React from "react";

export const GLOB_REGISTRY = {
  blog: {
    eager: import.meta.glob<{ default: React.ComponentType }>("../blog/*.{tsx,md,mdx}", { eager: true }),
    lazy: import.meta.glob<{ default: React.ComponentType }>("../blog/*.{tsx,md,mdx}", { eager: false }),
  },
  "quantum/amo": {
    eager: import.meta.glob<{ default: React.ComponentType }>("../quantum/amo/*.{tsx,md,mdx}", { eager: true }),
    lazy: import.meta.glob<{ default: React.ComponentType }>("../quantum/amo/*.{tsx,md,mdx}", { eager: false }),
  },
  "quantum/basics": {
    eager: import.meta.glob<{ default: React.ComponentType }>("../quantum/basics/*.{tsx,md,mdx}", { eager: true }),
    lazy: import.meta.glob<{ default: React.ComponentType }>("../quantum/basics/*.{tsx,md,mdx}", { eager: false }),
  },
  "quantum/hardware": {
    eager: import.meta.glob<{ default: React.ComponentType }>("../quantum/hardware/*.{tsx,md,mdx}", { eager: true }),
    lazy: import.meta.glob<{ default: React.ComponentType }>("../quantum/hardware/*.{tsx,md,mdx}", { eager: false }),
  },
  "quantum/qml": {
    eager: import.meta.glob<{ default: React.ComponentType }>("../quantum/qml/*.{tsx,md,mdx}", { eager: true }),
    lazy: import.meta.glob<{ default: React.ComponentType }>("../quantum/qml/*.{tsx,md,mdx}", { eager: false }),
  },
} as const;

export type SupportedDirectory = keyof typeof GLOB_REGISTRY;

/**
 * Helper function to load a module from a supported directory.
 * Can be used in both Post.tsx (for component rendering) and blogLoader.ts (for metadata extraction).
 *
 * @param directory - The directory to load from (e.g., "blog", "quantum/amo")
 * @param filename - The filename to load (e.g., "hello_world.mdx")
 * @param isProduction - Whether to use eager (production) or lazy (development) loading
 * @returns The loaded module with a default export
 * @throws Error if directory is unsupported or module not found
 */
export const loadModuleFromDirectory = async (
  directory: SupportedDirectory,
  filename: string,
  isProduction: boolean,
): Promise<{ default: React.ComponentType }> => {
  const registry = GLOB_REGISTRY[directory];

  if (!registry) {
    throw new Error(`Unsupported directory: ${directory}. Supported: ${Object.keys(GLOB_REGISTRY).join(", ")}`);
  }

  const modules = isProduction ? registry.eager : registry.lazy;
  const modulePath = `../${directory}/${filename}`;
  const moduleOrLoader = modules[modulePath];

  if (!moduleOrLoader) {
    const availableModules = Object.keys(modules).join(", ");
    throw new Error(`Module not found: ${modulePath}. Available modules: ${availableModules}`);
  }

  // If production (eager), moduleOrLoader is the module itself
  // If development (lazy), moduleOrLoader is a function that returns a Promise
  return isProduction ? moduleOrLoader : await moduleOrLoader();
};

/**
 * Check if a directory is supported by the glob registry.
 * Useful for validation before attempting to load modules.
 */
export const isSupportedDirectory = (directory: string): directory is SupportedDirectory => {
  return directory in GLOB_REGISTRY;
};

/**
 * Get all supported directories.
 * Useful for generating lists or validation.
 */
export const getSupportedDirectories = (): SupportedDirectory[] => {
  return Object.keys(GLOB_REGISTRY) as SupportedDirectory[];
};
