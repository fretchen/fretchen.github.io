import { encodeAbiParameters, keccak256, type Hex } from "viem";

/**
 * Minimal reimplementation of `@openzeppelin/merkle-tree`'s `StandardMerkleTree`, covering
 * only the surface the `merkle_ai_batching_fundamentals` blog post demo uses: `.of()`,
 * `.root`, `.getProof()`, `.leafHash()`, `.entries()`, and the static `.verify()`.
 *
 * This is not a simplified lookalike — it is the same algorithm, built on `viem` (already a
 * project dependency) instead of the full OpenZeppelin package, so the post's own widgets
 * ship a few KB instead of the whole library. `test/minimalMerkleTree.test.ts` is a
 * permanent regression guard: it runs both implementations over the same fixture data and
 * asserts identical output, using the real `@openzeppelin/merkle-tree` package kept as a
 * devDependency for exactly that comparison (never imported by shipped code).
 *
 * Algorithm, matching OZ's `core.ts`/`hashes.ts` exactly:
 * - Leaf hash = keccak256(keccak256(abi-encode(types, value))) — the double hash is OZ's
 *   second-preimage-attack mitigation, not incidental.
 * - Leaves are sorted by hash before the tree is built, so the tree's shape doesn't depend
 *   on insertion order; a `treeIndex` map lets `.getProof()` still be addressed by the
 *   original value index.
 * - Internal nodes = keccak256 of each **sorted** pair (commutative hashing) — proof
 *   verification doesn't depend on left/right position, matching on-chain
 *   `MerkleProof.sol`-style verifiers.
 */

function standardLeafHash(value: readonly unknown[], types: readonly string[]): Hex {
  const params = types.map((type) => ({ type }));
  return keccak256(keccak256(encodeAbiParameters(params, value)));
}

function compareHex(a: Hex, b: Hex): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function concatHex(a: Hex, b: Hex): Hex {
  return `0x${a.slice(2)}${b.slice(2)}` as Hex;
}

function hashPair(a: Hex, b: Hex): Hex {
  const [x, y] = [a, b].sort(compareHex);
  return keccak256(concatHex(x, y));
}

const leftChildIndex = (i: number) => 2 * i + 1;
const rightChildIndex = (i: number) => 2 * i + 2;

function parentIndex(i: number): number {
  if (i === 0) throw new Error("Root has no parent");
  return Math.floor((i - 1) / 2);
}

function siblingIndex(i: number): number {
  if (i === 0) throw new Error("Root has no sibling");
  return i % 2 === 0 ? i - 1 : i + 1;
}

function makeMerkleTree(leaves: Hex[]): Hex[] {
  if (leaves.length === 0) throw new Error("Expected non-zero number of leaves");
  const tree = new Array<Hex>(2 * leaves.length - 1);
  for (let i = 0; i < leaves.length; i++) {
    tree[tree.length - 1 - i] = leaves[i];
  }
  for (let i = tree.length - 1 - leaves.length; i >= 0; i--) {
    tree[i] = hashPair(tree[leftChildIndex(i)], tree[rightChildIndex(i)]);
  }
  return tree;
}

function getProof(tree: Hex[], treeIndex: number): Hex[] {
  let idx = treeIndex;
  const proof: Hex[] = [];
  while (idx > 0) {
    proof.push(tree[siblingIndex(idx)]);
    idx = parentIndex(idx);
  }
  return proof;
}

function processProof(leaf: Hex, proof: readonly Hex[]): Hex {
  return proof.reduce<Hex>((a, b) => hashPair(a, b), leaf);
}

interface IndexedValue {
  value: readonly unknown[];
  treeIndex: number;
}

export class StandardMerkleTree {
  private constructor(
    private readonly tree: Hex[],
    private readonly values: readonly (readonly unknown[])[],
    private readonly leafEncoding: readonly string[],
    private readonly indexedValues: IndexedValue[],
  ) {}

  static of(values: readonly (readonly unknown[])[], leafEncoding: readonly string[]): StandardMerkleTree {
    const hashedValues = values.map((value, valueIndex) => ({
      value,
      valueIndex,
      hash: standardLeafHash(value, leafEncoding),
    }));
    hashedValues.sort((a, b) => compareHex(a.hash, b.hash));

    const tree = makeMerkleTree(hashedValues.map((v) => v.hash));

    const indexedValues: IndexedValue[] = values.map((value) => ({ value, treeIndex: 0 }));
    hashedValues.forEach(({ valueIndex }, leafIndex) => {
      indexedValues[valueIndex].treeIndex = tree.length - leafIndex - 1;
    });

    return new StandardMerkleTree(tree, values, leafEncoding, indexedValues);
  }

  get root(): Hex {
    return this.tree[0];
  }

  leafHash(value: readonly unknown[]): Hex {
    return standardLeafHash(value, this.leafEncoding);
  }

  getProof(valueIndex: number): Hex[] {
    return getProof(this.tree, this.indexedValues[valueIndex].treeIndex);
  }

  *entries(): IterableIterator<[number, readonly unknown[]]> {
    for (let i = 0; i < this.values.length; i++) {
      yield [i, this.values[i]];
    }
  }

  static verify(
    root: string,
    leafEncoding: readonly string[],
    value: readonly unknown[],
    proof: readonly string[],
  ): boolean {
    return processProof(standardLeafHash(value, leafEncoding), proof as Hex[]) === root;
  }
}
