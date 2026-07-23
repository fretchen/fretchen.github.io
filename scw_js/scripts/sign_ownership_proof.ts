/**
 * One-off script: signs an origin URL with NFT_WALLET_PRIVATE_KEY (loaded from
 * scw_js/.env) to produce an x402scan ownership proof (EIP-191 personal_sign, per
 * x402scan's own verification code — apps/scan/src/lib/ownership-proof.ts in
 * Merit-Systems/x402scan). Paste the output signature into the matching
 * openapi.*.json's x-discovery.ownershipProofs.
 *
 * Run once per origin, only when the origin or NFT_WALLET_PRIVATE_KEY changes — not
 * part of the deployed handler.
 *
 * Usage (from scw_js/): npx tsx scripts/sign_ownership_proof.ts <origin-url>
 */
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { loadPrivateKey } from "@fretchen/chain-utils";

// Resolves relative to cwd (scw_js/), matching how npm run dev:* scripts are invoked.
dotenv.config();

const origin = process.argv[2];
if (!origin) {
  console.error("Usage: npx tsx scripts/sign_ownership_proof.ts <origin-url>");
  console.error(
    'Example: npx tsx scripts/sign_ownership_proof.ts "https://imagegen-agent.fretchen.eu"',
  );
  process.exit(1);
}
if (origin !== origin.trim() || /\/$/.test(origin) || !/^https?:\/\/[^/]+$/.test(origin)) {
  console.error(`Origin must be scheme + host only, no path, no trailing slash. Got: "${origin}"`);
  process.exit(1);
}

const account = privateKeyToAccount(loadPrivateKey("NFT_WALLET_PRIVATE_KEY"));
const signature = await account.signMessage({ message: origin });

console.log(`Signer address: ${account.address}`);
console.log(`Origin signed:  ${origin}`);
console.log(`Signature:      ${signature}`);
