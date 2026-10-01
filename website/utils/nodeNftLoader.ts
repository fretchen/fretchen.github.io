/**
 * Node.js-specific NFT loader using pure viem
 * Used for build-time operations like blog generation
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createPublicClient, http } from "viem";
import { getGenAiNFTAddress, GenImNFTv4ABI, getViemChain } from "@fretchen/chain-utils";
import { NFTMetadata } from "../types/BlogPost";

interface NFTMetadataJSON {
  name?: string;
  description?: string;
  image?: string;
}

// Blog frontmatter tokenIDs are minted on Optimism mainnet, so dev must read mainnet too.
const BLOG_NFT_NETWORK = "eip155:10";
const FETCH_TIMEOUT_MS = 5_000;
const FETCH_CONCURRENCY = 6;

// Dev-only disk cache so a restarted dev server doesn't refetch every token over a slow link.
// Production builds always fetch fresh, so image updates still reach the deployed site.
const USE_DISK_CACHE = process.env.NODE_ENV !== "production";
const CACHE_FILE = resolve(process.cwd(), "node_modules/.cache/blog-nft-metadata.json");

async function readCache(): Promise<Record<number, NFTMetadata>> {
  try {
    return JSON.parse(await readFile(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function writeCache(cache: Record<number, NFTMetadata>): Promise<void> {
  try {
    await mkdir(dirname(CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.warn("Failed to write NFT metadata cache:", error);
  }
}

async function fetchMetadata(tokenID: number, tokenURI: string): Promise<NFTMetadata | null> {
  if (tokenURI.startsWith("file://")) {
    console.warn(`Cannot fetch file:// URL for token ${tokenID}:`, tokenURI);
    return null;
  }

  try {
    const response = await fetch(tokenURI, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Blog-Generator/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }

    const metadata = (await response.json()) as NFTMetadataJSON;

    return {
      imageUrl: metadata.image || "",
      prompt: extractPromptFromDescription(metadata.description || ""),
      name: metadata.name || `NFT #${tokenID}`,
      description: metadata.description || "",
    };
  } catch (error) {
    console.error(`Error loading NFT metadata for token ${tokenID}:`, error);
    return null;
  }
}

/**
 * Load metadata for many tokens: one multicall for all tokenURIs, then parallel metadata fetches.
 */
export async function loadMultipleNFTMetadataNode(tokenIDs: number[]): Promise<Record<number, NFTMetadata>> {
  const cache = USE_DISK_CACHE ? await readCache() : {};
  const results: Record<number, NFTMetadata> = {};
  for (const id of tokenIDs) if (cache[id]) results[id] = cache[id];

  const missing = tokenIDs.filter((id) => !results[id]);
  if (missing.length === 0) return results;

  console.log(`Loading NFT metadata for ${missing.length} tokens: ${missing.join(", ")}`);

  const publicClient = createPublicClient({
    chain: getViemChain(BLOG_NFT_NETWORK),
    transport: http(undefined, { timeout: FETCH_TIMEOUT_MS, retryCount: 1 }),
  });
  const address = getGenAiNFTAddress(BLOG_NFT_NETWORK);

  const tokenURIs = await publicClient.multicall({
    allowFailure: true,
    contracts: missing.map((tokenID) => ({
      address,
      abi: GenImNFTv4ABI,
      functionName: "tokenURI" as const,
      args: [BigInt(tokenID)] as const,
    })),
  });

  let next = 0;
  const worker = async () => {
    while (next < missing.length) {
      const i = next++;
      const tokenID = missing[i];
      const call = tokenURIs[i];
      if (call.status !== "success") {
        console.warn(`tokenURI failed for token ${tokenID}: ${call.error.message.split("\n")[0]}`);
        continue;
      }
      const metadata = await fetchMetadata(tokenID, call.result as string);
      if (metadata) results[tokenID] = metadata;
    }
  };
  await Promise.all(Array.from({ length: Math.min(FETCH_CONCURRENCY, missing.length) }, worker));

  if (USE_DISK_CACHE) await writeCache({ ...cache, ...results });

  console.log(`Successfully loaded metadata for ${Object.keys(results).length} of ${tokenIDs.length} NFTs`);
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
