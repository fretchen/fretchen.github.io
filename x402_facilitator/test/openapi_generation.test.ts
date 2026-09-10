/**
 * Golden-file drift check: this is what actually enforces "regenerate openapi.json
 * after changing a Zod schema" — without it, the file can still silently fall out of
 * sync with the schemas exactly the way it fell out of sync with the hand-written
 * interfaces it replaced.
 */
import { describe, it, expect } from "vitest";
import { generateOpenApiSpec } from "../scripts/generate-openapi";
import committedSpec from "../openapi.json" with { type: "json" };

describe("openapi.json generation", () => {
  it("matches what the current Zod schemas would generate", () => {
    const generated = generateOpenApiSpec();
    expect(committedSpec).toEqual(generated);
  });

  /**
   * The golden check above compares the spec to the schemas, but cannot tell whether the schemas
   * describe the *handler*. This does, for the one property that has already shipped wrong.
   *
   * `z.object` strips unknown keys at parse time, yet `z.toJSONSchema` renders it as
   * `additionalProperties: false`. The published `PaymentRequest` therefore declared closed while
   * every real payload carries `x402Version`, `resource`, `payload`, and an `accepted` with
   * `amount`/`asset`/`payTo`/`maxTimeoutSeconds`/`extra` — the spec described a request that could
   * not be paid with, and a client trimming to match it would have produced an unverifiable
   * payment. `z.looseObject` is what keeps the published shape honest.
   */
  describe("advertised strictness matches actual behaviour", () => {
    interface JsonSchema {
      additionalProperties?: unknown;
      properties?: Record<string, JsonSchema>;
    }
    const schemas = (
      committedSpec as unknown as { components: { schemas: Record<string, JsonSchema> } }
    ).components.schemas;

    it("publishes the request as permissive, at every level", () => {
      // The facilitator forwards this payload to @x402/evm rather than owning its shape, so the
      // schema is a deliberately partial view and must not claim to reject what it ignores.
      const req = schemas.PaymentRequest;
      const payload = req.properties!.paymentPayload;

      expect(req.additionalProperties).toEqual({});
      expect(payload.additionalProperties).toEqual({});
      expect(payload.properties!.accepted.additionalProperties).toEqual({});
      expect(req.properties!.paymentRequirements.additionalProperties).toEqual({});
    });

    it("keeps the responses closed", () => {
      // The opposite case: /verify and /settle assemble their bodies field by field, pinned to
      // z.infer<> types in x402_facilitator.ts, so closed is true of them and compiler-enforced.
      for (const name of ["VerifyResponse", "SettleResponse", "SupportedResponse"]) {
        expect(schemas[name].additionalProperties).toBe(false);
      }
    });
  });
});
