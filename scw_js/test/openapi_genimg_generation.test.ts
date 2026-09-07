/**
 * Golden-file drift check: this is what actually enforces "regenerate openapi.genimg.json
 * after changing a Zod schema" — without it, the file can still silently fall out of sync
 * with the schemas exactly the way it fell out of sync with the hand-written interfaces it
 * replaced (a required `tokenId` the handler never read, a `transaction_hash` never
 * returned). `npm run check` does not run `build`, so this test is the only enforcement.
 */
import { describe, it, expect } from "vitest";
import { generateOpenApiSpec } from "../scripts/generate-openapi-genimg.js";
import committedSpec from "../openapi.genimg.json" with { type: "json" };

describe("openapi.genimg.json generation", () => {
  it("matches what the current Zod schemas would generate", () => {
    const generated = generateOpenApiSpec();
    expect(committedSpec).toEqual(generated);
  });

  /**
   * `llm/v1` gets these guarantees from running code — `precheckLlmV1Agent` in
   * website/hooks/x402Discovery.ts refuses an agent whose x-service-type is wrong.
   * `images/v1` has no such checker, so the contract's load-bearing bits are asserted here
   * instead. Without this, a rename or a dropped key would ship silently.
   */
  describe("images/v1 contract", () => {
    const spec = committedSpec as Record<string, unknown>;

    it("declares x-service-type: images/v1", () => {
      expect(spec["x-service-type"]).toBe("images/v1");
    });

    it("declares an interop floor naming the exact scheme and both mainnets", () => {
      const floor = spec["x-interop-floor"] as string;
      expect(floor).toContain("eip155:10");
      expect(floor).toContain("eip155:8453");
      expect(floor).toContain("exact");
    });

    it("declares the NFT mint as a capability, outside the floor", () => {
      expect(spec["x-capabilities"]).toEqual(["nft-mint"]);
    });

    it("keeps the schema names the published docs reference", () => {
      // website/pages/x402/buyers renders components.schemas.ImageGenerationResponse from the
      // live spec via SpecParamTable — renaming either schema breaks that page silently.
      const schemas = (spec.components as { schemas: Record<string, unknown> }).schemas;
      expect(Object.keys(schemas)).toEqual(
        expect.arrayContaining(["ImageGenerationRequest", "ImageGenerationResponse"]),
      );
    });

    it("satisfies its own floor: the response carries data[].url", () => {
      const schemas = (spec.components as { schemas: Record<string, never> }).schemas;
      const data = schemas.ImageGenerationResponse["properties"]["data"];
      expect(data["type"]).toBe("array");
      expect(data["items"]["properties"]["url"]).toBeDefined();
    });
  });
});
