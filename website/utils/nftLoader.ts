import { createPublicClient, http } from "viem";
import { optimism } from "viem/chains";
import { genAiNFTContractConfig } from "./getChain";
import { NFTMetadata } from "../types/BlogPost";

interface NFTMetadataJSON {
  name?: string;
  description?: string;
  image?: string;
}

/**
 * Simple NFT loader that fetches metadata for a single token
 */
export async function loadNFTMetadata(tokenID: number): Promise<NFTMetadata | null> {
  try {
    const publicClient = createPublicClient({
      chain: optimism,
      transport: http(),
    });

    // Verwende die stabile genAiNFTContractConfig Konstante

    // Get token URI from contract
    const tokenURIResult = await publicClient.readContract({
      address: genAiNFTContractConfig.address,
      abi: genAiNFTContractConfig.abi,
      functionName: "tokenURI",
      args: [BigInt(tokenID)],
    });

    const tokenURI = tokenURIResult as string;

    // Skip file:// URLs as they can't be fetched in this environment
    if (tokenURI.startsWith("file://")) {
      console.warn(`Cannot fetch file:// URL for token ${tokenID}:`, tokenURI);
      return null;
    }

    // Fetch metadata from URI
    const response = await fetch(tokenURI);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }

    const metadata: NFTMetadataJSON = await response.json();

    // Extract prompt from description
    const prompt = extractPromptFromDescription(metadata.description || "");

    return {
      imageUrl: metadata.image || "",
      prompt,
      name: metadata.name || `NFT #${tokenID}`,
      description: metadata.description || "",
    };
  } catch (error) {
    console.error(`Error loading NFT metadata for token ${tokenID}:`, error);
    return null;
  }
}

/**
 * Load multiple NFT metadata entries with controlled concurrency
 * @param tokenIDs Array of token IDs to load
 * @param concurrency Maximum number of concurrent requests (default: 3)
 */
export async function loadMultipleNFTMetadata(
  tokenIDs: number[],
  concurrency = 3,
): Promise<Record<number, NFTMetadata>> {
  const results: Record<number, NFTMetadata> = {};

  // Helper function to process a batch of tokens
  const processBatch = async (batch: number[]): Promise<void> => {
    const promises = batch.map(async (tokenID) => {
      console.log(`Loading NFT metadata for token ${tokenID}...`);
      const metadata = await loadNFTMetadata(tokenID);
      if (metadata) {
        results[tokenID] = metadata;
      }
    });

    await Promise.all(promises);
  };

  // Process tokens in batches with controlled concurrency
  for (let i = 0; i < tokenIDs.length; i += concurrency) {
    const batch = tokenIDs.slice(i, i + concurrency);
    await processBatch(batch);

    // Small delay between batches to be respectful to RPC endpoints
    if (i + concurrency < tokenIDs.length) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  return results;
}

/**
 * Extract prompt from NFT description
 */
export function extractPromptFromDescription(description: string, maxLength = 100): string {
  // Look for "Prompt:" in the description
  const promptMatch = description.match(/Prompt:\s*(.+?)(?:\n|$)/i);
  if (promptMatch && promptMatch[1]) {
    const prompt = promptMatch[1].trim();
    // Truncate if needed
    return prompt.length > maxLength ? `${prompt.substring(0, maxLength)}...` : prompt;
  }

  // Fallback: use first part of description
  const truncated = description.substring(0, maxLength);
  return truncated.length < description.length ? `${truncated}...` : truncated;
}
