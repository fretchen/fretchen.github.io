/**
 * Mints an owner bearer token for manual `GET /stats` calls.
 *
 * The browser does this with the connected wallet (`useWalletAuth`); this is
 * the terminal equivalent, for poking the endpoint with curl.
 *
 *   OWNER_PRIVATE_KEY=0x... npx tsx scripts/mint-token.ts
 *   curl -H "Authorization: $(OWNER_PRIVATE_KEY=0x... npx tsx scripts/mint-token.ts)" \
 *        'http://localhost:8087/stats?days=90'
 *
 * The token is valid for five minutes. Use a throwaway key locally and set
 * `OWNER_ETH_ADDRESS` to its address — never the real owner key.
 */
import { privateKeyToAccount } from "viem/accounts";

const key = process.env.OWNER_PRIVATE_KEY;
if (!key?.startsWith("0x")) {
  console.error("Set OWNER_PRIVATE_KEY to a 0x-prefixed private key");
  process.exit(1);
}

const account = privateKeyToAccount(key as `0x${string}`);
const message = `analytics-api:${Math.floor(Date.now() / 1000)}`;
const signature = await account.signMessage({ message });
const payload = JSON.stringify({ address: account.address, signature, message });

process.stdout.write(`Bearer ${Buffer.from(payload).toString("base64")}`);
