/**
 * Central registry for all content directory glob patterns.
 * This provides a single source of truth for eagerly loading MDX/TSX components
 * across the application (used in blogLoader.ts for server-side metadata extraction).
 *
 * Why is this necessary?
 * - Vite's import.meta.glob requires STATIC patterns at build time
 * - We cannot dynamically construct glob patterns from variables
 *
 * This file must stay eager-only: see lazyGlobRegistry.ts for the client-side,
 * code-split counterpart used by Post.tsx. Keeping them in separate files is what
 * lets Rollup actually split lazyGlobRegistry.ts per-post — a module that's
 * statically imported anywhere in the build can't also be split out elsewhere.
 */

import React from "react";
import type { SupportedDirectory } from "./supportedDirectories";

export type { SupportedDirectory };

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
} as const satisfies Record<SupportedDirectory, { modules: Record<string, unknown> }>;
