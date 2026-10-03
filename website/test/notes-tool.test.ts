import { describe, it, expect } from "vitest";
import { noteFindingsTool, validateFindings } from "../tools/notes";

const answered = {
  claim: "Cod stocks recovered after 2010.",
  source_url: "https://example.org/cod",
  status: "answered",
};

describe("validateFindings", () => {
  it("accepts a batch and reports how many it held", () => {
    expect(validateFindings({ findings: [answered, { claim: "Why did it recover?", status: "open" }] })).toEqual({
      status: "ok",
      recorded: 2,
    });
  });

  it.each([
    ["missing findings", {}],
    ["an empty batch", { findings: [] }],
    ["an oversized batch", { findings: Array(11).fill(answered) }],
    ["an empty claim", { findings: [{ ...answered, claim: " " }] }],
    ["a pasted paragraph", { findings: [{ ...answered, claim: "x".repeat(401) }] }],
    ["an unknown status", { findings: [{ ...answered, status: "done" }] }],
    ["an answered claim without a source", { findings: [{ claim: "x", status: "answered" }] }],
    ["a non-https source", { findings: [{ ...answered, source_url: "http://example.org" }] }],
    ["a null entry", { findings: [null] }],
  ])("rejects %s", (_label, args) => {
    expect(validateFindings(args as Record<string, unknown>).status).toBe("invalid");
  });

  // Billed on every hop of every turn that offers it, like every tool definition.
  it("keeps the tool definition small", () => {
    expect(JSON.stringify(noteFindingsTool).length).toBeLessThan(1200);
  });
});
