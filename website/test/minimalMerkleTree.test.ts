// @vitest-environment node
//
// The default jsdom environment (see vitest.config.ts) breaks @openzeppelin/merkle-tree's
// @metamask/abi-utils dependency here — a Uint8Array crosses into a `String(...)` coercion
// somewhere in its jsdom-transformed module graph and a bytes-like check then fails on the
// comma-joined string. Confirmed unrelated to this repo's code: the same
// `StandardMerkleTree.of()` call works fine under plain Node. This file only needs Node's
// real crypto/typed-array behaviour, not a DOM, so it opts out of jsdom entirely.
import { describe, it, expect } from "vitest";
import { StandardMerkleTree as RealStandardMerkleTree } from "@openzeppelin/merkle-tree";
import { StandardMerkleTree as MinimalStandardMerkleTree } from "../utils/minimalMerkleTree";

/**
 * `utils/minimalMerkleTree.ts` exists so `BatchCreator.tsx`/`ProofDemo.tsx` don't ship the
 * full `@openzeppelin/merkle-tree` package to the client. This is the permanent regression
 * guard for that: it runs both implementations over the same fixture data and asserts
 * identical `.root`, `.getProof()`, `.leafHash()`, and `.verify()` output. `@openzeppelin/
 * merkle-tree` is a devDependency only — used here, never imported by shipped code.
 */

const types = ["uint256", "string", "uint256", "string"];

// Same shape as the LLM batch requests the blog post's widgets build trees over.
const fixtureData = [
  [1, "2024-01-15T10:30:00.000Z", 150, "0xUser1Address..."],
  [2, "2024-01-15T10:32:00.000Z", 120, "0xUser2Address..."],
  [3, "2024-01-15T10:35:00.000Z", 180, "0xUser3Address..."],
  [4, "2024-01-15T10:38:00.000Z", 90, "0xUser4Address..."],
];

describe("minimalMerkleTree parity with @openzeppelin/merkle-tree", () => {
  it("produces an identical root", () => {
    const real = RealStandardMerkleTree.of(fixtureData, types);
    const minimal = MinimalStandardMerkleTree.of(fixtureData, types);
    expect(minimal.root).toBe(real.root);
  });

  it("produces identical leaf hashes for every value", () => {
    const real = RealStandardMerkleTree.of(fixtureData, types);
    const minimal = MinimalStandardMerkleTree.of(fixtureData, types);
    for (const value of fixtureData) {
      expect(minimal.leafHash(value)).toBe(real.leafHash(value));
    }
  });

  it("produces identical proofs for every leaf, in original insertion order", () => {
    const real = RealStandardMerkleTree.of(fixtureData, types);
    const minimal = MinimalStandardMerkleTree.of(fixtureData, types);
    for (let i = 0; i < fixtureData.length; i++) {
      expect(minimal.getProof(i)).toEqual(real.getProof(i));
    }
  });

  it("entries() yields the same [index, value] pairs", () => {
    const minimal = MinimalStandardMerkleTree.of(fixtureData, types);
    expect(Array.from(minimal.entries())).toEqual(fixtureData.map((value, index) => [index, value]));
  });

  it("verify() agrees with the real implementation, for valid and invalid proofs", () => {
    const real = RealStandardMerkleTree.of(fixtureData, types);
    const minimal = MinimalStandardMerkleTree.of(fixtureData, types);

    for (let i = 0; i < fixtureData.length; i++) {
      const proof = minimal.getProof(i);
      expect(MinimalStandardMerkleTree.verify(minimal.root, types, fixtureData[i], proof)).toBe(true);
      expect(RealStandardMerkleTree.verify(real.root, types, fixtureData[i], proof)).toBe(true);
    }

    // A proof for one leaf must not validate a different leaf's value.
    const wrongProof = minimal.getProof(0);
    expect(MinimalStandardMerkleTree.verify(minimal.root, types, fixtureData[1], wrongProof)).toBe(false);
  });

  it("stays in sync across an odd number of leaves too", () => {
    const oddData = fixtureData.slice(0, 3);
    const real = RealStandardMerkleTree.of(oddData, types);
    const minimal = MinimalStandardMerkleTree.of(oddData, types);
    expect(minimal.root).toBe(real.root);
    for (let i = 0; i < oddData.length; i++) {
      expect(minimal.getProof(i)).toEqual(real.getProof(i));
    }
  });

  it("stays in sync for a single-leaf tree", () => {
    const oneData = fixtureData.slice(0, 1);
    const real = RealStandardMerkleTree.of(oneData, types);
    const minimal = MinimalStandardMerkleTree.of(oneData, types);
    expect(minimal.root).toBe(real.root);
    expect(minimal.getProof(0)).toEqual(real.getProof(0));
  });
});
