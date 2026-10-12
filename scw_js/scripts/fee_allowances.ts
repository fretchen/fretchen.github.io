/**
 * Check — and with `--approve`, fix — the seller wallet's fee readiness for the facilitator, for
 * every (network, stablecoin) pair the sellers offer: BOTH constraints the fee pull needs, the
 * allowance for the facilitator (fixable by `--approve`) and the wallet's own balance of the
 * token (not fixable here — fund the wallet).
 *
 * Why this exists: the facilitator charges its flat fee in the token a payment settles in
 * (`x402_facilitator/x402_fee.ts`), so every token the sellers accept needs its own `approve()`
 * AND a spendable balance. Two incidents shaped the two checks: EURC shipped with its approval
 * at 0, so every EURC image payment was refused with `insufficient_fee_allowance` (the allowance
 * check); EURe shipped with the allowance fine but the wallet holding less than one fee, so every
 * EURe fee pull reverted after settlement (the balance check). The claim cron's warning
 * (`llm_x402_cron.ts`) only fires when a claim is already due, and the `exact` sellers had no
 * warning at all.
 *
 * The pairs come from the same place the 402 offers do — `getSupportedNetworks()` ×
 * `offeredStablecoins()` — so a token or network added later is covered without touching this
 * file. The facilitator's address and fee come from its `/supported`, never from a constant.
 *
 * Runs as `predeploy` (see package.json), so a deploy that would offer an unpayable token stops
 * before it ships. An allowance or balance that could not be *read* only warns: same fail-open
 * rule as the facilitator's own check, so a flaky RPC never blocks a deploy.
 *
 * Needs NFT_WALLET_PUBLIC_KEY (the sellers' payTo); `--approve` also needs NFT_WALLET_PRIVATE_KEY,
 * plus a little native gas on each network it has to fix. Configure RPC_URL_* for reliable reads.
 *
 * Usage (from scw_js/):
 *   npm run fee-allowances                  # check; exit 1 if any pair is below one fee
 *   npm run fee-allowances -- --approve     # approve 100 fees' worth where short
 */
import dotenv from "dotenv";
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  getRpcUrl,
  getViemChain,
  loadPrivateKey,
  type SettlementTokenInfo,
} from "@fretchen/chain-utils";
import { facilitatorFeeFor } from "../fee_config.js";
import { getFacilitatorFeeConfig, getSupportedNetworks } from "../x402_server.js";
import { offeredStablecoins } from "../stablecoin_pricing.js";

dotenv.config();

/** How many fees one approval covers — the facilitator's own recommendation in `/supported`. */
export const SETTLEMENTS_PER_APPROVAL = 100n;

export interface FeePair {
  network: string;
  coin: SettlementTokenInfo;
}

/** Every (network, token) pair the sellers put in a 402, and so every pair that needs an approval. */
export function listFeePairs(
  networks: readonly string[],
  coinsFor: (network: string) => SettlementTokenInfo[] = offeredStablecoins,
): FeePair[] {
  return networks.flatMap((network) => coinsFor(network).map((coin) => ({ network, coin })));
}

export type AllowanceStatus =
  | { kind: "ok"; settlementsLeft: bigint }
  | { kind: "short"; settlementsLeft: bigint }
  | { kind: "unknown" };

/**
 * `null` means the allowance could not be read. That is "unknown", never "short": treating a
 * failed read as zero would block deploys on a flaky RPC and approve over allowances that exist.
 */
export function assessAllowance(allowance: bigint | null, flatFee: bigint): AllowanceStatus {
  if (allowance === null) return { kind: "unknown" };
  const settlementsLeft = allowance / flatFee;
  return settlementsLeft >= 1n
    ? { kind: "ok", settlementsLeft }
    : { kind: "short", settlementsLeft };
}

export type BalanceStatus =
  | { kind: "ok"; settlementsFunded: bigint }
  | { kind: "short"; settlementsFunded: bigint }
  | { kind: "unknown" };

/**
 * Same arithmetic and the same fail-open rule as `assessAllowance`, for the OTHER constraint the
 * fee pull needs: the seller's own balance. The 2026-10-11 incident passed the allowance check
 * with 0.98 EURe approved while the wallet held less than one 0.01 EURe fee — every EURe fee pull
 * then reverted after settlement. An unreadable balance is "unknown", never "short".
 */
export function assessBalance(balance: bigint | null, flatFee: bigint): BalanceStatus {
  if (balance === null) return { kind: "unknown" };
  const settlementsFunded = balance / flatFee;
  return settlementsFunded >= 1n
    ? { kind: "ok", settlementsFunded }
    : { kind: "short", settlementsFunded };
}

/** A token amount in whole units — USDC/EURC have 6 decimals, EURe 18. */
function units(atomic: bigint, decimals: number): string {
  return formatUnits(atomic, decimals);
}

function publicClientFor(network: string) {
  return createPublicClient({ chain: getViemChain(network), transport: http(getRpcUrl(network)) });
}

async function readAllowance(
  pair: FeePair,
  owner: Address,
  spender: Address,
): Promise<bigint | null> {
  try {
    return await publicClientFor(pair.network).readContract({
      address: pair.coin.address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner, spender],
    });
  } catch {
    return null;
  }
}

/** The seller's own balance of the token — the fee pull spends it, not just draws on the allowance. */
async function readBalance(pair: FeePair, owner: Address): Promise<bigint | null> {
  try {
    return await publicClientFor(pair.network).readContract({
      address: pair.coin.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [owner],
    });
  } catch {
    return null;
  }
}

