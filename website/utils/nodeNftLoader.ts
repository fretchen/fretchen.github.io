/**
 * Node.js-specific NFT loader using pure viem
 * Used for build-time operations like blog generation
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createPublicClient, http, type Chain } from "viem";
import { getGenAiNFTAddress, GenImNFTv4ABI, getViemChain } from "@fretchen/chain-utils";
import { NFTMetadata, TokenRef, tokenRefKey } from "../types/BlogPost";

interface NFTMetadataJSON {
  name?: string;
  description?: string;
  image?: string;
}

// Blog NFTs live on every GenImNFT mainnet; each post's frontmatter declares which network
// its tokenID lives on (default eip155:10 — see blogLoader's frontmatter parsing). The
// loader groups refs by network and serves each chain with its own multicall, so a Base
// token never resolves against the Optimism contract (both chains minted a #12).
const FETCH_TIMEOUT_MS = 5_000;
const FETCH_CONCURRENCY = 6;

// Dev-only disk cache so a restarted dev server doesn't refetch every token over a slow link.
// Production builds always fetch fresh, so image updates still reach the deployed site.
const USE_DISK_CACHE = process.env.NODE_ENV !== "production";
const CACHE_FILE = resolve(process.cwd(), "node_modules/.cache/blog-nft-metadata.json");

async function readCache(): Promise<Record<string, NFTMetadata>> {
  try {
    return JSON.parse(await readFile(CACHE_FILE, "utf8")) as Record<string, NFTMetadata>;
  } catch {
    return {};
  }
}

async function writeCache(cache: Record<string, NFTMetadata>): Promise<void> {
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
 * Load metadata for many tokens, one multicall per network: each chain has its own GenImNFT
 * with an independent id sequence, so the refs are grouped by `network` and resolved against
 * that chain's contract. Metadata fetches run in parallel across all networks.
 * Returns a map keyed by tokenRefKey(network/id).
 */
export async function loadMultipleNFTMetadataNode(refs: TokenRef[]): Promise<Record<string, NFTMetadata>> {
  const cache = USE_DISK_CACHE ? await readCache() : {};
  const results: Record<string, NFTMetadata> = {};
  for (const ref of refs) {
    const cached = cache[tokenRefKey(ref)];
    if (cached) results[tokenRefKey(ref)] = cached;
  }

  const missing = refs.filter((ref) => !results[tokenRefKey(ref)]);
  if (missing.length === 0) return results;

  console.log(`Loading NFT metadata for ${missing.length} tokens: ${missing.map(tokenRefKey).join(", ")}`);

  // One multicall per network, against that chain's GenImNFT.
  const byNetwork = new Map<string, TokenRef[]>();
  for (const ref of missing) {
    const group = byNetwork.get(ref.network) ?? [];
    group.push(ref);
    byNetwork.set(ref.network, group);
  }

  // viem's multicall failure shape, flattened per ref so the fetch workers below do not
  // need to know which network a token came from.
  type UriResult = { status: "success"; result: string } | { status: "failure"; error: { message: string } };
  const tokenURIByKey = new Map<string, UriResult>();
  for (const [network, networkRefs] of byNetwork) {
    const publicClient = createPublicClient({
      // getViemChain's Chain comes from chain-utils' own viem copy (the file: dep
      // installs its dev tree); structurally identical, but TS 6 no longer accepts
      // the cross-copy assignability.
      chain: getViemChain(network) as Chain,
      transport: http(undefined, { timeout: FETCH_TIMEOUT_MS, retryCount: 1 }),
    });
    const address = getGenAiNFTAddress(network);

    const tokenURIs = (await publicClient.multicall({
      allowFailure: true,
      contracts: networkRefs.map((ref) => ({
        address,
        abi: GenImNFTv4ABI,
        functionName: "tokenURI" as const,
        args: [BigInt(ref.id)] as const,
      })),
    })) as UriResult[];

    networkRefs.forEach((ref, i) => tokenURIByKey.set(tokenRefKey(ref), tokenURIs[i]));
  }

  let next = 0;
  const worker = async () => {
    while (next < missing.length) {
      const ref = missing[next++];
      const key = tokenRefKey(ref);
      const call = tokenURIByKey.get(key);
      if (!call || call.status !== "success") {
        console.warn(
          `tokenURI failed for token ${key}: ${call && call.status === "failure" ? call.error.message.split("\n")[0] : "no result"}`,
        );
        continue;
      }
      const metadata = await fetchMetadata(ref.id, call.result);
      if (metadata) results[key] = metadata;
    }
  };
  await Promise.all(Array.from({ length: Math.min(FETCH_CONCURRENCY, missing.length) }, worker));

  if (USE_DISK_CACHE) await writeCache({ ...cache, ...results });

  console.log(`Successfully loaded metadata for ${Object.keys(results).length} of ${refs.length} NFTs`);
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
