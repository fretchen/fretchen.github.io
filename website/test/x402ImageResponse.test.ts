/**
 * Tests for the genimg response normalizer.
 *
 * This is where the frontend's only real hazard around the images/v1 envelope lives: a 200 does
 * not mean the NFT was minted, so `token_id` can legitimately be absent, and the pre-envelope code
 * called `BigInt()` on it unconditionally.
 */
import { describe, it, expect } from "vitest";
import { normalizeImageResponse } from "../hooks/x402ImageResponse";
import type { X402GenImgResponse } from "../types/x402";

const IMAGE = "https://my-imagestore.s3.nl-ams.scw.cloud/images/image_42_abc.jpg";
const METADATA = "https://my-imagestore.s3.nl-ams.scw.cloud/metadata/metadata_42_abc.json";

function envelope(overrides: Partial<X402GenImgResponse> = {}): X402GenImgResponse {
  return {
    created: 1757260000,
    data: [{ url: IMAGE, revised_prompt: null }],
    model: "flux-kontext-pro",
    x_nft: {
      status: "minted",
      token_id: 42,
      contract: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb",
      network: "eip155:10",
      metadata_url: METADATA,
      mint_tx: "0xmint",
      transfer_tx: "0xtransfer",
      listed: false,
      mint_price: "10000000000000000",
      owner: "0xpayer",
    },
    ...overrides,
  };
}

describe("normalizeImageResponse", () => {
  it("reads a minted envelope", () => {
    const result = normalizeImageResponse(envelope());

    expect(result.imageUrl).toBe(IMAGE);
    expect(result.tokenId).toBe(42n);
    expect(result.metadataUrl).toBe(METADATA);
    expect(result.contract).toBe("0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb");
    expect(result.mintFailedReason).toBeUndefined();
  });

  it("converts token_id to bigint, not number", () => {
    // The gallery and the NFT contract calls are bigint-typed; a number here would surface as a
    // type error at best and a wrong contract call at worst.
    expect(typeof normalizeImageResponse(envelope()).tokenId).toBe("bigint");
  });

  describe("mint_failed", () => {
    const failed = envelope({
      x_nft: { status: "mint_failed", reason: "Could not find mint event in transaction" },
    });

    it("does not throw — the regression this function exists for", () => {
      // Pre-envelope this path was `BigInt(result.tokenId)` with tokenId undefined, which throws
      // "Cannot convert undefined to a BigInt" and lost the image the user had already paid for.
      expect(() => normalizeImageResponse(failed)).not.toThrow();
    });

    it("keeps the image but reports no token", () => {
      const result = normalizeImageResponse(failed);

      expect(result.imageUrl).toBe(IMAGE);
      expect(result.tokenId).toBeUndefined();
      expect(result.mintFailedReason).toContain("mint event");
    });

    it("ignores a token_id if one is somehow present alongside mint_failed", () => {
      // Defensive: status is the authority. A token id on a failed mint would be contradictory,
      // and treating the mint as successful is the more expensive mistake.
      const contradictory = envelope({
        x_nft: { status: "mint_failed", reason: "boom", token_id: 7 },
      });

      expect(normalizeImageResponse(contradictory).tokenId).toBeUndefined();
    });
  });

  describe("malformed responses", () => {
    it("throws a contract-shaped error when there is no image URL", () => {
      // Loud, not silent: an undefined imageUrl would otherwise reach an <img src> and render a
      // broken image with no clue why.
      const noImage = { created: 1, data: [], model: "m" } as unknown as X402GenImgResponse;

      expect(() => normalizeImageResponse(noImage)).toThrow(/images\/v1/);
    });

    it("throws when data is absent entirely", () => {
      expect(() => normalizeImageResponse({} as X402GenImgResponse)).toThrow(/no image URL/);
    });
  });
});
