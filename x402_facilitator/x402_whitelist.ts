/**
 * x402 Batch-Settlement Recipient Whitelist
 *
 * Gates which merchants (the `payTo` / channel receiver address) may use the
 * fee-free `batch-settlement` scheme. `exact` gates recipients via a USDC
 * allowance fee (see `x402_fee.ts`); batch-settlement is fee-free by protocol
 * design so it has no fee to gate on, and needs its own check instead.
 *
 * Plain explicit allowlist — no on-chain lookups. An earlier draft reused the
 * historical `exact`-scheme whitelist's on-chain `isAuthorizedAgent()` check
 * against GenImNFTv4/LLMv1, but that registry has no real relationship to
 * batch-settlement's receivers (it authorizes image-generation backend agents,
 * and LLMv1 is the contract batch-settlement replaces) — dropped in favor of
 * a scoped, explicit allowlist.
 */

import { isTestnet } from "@fretchen/chain-utils";

function parseAddressList(envVar: string | undefined): string[] {
  if (!envVar) {
    return [];
  }
  return envVar.split(",").map((address) => address.trim().toLowerCase());
}

function getManualWhitelist(): string[] {
  return parseAddressList(process.env.BATCH_SETTLEMENT_MANUAL_WHITELIST);
}

function getTestWallets(): string[] {
  return parseAddressList(process.env.BATCH_SETTLEMENT_TEST_WALLETS);
}

/**
 * Check whether a recipient (batch-settlement `payTo` / channel receiver) is
 * authorized to use batch-settlement.
 *
 * OR logic: whitelisted if the address is in `BATCH_SETTLEMENT_MANUAL_WHITELIST`
 * (any network) or in `BATCH_SETTLEMENT_TEST_WALLETS` (testnets only).
 */
export function isRecipientWhitelisted(address: string, network: string): boolean {
  const normalizedAddress = address.toLowerCase();

  if (getManualWhitelist().includes(normalizedAddress)) {
    return true;
  }

  return isTestnet(network) && getTestWallets().includes(normalizedAddress);
}
