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
});
