/**
 * Node.js-specific NFT loader using pure viem
 * Used for build-time operations like blog generation
 */

import { createNodePublicClient, nodeGenAiNFTContractConfig } from "./nodeChainUtils";
import { NFTMetadata } from "../types/BlogPost";

interface NFTMetadataJSON {
  name?: string;
  description?: string;
  image?: string;
}

/**
 * Node.js-specific NFT metadata loader using pure viem
 */
export async function loadNFTMetadataNode(tokenID: number): Promise<NFTMetadata | null> {
  try {
    console.log(`Loading NFT metadata for token ${tokenID}...`);

    // Create pure viem public client
    const publicClient = createNodePublicClient();

    // Get token URI from contract using pure viem
    const tokenURIResult = await publicClient.readContract({
      address: nodeGenAiNFTContractConfig.address,
      abi: nodeGenAiNFTContractConfig.abi,
      functionName: "tokenURI",
      args: [BigInt(tokenID)],
    });

    const tokenURI = tokenURIResult as string;

    // Skip file:// URLs as they can't be fetched in this environment
    if (tokenURI.startsWith("file://")) {
      console.warn(`Cannot fetch file:// URL for token ${tokenID}:`, tokenURI);
      return null;
    }

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    try {
      // Fetch metadata from URI with timeout
      const response = await fetch(tokenURI, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Blog-Generator/1.0)",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
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
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`Timeout loading NFT metadata for token ${tokenID}`);
    } else {
      console.error(`Error loading NFT metadata for token ${tokenID}:`, error);
    }
    return null;
  }
}

/**
 * Load multiple NFT metadata entries with controlled concurrency (Node.js version)
 * @param tokenIDs Array of token IDs to load
 * @param concurrency Maximum number of concurrent requests (default: 2 for Node.js)
 */
export async function loadMultipleNFTMetadataNode(
  tokenIDs: number[],
  concurrency = 2, // Lower concurrency for Node.js environment
): Promise<Record<number, NFTMetadata>> {
  const results: Record<number, NFTMetadata> = {};

  console.log(`Loading NFT metadata for blogs...`);
  console.log(`Found ${tokenIDs.length} blogs with NFT tokens: ${tokenIDs.join(", ")}`);

  // Helper function to process a batch of tokens
  const processBatch = async (batch: number[]): Promise<void> => {
    const promises = batch.map(async (tokenID) => {
      const metadata = await loadNFTMetadataNode(tokenID);
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

    // Larger delay between batches for Node.js to be respectful to RPC endpoints
    if (i + concurrency < tokenIDs.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log(`Successfully loaded metadata for ${Object.keys(results).length} NFTs`);
  return results;
}

/**
 * Extract prompt from NFT description
 */
export function extractPromptFromDescription(description: string, maxLength = 100): string {
  // Look for "Prompt:" in the description
  const promptMatch = description.match(/Prompt:\s*(.+?)(?:\n|$)/i);
  if (promptMatch) {
    let prompt = promptMatch[1].trim();

    // Remove any trailing periods or punctuation that might be cut off
    prompt = prompt.replace(/[.!?]*$/, "");

    // Truncate if too long
    if (prompt.length > maxLength) {
      prompt = prompt.substring(0, maxLength - 3) + "...";
    }

    return prompt;
  }

  // Fallback: use the first part of the description
  let fallback = description.substring(0, maxLength);
  if (description.length > maxLength) {
    fallback += "...";
  }

  return fallback;
}
