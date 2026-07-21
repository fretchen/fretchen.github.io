// Node-only helpers that read `process.env`. Kept together (rather than one file per
// function) because the Node/browser split is the distinction that actually matters
// here: `website/` imports this package too, but only the isomorphic parts, and must
// use its own `import.meta.env.PUBLIC_ENV__*` convention instead of anything below.
//
// Minimal type shim — avoids taking @types/node as a library dependency.
declare const process: { env: Record<string, string | undefined> } | undefined;

/**
 * Read and validate a 64-hex-character private key from an environment variable.
 * Tolerates an optional `0x`/`0X` prefix and surrounding whitespace (Scaleway secrets
 * frequently arrive with a trailing newline).
 *
 * @param envVarName - Name of the environment variable holding the key.
 * @returns The key, normalized to a `0x`-prefixed lowercase-prefix hex string.
 * @throws If the variable is unset/blank, or is not exactly 64 hex characters.
 */
export function loadPrivateKey(envVarName: string): `0x${string}` {
  const raw = process?.env[envVarName];
  const trimmed = raw?.trim();
  if (!trimmed) throw new Error(`${envVarName} not configured`);
  const hex = trimmed.replace(/^0x/i, "");
  if (!/^[0-9a-fA-F]{64}$/.test(hex))
    throw new Error(`${envVarName} invalid: must be 64 hex characters`);
  return `0x${hex}`;
}

/**
 * Optional per-network RPC endpoint, read from `RPC_URL_<NETWORK>` — e.g.
 * `RPC_URL_EIP155_8453` for Base mainnet, `RPC_URL_EIP155_84532` for Base Sepolia.
 * Returns `undefined` when unset or empty, which makes viem's `http()` fall back to
 * the chain's default public endpoint.
 *
 * **Configure this for any network carrying real traffic.** The public defaults
 * (e.g. `https://mainnet.base.org`) are aggressively rate-limited: a single
 * batch-settlement deposit issues a Multicall3 batch of channel-state reads and comes
 * back `over rate limit`, which the SDK surfaces as the generic
 * `..._deposit_transaction_failed` even though nothing was ever submitted on-chain.
 * The same throttling shows up as multi-second latency on otherwise trivial reads.
 *
 * @param network - CAIP-2 network identifier, e.g. `"eip155:8453"`.
 * @returns The configured RPC URL, or `undefined` to accept viem's public default.
 */
export function getRpcUrl(network: string): string | undefined {
  const key = `RPC_URL_${network.replace(/[:-]/g, "_").toUpperCase()}`;
  return process?.env[key] || undefined;
}
