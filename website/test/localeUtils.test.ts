import { describe, it, expect } from "vitest";

function getNestedProperty(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce((acc: unknown, key: string) => (acc as Record<string, unknown>)?.[key], obj);
}

describe("getNestedProperty", () => {
  const fixture = { a: { b: "deep" }, c: "flat" };

  it("resolves nested dot-notation path", () => {
    expect(getNestedProperty(fixture, "a.b")).toBe("deep");
  });

  it("resolves flat key", () => {
    expect(getNestedProperty(fixture, "c")).toBe("flat");
  });

  it("returns undefined for missing key", () => {
    expect(getNestedProperty(fixture, "x.y")).toBeUndefined();
  });

  it("returns undefined for partially missing path", () => {
    expect(getNestedProperty(fixture, "a.z")).toBeUndefined();
  });
});
