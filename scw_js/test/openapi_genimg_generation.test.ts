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
   *
   * `x-service-type`, `x-capabilities` and the two schema names are no longer asserted here: the
   * `GenimgSpec` return type in scripts/generate-openapi-genimg.ts makes each a compile error,
   * and the golden test above carries that onto the committed file. What stays is what a type
   * cannot express — prose substrings, and `toComponentSchema`'s untyped output.
   */
  describe("images/v1 contract", () => {
    const spec = committedSpec as Record<string, unknown>;

    it("declares an interop floor naming the exact scheme and both mainnets", () => {
      const floor = spec["x-interop-floor"] as string;
      expect(floor).toContain("eip155:10");
      expect(floor).toContain("eip155:8453");
      expect(floor).toContain("exact");
    });

    it("satisfies its own floor: the response carries data[].url", () => {
      const schemas = (spec.components as { schemas: Record<string, never> }).schemas;
      const data = schemas.ImageGenerationResponse["properties"]["data"];
      expect(data["type"]).toBe("array");
      expect(data["items"]["properties"]["url"]).toBeDefined();
    });
  });
});
