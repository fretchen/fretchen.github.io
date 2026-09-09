/**
 * Normalizes the genimg endpoint's `images/v1` response into the shape the UI actually consumes.
 *
 * Exists so two things live in exactly one place:
 *
 * 1. **The missing-token-id case.** A 200 does not mean the NFT was minted — if generation
 *    succeeded and only the mint failed, the server returns the image with
 *    `x_nft.status: "mint_failed"` and no `token_id`. Reading `tokenId` straight off the response
 *    and calling `BigInt()` on it throws in that case, which is exactly what the pre-envelope
 *    code did.
 * 2. **The deploy-window fallbacks.** The website and the function deploy separately, so during
 *    the changeover a response may still carry the old flat shape. Those `??` reads are confined
 *    here; deleting them once the function is live is a one-file change.
 */

import type { X402GenImgResponse } from "../types/x402";

export interface X402ImageResult {
  /** The generated image. Always present on a 200 — this is the thing that was paid for. */
  imageUrl: string;
  /**
   * The minted NFT's id, absent when the mint failed. Callers must treat this as optional:
   * there is no id to show, and nothing to highlight in the gallery.
   */
  tokenId?: bigint;
  metadataUrl?: string;
  /** Address of the NFT contract holding the token. */
  contract?: string;
  /**
   * Set only when the image exists but the on-chain mint did not complete. The payment was NOT
   * settled in that case — the server attaches no settlement headers and takes no money — so any
   * message shown to the user can say so.
   */
  mintFailedReason?: string;
}

export function normalizeImageResponse(raw: X402GenImgResponse): X402ImageResult {
  // `data[0].url` is the images/v1 contract; `image_url` is the pre-envelope fallback.
  const imageUrl = raw?.data?.[0]?.url ?? raw?.image_url;
  if (typeof imageUrl !== "string" || imageUrl.length === 0) {
    throw new Error(
      "Image service returned no image URL (expected data[0].url). The response did not match the images/v1 contract.",
    );
  }

  const nft = raw.x_nft;
  const metadataUrl = nft?.metadata_url ?? raw.metadata_url;

  if (nft?.status === "mint_failed") {
    // Deliberately no tokenId: there is no token. Callers branch on mintFailedReason.
    return {
      imageUrl,
      metadataUrl,
      contract: nft.contract,
      mintFailedReason: nft.reason ?? "The NFT mint did not complete.",
    };
  }

  const rawTokenId = nft?.token_id ?? raw.tokenId;
  return {
    imageUrl,
    // Never BigInt(undefined) — a response without an id yields no id, not a crash.
    tokenId: typeof rawTokenId === "number" ? BigInt(rawTokenId) : undefined,
    metadataUrl,
    contract: nft?.contract,
  };
}
