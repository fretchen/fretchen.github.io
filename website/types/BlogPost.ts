export interface NFTMetadata {
  imageUrl: string;
  prompt: string;
  name: string;
  description: string;
}

/**
 * Type of blog post content
 * - "markdown": Plain markdown content (legacy, rarely used)
 * - "react": React component (MDX or TSX files)
 */
export type PostType = "markdown" | "react";

export interface BlogPost {
  title: string;
  content: string;
  publishing_date?: string;
  order?: number;
  tokenID?: number;
  nftMetadata?: NFTMetadata;
  type?: PostType;
  componentPath?: string; // Pfad zur React-Komponente für interaktive Posts
}
