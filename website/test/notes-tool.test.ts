import { describe, it, expect } from "vitest";
import { noteFindingsTool, readFindings, validateFindings } from "../tools/notes";

const answered = {
  claim: "Cod stocks recovered after 2010.",
  source_url: "https://example.org/cod",
  status: "answered",
};

describe("readFindings", () => {
  it("keeps every entry with a claim, and its url when there is one", () => {
    expect(readFindings({ findings: [answered, { claim: "Why did it recover?", status: "open" }] })).toEqual([
      { claim: "Cod stocks recovered after 2010.", source_url: "https://example.org/cod" },
      { claim: "Why did it recover?" },
    ]);
  });

  // Lenient on purpose: a rejected batch would cost a paid hop for the resend.
  it("accepts a long claim, a missing status and a plain-http url", () => {
    const loose = { claim: "x".repeat(1000), source_url: "http://example.org" };
    expect(readFindings({ findings: [loose] })).toHaveLength(1);
  });

  it.each([
    ["missing findings", {}],
    ["a non-array", { findings: "x" }],
    ["null", null],
  ])("reads nothing from %s", (_label, args) => {
    expect(readFindings(args)).toEqual([]);
  });

  it("skips entries without a usable claim", () => {
    expect(readFindings({ findings: [null, { claim: " " }, { claim: 3 }, answered] })).toHaveLength(1);
  });
});

describe("validateFindings", () => {
  it("reports how many findings a batch held", () => {
    expect(validateFindings({ findings: [answered, answered] })).toEqual({ status: "ok", recorded: 2 });
  });

  it("calls a batch with nothing usable in it invalid", () => {
    expect(validateFindings({ findings: [] }).status).toBe("invalid");
  });

  // Billed on every hop of every turn that offers it, like every tool definition.
  it("keeps the tool definition small", () => {
    expect(JSON.stringify(noteFindingsTool).length).toBeLessThan(1200);
  });
});
