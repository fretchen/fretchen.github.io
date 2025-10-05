/**
 * Category System for Blog Posts
 * Defines 5 main categories with metadata for display and filtering
 */

export type CategoryId = "blockchain" | "ai" | "quantum" | "webdev" | "economics";

export interface Category {
  label: string;
  description: string;
  icon: string;
  color: string; // For future styling (category pills, badges)
}

export const CATEGORIES: Record<CategoryId, Category> = {
  blockchain: {
    label: "Blockchain & Web3",
    description: "Smart Contracts, NFTs, Decentralization, Ethereum",
    icon: "🔗",
    color: "blue",
  },

  ai: {
    label: "AI & Machine Learning",
    description: "Image Generation, LLMs, AI Applications, Neural Networks",
    icon: "🤖",
    color: "purple",
  },

  quantum: {
    label: "Quantum Computing",
    description: "Quantum Physics, AMO, Quantum Machine Learning, Hardware",
    icon: "⚛️",
    color: "cyan",
  },

  webdev: {
    label: "Web Development",
    description: "React, Vike, TypeScript, Static Site Generators, Tools",
    icon: "💻",
    color: "green",
  },

  economics: {
    label: "Economics & Policy",
    description: "Game Theory, Governance, Economics, Political Systems",
    icon: "📊",
    color: "orange",
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