async function approve(pair: FeePair, spender: Address, amount: bigint): Promise<void> {
  const account = privateKeyToAccount(loadPrivateKey("NFT_WALLET_PRIVATE_KEY"));
  const chain = getViemChain(pair.network);
  const wallet = createWalletClient({ account, chain, transport: http(getRpcUrl(pair.network)) });
  const hash = await wallet.writeContract({
    address: pair.coin.address,
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount],
  });
  const receipt = await publicClientFor(pair.network).waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`approve reverted (${hash})`);
  }
  console.log(
    `   ✅ ${pair.network} ${pair.coin.symbol}: approved ${units(amount, pair.coin.decimals)} (${hash})`,
  );
}

async function main(): Promise<void> {
  const APPROVE = process.argv.includes("--approve");

  const seller = process.env.NFT_WALLET_PUBLIC_KEY as Address | undefined;
  if (!seller) {
    console.error(
      "NFT_WALLET_PUBLIC_KEY is not set — it is the sellers' payTo, whose allowance this checks.",
    );
    process.exit(1);
  }
  if (APPROVE) {
    // The key signs the approval, so it must belong to the wallet whose allowance is short.
    const signer = privateKeyToAccount(loadPrivateKey("NFT_WALLET_PRIVATE_KEY")).address;
    if (signer.toLowerCase() !== seller.toLowerCase()) {
      console.error(
        `NFT_WALLET_PRIVATE_KEY is for ${signer}, not the seller ${seller}. Refusing to approve.`,
      );
      process.exit(1);
    }
  }

  const fee = await getFacilitatorFeeConfig();
  if (!fee) {
    // No fee configured, or /supported unreachable: either way there is nothing this can check.
    console.warn(
      "⚠️  The facilitator advertises no fee (or /supported is unreachable) — nothing to check.",
    );
    return;
  }

  console.log(
    `Seller ${seller} → facilitator ${fee.recipient}, nominal fee ${units(fee.flatFee, 6)} per settlement\n` +
      "   (per-token figures below come from /supported's facilitatorFees.assets — EURe's 0.01 is 10¹² its nominal figure)\n",
  );

  // (network, token) → the fee in THAT token's atomic units. Computed once: both the check
  // and --approve must use it, never the nominal 6-decimal flatFee — for EURe that would
  // divide an 18-decimal allowance by a 6-decimal fee (a 1-EURe approval reported as a
  // trillion settlements) and approve 10⁻¹² EURe over a healthy allowance.
  const allowanceShort: Array<{ pair: FeePair; fee: bigint }> = [];
  const balanceShort: Array<{ pair: FeePair; fee: bigint }> = [];
  for (const pair of listFeePairs(getSupportedNetworks())) {
    const label = `${pair.network.padEnd(16)} ${pair.coin.symbol.padEnd(5)}`;
    const pairFee = facilitatorFeeFor(fee, pair.network, pair.coin.address, pair.coin.decimals);
    if (pairFee === null) {
      // facilitatorFeeFor returns null only for a non-6-decimal token with no per-token entry —
      // an old facilitator build. No number beats a wrong one; refuse to guess.
      console.warn(
        `⚠️  ${label} the facilitator publishes no per-token fee — old build? Run the latest x402_facilitator. Skipped.`,
      );
      continue;
    }
    const status = assessAllowance(await readAllowance(pair, seller, fee.recipient), pairFee);
    const funding = assessBalance(await readBalance(pair, seller), pairFee);
    if (status.kind === "unknown" || funding.kind === "unknown") {
      console.warn(`⚠️  ${label} allowance or balance unreadable — skipped`);
      continue;
    }
    const allowanceOk = status.kind === "ok";
    const balanceOk = funding.kind === "ok";
    const mark = allowanceOk && balanceOk ? "✅" : "❌";
    console.log(
      `${mark} ${label} ${String(status.settlementsLeft).padStart(4)} settlements left (allowance) · ` +
        `${String(funding.settlementsFunded).padStart(4)} funded (balance) · ` +
        `${units(pairFee, pair.coin.decimals)} per settlement`,
    );
    if (!allowanceOk) allowanceShort.push({ pair, fee: pairFee });
    if (!balanceOk) balanceShort.push({ pair, fee: pairFee });
  }

  if (allowanceShort.length === 0 && balanceShort.length === 0) {
    console.log("\nEvery offered pair can pay its fee.");
    return;
  }

  // A short balance is NOT fixable by --approve — the script can approve allowances, not mint
  // tokens. It fails the run either way: check mode because the deploy would ship offers whose
  // fee pulls revert after settlement (the 2026-10-11 EURe incident), approve mode because
  // fixing the allowance alone would still leave those reverts.
  if (balanceShort.length > 0) {
    for (const { pair, fee: pairFee } of balanceShort) {
      console.error(
        `❌ ${pair.network} ${pair.coin.symbol}: the seller wallet holds less than one fee ` +
          `(${units(pairFee, pair.coin.decimals)}) — fund it; the script can approve allowances, not balances.`,
      );
    }
  }

  if (!APPROVE) {
    console.error(
      `\n${allowanceShort.length + balanceShort.length} offered pair(s) cannot pay the facilitator fee — ` +
        "every payment in them is refused with insufficient_fee_allowance (allowance) or its fee pull " +
        "reverts after settlement (balance). Fix allowances with: npm run fee-allowances -- --approve; " +
        "fund balances from the wallet's token source.",
    );
    process.exit(1);
  }

  let failed = 0;
  for (const { pair, fee: pairFee } of allowanceShort) {
    const amount = pairFee * SETTLEMENTS_PER_APPROVAL;
    try {
      await approve(pair, fee.recipient, amount);
    } catch (err) {
      failed++;
      console.error(
        `   ❌ ${pair.network} ${pair.coin.symbol}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  if (failed > 0 || balanceShort.length > 0) process.exit(1);
}

if (process.argv[1]?.endsWith("fee_allowances.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
