import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  primePostModule,
  recordPostModuleError,
  getPostModule,
  getPostModuleError,
  __resetPostModuleCacheForTests,
} from "../utils/postModuleCache";

/**
 * Item 1 of the PR-632 review follow-up: a componentPath that failed to load
 * must be retried on the next primePostModule() call — not cached as a
 * permanent failure — so a reader who revisits a post later in the session
 * (after a transient network blip, or once a stale post-deploy chunk hash
 * clears up) gets a fresh attempt instead of the same stale error forever.
 * A successful componentPath, on the other hand, must never be re-fetched.
 */

vi.mock("../utils/lazyGlobRegistry", () => ({
  loadLazyModuleFromDirectory: vi.fn(),
}));

import { loadLazyModuleFromDirectory } from "../utils/lazyGlobRegistry";

const mockLoad = loadLazyModuleFromDirectory as ReturnType<typeof vi.fn>;
const componentPath = "../blog/hello_world.mdx";

// primePostModule() itself always rethrows on failure (see its doc comment) — this
// mirrors what pages/+onBeforeRenderClient.ts does with that rejection.
async function primeClient(path: string) {
  try {
    await primePostModule(path);
  } catch (err) {
    recordPostModuleError(path, err);
  }
}

describe("postModuleCache retry behavior", () => {
  beforeEach(() => {
    mockLoad.mockReset();
    __resetPostModuleCacheForTests();
  });

  it("retries a componentPath that previously failed to load", async () => {
    mockLoad.mockRejectedValueOnce(new Error("network blip"));
    await primeClient(componentPath);
    expect(getPostModuleError(componentPath)).toBe("network blip");
    expect(getPostModule(componentPath)).toBeUndefined();

    mockLoad.mockResolvedValueOnce({ default: () => null });
    await primeClient(componentPath);
    expect(getPostModuleError(componentPath)).toBeUndefined();
    expect(getPostModule(componentPath)).toBeDefined();
    expect(mockLoad).toHaveBeenCalledTimes(2);
  });

  it("never re-fetches a componentPath that already resolved successfully", async () => {
    mockLoad.mockResolvedValueOnce({ default: () => null });
    await primeClient(componentPath);
    expect(getPostModule(componentPath)).toBeDefined();

    await primeClient(componentPath);
    expect(mockLoad).toHaveBeenCalledTimes(1);
  });
});
