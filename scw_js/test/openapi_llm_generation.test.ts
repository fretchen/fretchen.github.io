/**
 * Golden-file drift check for `openapi.llm.json`, plus the contract assertions the website depends
 * on. Without the golden test the committed file can silently fall out of sync with the schemas the
 * same way it fell out of sync with the handler while it was hand-written — `payment` and `stream`
 * were both readable by the handler and absent from `components.schemas`.
 */
import { describe, it, expect } from "vitest";
import { generateOpenApiSpec } from "../scripts/generate-openapi-llm.js";
import committedSpec from "../openapi.llm.json" with { type: "json" };

describe("openapi.llm.json generation", () => {
  it("matches what the current Zod schemas would generate", () => {
    expect(committedSpec).toEqual(generateOpenApiSpec());
  });

  /**
   * `precheckLlmV1Agent` and `checkLlmV1Agent` (website/hooks/x402Discovery.ts) compare
   * `x-service-type` with `===`, so any other value makes this agent fail its own compatibility
   * checker — the shape sc_llm_x402.ts:174-195 records having fixed once. This is also why tool
   * support will be advertised as a capability rather than an `llm/v1.1` bump.
   *
   * `x-service-type`, the two schema names and `x-payment-info.price.max` are no longer asserted
   * here: the `LlmSpec` return type in scripts/generate-openapi-llm.ts makes each a compile
   * error, and the golden test above carries that onto the committed file. What stays is what a
   * type cannot express — prose substrings and the proof's format.
   */
  describe("llm/v1 contract", () => {
    const spec = committedSpec as Record<string, unknown>;

    it("keeps an interop floor naming the scheme and both mainnets", () => {
      const floor = spec["x-interop-floor"] as string;
      expect(floor).toContain("batch-settlement");
      expect(floor).toContain("eip155:10");
      expect(floor).toContain("eip155:8453");
    });

    it("carries the ownership proof forward — it cannot be regenerated", () => {
      const proofs = (spec["x-discovery"] as { ownershipProofs?: string[] }).ownershipProofs;
      expect(proofs).toHaveLength(1);
      expect(proofs?.[0]).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    it("names every metered param in the published 400 description", () => {
      // Both the description and the handler's rejections are now built from REJECTED_PARAMS
      // (llm_schemas.ts), so the drift this originally caught — `n` and `max_tokens` becoming 400
      // causes the spec never mentioned — is structurally gone. What it still checks is the prose
      // assembly in the generator: that joinOr() renders the list into a readable sentence.
      const paths = spec.paths as Record<string, never>;
      const desc: string = paths["/"]["post"]["responses"]["400"]["description"];
      expect(desc).toContain("stream");
      expect(desc).toContain("n other than 1");
      expect(desc).toContain("max_tokens");
    });
  });

  /**
   * The two fields the hand-written spec omitted. Both are read by the handler, and both were
   * documented only in `x-guidance` prose — findable by a human, invisible to a machine reading
   * `components.schemas`.
   */
  describe("fields the hand-written spec had drifted away from", () => {
    const props = (
      (committedSpec as Record<string, never>).components["schemas"]["LLMChatRequest"] as {
        properties: Record<string, unknown>;
      }
    ).properties;

    it("documents the payment body fallback", () => {
      expect(props["payment"]).toBeDefined();
    });

    it("documents stream, and that only false is accepted", () => {
      expect(props["stream"]).toMatchObject({ const: false });
    });
  });

  /**
   * Strictness must match the handler, in both directions. This endpoint *forwards* unknown request
   * fields to the upstream model (unlike genimg, which rejects them), so publishing
   * `additionalProperties: false` on the request would advertise a strictness that does not exist.
   * The response is the opposite case: `callLLMAPI` reconstructs the envelope field by field rather
   * than forwarding upstream extras.
   */
  describe("advertised strictness matches actual behaviour", () => {
    const schemas = (committedSpec as Record<string, never>).components["schemas"];

    it("leaves the request permissive", () => {
      expect(schemas["LLMChatRequest"]["additionalProperties"]).toEqual({});
      expect(
        schemas["LLMChatRequest"]["properties"]["messages"]["items"]["additionalProperties"],
      ).toEqual({});
    });

    it("publishes message role as an unrestricted string, matching the handler", () => {
      // sc_llm_x402.ts validates role with `typeof m.role === "string"` and forwards it verbatim —
      // it does not restrict to system/user/assistant. An `enum` here would advertise a strictness
      // the handler does not enforce, the same drift class as additionalProperties above.
      const role =
        schemas["LLMChatRequest"]["properties"]["messages"]["items"]["properties"]["role"];
      expect(role["type"]).toBe("string");
      expect(role["enum"]).toBeUndefined();
    });

    it("closes the response", () => {
      expect(schemas["LLMChatResponse"]["additionalProperties"]).toBe(false);
    });
  });
});
