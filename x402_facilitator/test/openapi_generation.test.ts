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
});
