/**
 * Check — and with `--approve`, fix — the seller wallet's fee allowance for the facilitator, for
 * every (network, stablecoin) pair the sellers offer.
 *
 * Why this exists: the facilitator charges its flat fee in the token a payment settles in
 * (`x402_facilitator/x402_fee.ts`), so every token the sellers accept needs its own `approve()`
 * from the seller wallet. Nothing tied the two together: EURC went into the 402 offers on Base
 * while its approval stayed at 0, and every EURC image payment was refused with
 * `insufficient_fee_allowance`. The claim cron's warning (`llm_x402_cron.ts`) only fires when a
 * claim is already due, and the `exact` sellers had no warning at all.
 *
 * The pairs come from the same place the 402 offers do — `getSupportedNetworks()` ×
 * `offeredStablecoins()` — so a token or network added later is covered without touching this
 * file. The facilitator's address and fee come from its `/supported`, never from a constant.
 *
 * Runs as `predeploy` (see package.json), so a deploy that would offer an unpayable token stops
 * before it ships. An allowance that could not be *read* only warns: same fail-open rule as the
 * facilitator's own check, so a flaky RPC never blocks a deploy.
 *
 * Needs NFT_WALLET_PUBLIC_KEY (the sellers' payTo); `--approve` also needs NFT_WALLET_PRIVATE_KEY,
 * plus a little native gas on each network it has to fix. Configure RPC_URL_* for reliable reads.
 *
 * Usage (from scw_js/):
 *   npm run fee-allowances                  # check; exit 1 if any pair is below one fee
 *   npm run fee-allowances -- --approve     # approve 100 fees' worth where short
 */
import dotenv from "dotenv";
import { createPublicClient, createWalletClient, erc20Abi, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  getRpcUrl,
  getViemChain,
  loadPrivateKey,
  type StablecoinInfo,
} from "@fretchen/chain-utils";
import { getFacilitatorFeeConfig, getSupportedNetworks } from "../x402_server.js";
import { offeredStablecoins } from "../stablecoin_pricing.js";

dotenv.config();

/** How many fees one approval covers — the facilitator's own recommendation in `/supported`. */
export const SETTLEMENTS_PER_APPROVAL = 100n;

export interface FeePair {
  network: string;
  coin: StablecoinInfo;
}

/** Every (network, stablecoin) pair the sellers put in a 402, and so every pair that needs an approval. */
export function listFeePairs(
  networks: readonly string[],
  coinsFor: (network: string) => StablecoinInfo[] = offeredStablecoins,
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

/** Both stablecoins have 6 decimals. */
function units(atomic: bigint): string {
  return (Number(atomic) / 1e6).toFixed(2);
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
  console.log(`   ✅ ${pair.network} ${pair.coin.symbol}: approved ${units(amount)} (${hash})`);
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
    `Seller ${seller} → facilitator ${fee.recipient}, fee ${units(fee.flatFee)} per settlement\n`,
  );

  const short: FeePair[] = [];
  for (const pair of listFeePairs(getSupportedNetworks())) {
    const status = assessAllowance(await readAllowance(pair, seller, fee.recipient), fee.flatFee);
    const label = `${pair.network.padEnd(16)} ${pair.coin.symbol.padEnd(5)}`;
    if (status.kind === "unknown") {
      console.warn(`⚠️  ${label} allowance unreadable — skipped`);
    } else {
      const mark = status.kind === "ok" ? "✅" : "❌";
      console.log(
        `${mark} ${label} ${String(status.settlementsLeft).padStart(4)} settlements left`,
      );
      if (status.kind === "short") short.push(pair);
    }
  }

  if (short.length === 0) {
    console.log("\nEvery offered pair can pay its fee.");
    return;
  }

  if (!APPROVE) {
    console.error(
      `\n${short.length} offered pair(s) cannot pay the facilitator fee — every payment in them is refused ` +
        "with insufficient_fee_allowance. Fix with: npm run fee-allowances -- --approve",
    );
    process.exit(1);
  }

  const amount = fee.flatFee * SETTLEMENTS_PER_APPROVAL;
  let failed = 0;
  for (const pair of short) {
    try {
      await approve(pair, fee.recipient, amount);
    } catch (err) {
      failed++;
      console.error(
        `   ❌ ${pair.network} ${pair.coin.symbol}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  if (failed > 0) process.exit(1);
}

if (process.argv[1]?.endsWith("fee_allowances.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
