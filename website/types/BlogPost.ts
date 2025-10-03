export interface NFTMetadata {
  imageUrl: string;
  prompt: string;
  name: string;
  description: string;
}

/**
 * Type of blog post content
 * - "react": React component (MDX or TSX files) - all blog posts use this
 */
export type PostType = "react";

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
