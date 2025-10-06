/**
 * Category System for Blog Posts
 * Defines 5 main categories with metadata for display and filtering
 */

export type CategoryId = "blockchain" | "ai" | "quantum" | "webdev" | "others";

export interface Category {
  label: string;
  description: string;
}

export const CATEGORIES: Record<CategoryId, Category> = {
  blockchain: {
    label: "Blockchain",
    description: "Smart Contracts, NFTs, Decentralization, Ethereum",
  },

  ai: {
    label: "AI",
    description: "Image Generation, LLMs, AI Applications, Neural Networks",
  },

  quantum: {
    label: "Quantum",
    description: "Quantum Physics, AMO, Quantum Machine Learning, Hardware",
  },

  webdev: {
    label: "Web Development",
    description: "React, Vike, TypeScript, Static Site Generators, Tools",
  },

  others: {
    label: "Others",
    description: "Game Theory, Governance, Economics, Political Systems, Others",
  },
} as const;

/**
 * Helper function to get category by ID with type safety
 */
export function getCategory(id: CategoryId): Category {
  return CATEGORIES[id];
}

/**
 * Helper function to get all category IDs
 */
export function getCategoryIds(): CategoryId[] {
  return Object.keys(CATEGORIES) as CategoryId[];
}
