/**
 * The viem facade — this package's consumers import the viem surface from here, never from
 * "viem" directly.
 *
 * Why: each consumer compiles against two viem type copies — this package's (its resolved
 * `import("viem")` finds `shared/chain-utils/node_modules/viem`) and its own `node_modules/viem`
 * — and TypeScript 6 refuses to treat the two `Chain`s as the same type at any call site where
 * they cross. Routing every viem import through this facade resolves all viem types through
 * the one copy, so the crossing never happens, at any viem version. The full story, including
 * the alternatives tested and discarded, is in `../../VIEM_TS6_NOTES.md` (repo root `shared/`).
 *
 * Extend deliberately: add entries here only when a consumer needs them, and never
 * `export *` from "viem/accounts" — its names (signMessage, …) collide with viem's root
 * exports, and ambiguous star re-exports are silently dropped, not errored.
 */

export * from "viem";
// "viem/chains" star-exports share names with viem's root (TS2308), so the module goes out
// as a namespace (`chains.base`), plus the four chains this repo's networks use, named.
export * as chains from "viem/chains";
export { optimism, optimismSepolia, base, baseSepolia } from "viem/chains";
export { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
