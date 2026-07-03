import { describe, it, expect } from "vitest";
import { GLOB_REGISTRY } from "../utils/globRegistry";
import { LAZY_GLOB_REGISTRY } from "../utils/lazyGlobRegistry";
import { SUPPORTED_DIRECTORIES } from "../utils/supportedDirectories";

/**
 * The eager registry (server-side metadata), the lazy registry (client-side
 * component loading), and SUPPORTED_DIRECTORIES must describe the same content.
 * The `satisfies` guards on the registries catch key drift at compile time;
 * these tests catch glob-PATTERN drift the type system can't see (e.g. an
 * exclusion pattern present in only one registry, so the two resolve
 * different file sets for the same directory).
 */
describe("glob registry parity", () => {
  it("both registries cover exactly the supported directories", () => {
    const supported = [...SUPPORTED_DIRECTORIES].sort();
    expect(Object.keys(GLOB_REGISTRY).sort()).toEqual(supported);
    expect(Object.keys(LAZY_GLOB_REGISTRY).sort()).toEqual(supported);
  });

  it.each([...SUPPORTED_DIRECTORIES])("eager and lazy globs resolve identical files for %s", (directory) => {
    const eagerKeys = Object.keys(GLOB_REGISTRY[directory].modules).sort();
    const lazyKeys = Object.keys(LAZY_GLOB_REGISTRY[directory].modules).sort();
    expect(lazyKeys).toEqual(eagerKeys);
    expect(eagerKeys.length).toBeGreaterThan(0);
  });

  it("plan files are excluded from the blog globs", () => {
    const allKeys = [...Object.keys(GLOB_REGISTRY.blog.modules), ...Object.keys(LAZY_GLOB_REGISTRY.blog.modules)];
    expect(allKeys.some((key) => key.includes(".plan."))).toBe(false);
  });
});
