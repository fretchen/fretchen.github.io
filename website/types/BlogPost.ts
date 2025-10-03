export interface NFTMetadata {
  imageUrl: string;
  prompt: string;
  name: string;
  description: string;
}

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
  description?: string; // SEO description for the blog post
}
