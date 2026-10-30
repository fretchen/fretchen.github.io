export interface NFTMetadata {
  imageUrl: string;
  prompt: string;
  name: string;
  description: string;
}

/** One blog token, unambiguous: a CAIP-2 network plus the token id on that chain. The two
 * GenImNFT mainnets have independent id sequences (both minted a #12), so a bare id is not
 * an identifier. Key form in metadata maps: `${network}/${id}`. */
export interface TokenRef {
  network: string;
  id: number;
}

/** Composite map key for one blog token. `/` cannot appear in a CAIP-2 id, so the key is
 * unambiguous where `:` (which the network itself contains) would not be. */
export function tokenRefKey(ref: TokenRef): string {
  return `${ref.network}/${ref.id}`;
}

/** The frontmatter default for a bare tokenID: every legacy blog token was minted on
 * Optimism mainnet. Declared once here — the loaders and both image components resolve
 * against it, and the default must never drift between them. */
export const LEGACY_BLOG_TOKEN_NETWORK = "eip155:10";

export interface BlogPost {
  title: string;
  content: string;
  publishing_date?: string;
  order?: number;
  tokenID?: number;
  /** CAIP-2 network the tokenID lives on (e.g. "eip155:8453" for Base). Resolved to a
   * concrete value at load time: the frontmatter default for a bare tokenID is eip155:10,
   * because every legacy blog token was minted on Optimism mainnet. */
  network?: string;
  nftMetadata?: NFTMetadata;
  componentPath?: string; // Pfad zur React-Komponente für interaktive Posts
  description?: string; // SEO description for the blog post
  category?: string; // Primary category
  secondaryCategory?: string; // Optional secondary category
}
