/**
 * Central registry for all content directory glob patterns.
 * This provides a single source of truth for loading MDX/TSX components
 * across the application (used in Post.tsx and blogLoader.ts).
 *
 * Why is this necessary?
 * - Vite's import.meta.glob requires STATIC patterns at build time
 * - We cannot dynamically construct glob patterns from variables
 */

import React from "react";

export const GLOB_REGISTRY = {
  blog: {
    modules: import.meta.glob<{ default: React.ComponentType }>(["../blog/*.{tsx,mdx}", "!../blog/*.plan.md"], {
      eager: true,
    }),
  },
  "quantum/amo": {
    modules: import.meta.glob<{ default: React.ComponentType }>("../quantum/amo/*.{tsx,mdx}", { eager: true }),
  },
  "quantum/basics": {
    modules: import.meta.glob<{ default: React.ComponentType }>("../quantum/basics/*.{tsx,mdx}", { eager: true }),
  },
  "quantum/hardware": {
    modules: import.meta.glob<{ default: React.ComponentType }>("../quantum/hardware/*.{tsx,mdx}", { eager: true }),
  },
  "quantum/qml": {
    modules: import.meta.glob<{ default: React.ComponentType }>("../quantum/qml/*.{tsx,mdx}", { eager: true }),
  },
} as const;

export type SupportedDirectory = keyof typeof GLOB_REGISTRY;

/**
 * Helper function to load a module from a supported directory.
 * Can be used in both Post.tsx (for component rendering) and blogLoader.ts (for metadata extraction).
 *
 * @param directory - The directory to load from (e.g., "blog", "quantum/amo")
 * @param filename - The filename to load (e.g., "hello_world.mdx")
 * @returns The loaded module with a default export
 * @throws Error if directory is unsupported or module not found
 */
export const loadModuleFromDirectory = (
  directory: SupportedDirectory,
  filename: string,
): { default: React.ComponentType } => {
  const registry = GLOB_REGISTRY[directory];

  if (!registry) {
    throw new Error(`Unsupported directory: ${directory}. Supported: ${Object.keys(GLOB_REGISTRY).join(", ")}`);
  }

  const modulePath = `../${directory}/${filename}`;
  const module = registry.modules[modulePath];

  if (!module) {
    const available = Object.keys(registry.modules).join(", ");
    throw new Error(`Module not found: ${modulePath}. Available modules: ${available}`);
  }

  return module as { default: React.ComponentType };
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
