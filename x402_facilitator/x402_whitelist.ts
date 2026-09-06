/**
 * x402 Batch-Settlement Test-Wallet Bypass
 *
 * `batch-settlement` gates its on-chain `claim`/`settle` transactions the same way
 * `exact` gates recipients: a USDC allowance fee check (see `x402_fee.ts`). This module
 * carries only the testnet convenience carve-out — a fixed list of test wallets that
 * skip the allowance check on testnets, so CI/local dev doesn't need a funded USDC
 * allowance to exercise the scheme.
 *
 * `deposit`, `voucher`, and `refund` payloads are not gated here or anywhere else —
 * they are not "usage" (payment realization), so they carry no fee and no check.
 *
 * History: this file used to also carry `BATCH_SETTLEMENT_MANUAL_WHITELIST`, an
 * explicit allowlist gating every batch-settlement payload type. Retired once the
 * claim/settle allowance check took over as the abuse gate (FEE_MODEL_PLAN.md Phase 3).
 */

import { isTestnet } from "@fretchen/chain-utils";

function parseAddressList(envVar: string | undefined): string[] {
  if (!envVar) {
    return [];
  }
  return envVar.split(",").map((address) => address.trim().toLowerCase());
}

function getTestWallets(): string[] {
  return parseAddressList(process.env.BATCH_SETTLEMENT_TEST_WALLETS);
}

/**
 * Check whether a batch-settlement `claim`/`settle` receiver is a testnet test wallet
 * that should skip the allowance/fee check.
 */
export function isTestWalletBypassed(address: string, network: string): boolean {
  const normalizedAddress = address.toLowerCase();
  return isTestnet(network) && getTestWallets().includes(normalizedAddress);
}
