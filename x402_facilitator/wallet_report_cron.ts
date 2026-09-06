/**
 * Weekly Facilitator Wallet Report (scheduled)
 *
 * The facilitator settles USDC payments on OP and Base mainnet using a single hot
 * wallet (FACILITATOR_WALLET_PRIVATE_KEY). That wallet needs native ETH to pay gas
 * for settlements/fee-collection and accumulates USDC fees. There is no database of
 * facilitator activity, so this cron reads current balances directly from chain:
 *   - native (ETH) balance  -> the real "will settlements keep working?" signal
 *   - USDC balance          -> accumulated fee revenue
 *
 * It also reports week-over-week ACTIVITY (transactions sent, fees earned, gas spent)
 * by reading the same balances/nonce as of a block ~7 days ago and diffing against now.
 * An event-log transfer history was considered for this and dropped: it needs wide
 * eth_getLogs ranges, and the configured Alchemy key is on the free tier which caps
 * eth_getLogs at a 10-block range. Historical account-state reads (balance/nonce AT a
 * past block) have no such range limit and work on the plain public RPCs already used
 * here — no new secret, no new dependency. The tradeoff: no exact/batch-settlement
 * scheme split, since that needs each transaction's destination contract, i.e. real
 * transaction history. Not worth an explorer-API dependency while volume is near zero;
 * revisit if traffic ever makes the split interesting.
 *
 * Results are emailed weekly via Scaleway Transactional Email (same mechanism as
 * comment_service). One network failing (e.g. an RPC hiccup) degrades that network's
 * row to an error but never kills the whole report. The activity numbers degrade
 * independently of balances: an RPC without archive state still reports gas/fee
 * balances normally and just marks activity "unavailable" for that network.
 */

import {
  createPublicClient,
  http,
  getContract,
  formatUnits,
  formatEther,
  type Address,
  type Abi,
} from "viem";
import pino from "pino";
import { getFacilitatorAddress, getFeeAmount } from "./x402_fee";
import { getChainConfig, getRpcUrl } from "./chain_utils";
import type { ScalewayEvent, ScalewayResponse } from "./x402_facilitator";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// Mainnets only — the two networks where real fees accrue and gas actually matters.
const REPORT_NETWORKS = ["eip155:10", "eip155:8453"] as const;

// Low native-gas warning threshold (ETH). Overridable via env.
const DEFAULT_LOW_GAS_THRESHOLD_ETH = "0.005";

const USDC_DECIMALS = 6;

// Both report networks are OP-stack chains at a ~2s block time, so this is ~7 days.
// Revisit if REPORT_NETWORKS ever gains a network with a different block time.
const LOOKBACK_BLOCKS = 302_400n;

// Minimal ERC-20 read ABI (balanceOf) — mirrors the shape used in x402_fee.ts.
const ERC20_BALANCE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const satisfies Abi;

interface ActivityReport {
  /** Transactions the facilitator sent — the nonce delta over the lookback window. */
  txCount: number;
  /**
   * Net USDC balance change over the window. Negative when more was withdrawn than
   * earned — never render this as "earned" without checking the sign.
   */
  usdcDelta: string;
  /** Positive = topped up over the window, negative = spent on gas. */
  ethDelta: string;
  /**
   * Settlements implied by `usdcDelta / flatFee` — an ESTIMATE, not a count of actual
   * settlements. Uses the CURRENT fee rate (`getFeeAmount()` at report time), not
   * whatever rate was actually in effect during the window, and treats any non-fee USDC
   * movement (a manual top-up, a refund, a withdrawal) as if it were settlement revenue.
   * Present only when a fee is configured and `usdcDelta > 0`.
   */
  estimatedSettlements?: number;
}

interface NetworkReport {
  network: string;
  chainName: string;
  eth?: string;
  usdc?: string;
  lowGas?: boolean;
  error?: string;
  /** Absent when the historical reads failed (e.g. no archive state) — balances above are
   *  unaffected either way. */
  activity?: ActivityReport;
}

async function buildNetworkReport(network: string, facilitator: Address): Promise<NetworkReport> {
  const config = getChainConfig(network);
  const chainName = config.chain.name;

  try {
    const publicClient = createPublicClient({
      chain: config.chain,
      transport: http(getRpcUrl(network)),
    });

    const usdc = getContract({
      address: config.USDC_ADDRESS as Address,
      abi: ERC20_BALANCE_ABI,
      client: publicClient,
    });

    // All four "current state" reads are fired here, before anything is awaited, so their
    // network round-trips overlap rather than serialize. They're still awaited in two
    // separate groups below: the balances are the critical pair (their failure fails the
    // whole network report, via the outer try/catch), while the block number and nonce are
    // only ever used for the optional activity block and must not be able to take the
    // balances down with them if they fail — see the inner try/catch below.
    const ethBalancePromise = publicClient.getBalance({ address: facilitator });
    const usdcBalancePromise = usdc.read.balanceOf([facilitator]);
    const currentBlockPromise = publicClient.getBlockNumber();
    const currentNoncePromise = publicClient.getTransactionCount({ address: facilitator });

    const [ethBalance, usdcBalance] = await Promise.all([ethBalancePromise, usdcBalancePromise]);

    const eth = formatEther(ethBalance);
    const threshold = Number(process.env.LOW_GAS_THRESHOLD_ETH ?? DEFAULT_LOW_GAS_THRESHOLD_ETH);

    // Independent try/catch: an RPC without archive state (or any other failure here)
    // must not affect the balances/lowGas result above, which is the more important half
    // of this report.
    let activity: ActivityReport | undefined;
    try {
      const currentBlock = await currentBlockPromise;
      if (currentBlock > LOOKBACK_BLOCKS) {
        const lookbackBlock = currentBlock - LOOKBACK_BLOCKS;

        const [pastNonce, currentNonce, pastEth, pastUsdc] = await Promise.all([
          publicClient.getTransactionCount({ address: facilitator, blockNumber: lookbackBlock }),
          currentNoncePromise,
          publicClient.getBalance({ address: facilitator, blockNumber: lookbackBlock }),
          usdc.read.balanceOf([facilitator], { blockNumber: lookbackBlock }),
        ]);

        const usdcDelta = usdcBalance - pastUsdc;
        const ethDelta = ethBalance - pastEth;
        const feeAmount = getFeeAmount();

        activity = {
          txCount: currentNonce - pastNonce,
          usdcDelta: formatUnits(usdcDelta, USDC_DECIMALS),
          ethDelta: formatEther(ethDelta),
          ...(feeAmount > 0n &&
            usdcDelta > 0n && { estimatedSettlements: Number(usdcDelta / feeAmount) }),
        };
      }
    } catch (err) {
      logger.warn({ err, network }, "Could not read historical wallet state — omitting activity");
    }

    return {
      network,
      chainName,
      eth,
      usdc: formatUnits(usdcBalance, USDC_DECIMALS),
      lowGas: Number(eth) < threshold,
      ...(activity && { activity }),
    };
  } catch (err) {
    logger.error({ err, network }, "Failed to build wallet report for network");
    return { network, chainName, error: (err as Error).message };
  }
}

function renderEmailText(facilitator: Address, reports: NetworkReport[]): string {
  const lines: string[] = [];
  lines.push(`Facilitator wallet: ${facilitator}`);
  lines.push("");

  for (const r of reports) {
    lines.push(`── ${r.chainName} (${r.network}) ──`);
    if (r.error) {
      lines.push(`  ⚠️ Could not read this network: ${r.error}`);
      lines.push("");
      continue;
    }
    lines.push(
      `  Gas (ETH):    ${r.eth}${r.lowGas ? "   ⚠️ LOW — top up to avoid stalled settlements" : ""}`,
    );
    lines.push(`  USDC balance: ${r.usdc}`);
    lines.push("");
    lines.push(`  Last ~7 days:`);
    if (!r.activity) {
      lines.push(`    unavailable (RPC returned no historical state)`);
    } else {
      const { txCount, usdcDelta, ethDelta, estimatedSettlements } = r.activity;
      lines.push(`    Transactions:  ${txCount}`);
      // Sign carries the meaning here — a negative delta is a withdrawal, not "earned".
      const usdcSign = Number(usdcDelta) >= 0 ? "+" : "";
      const settlementsNote =
        estimatedSettlements !== undefined ? `  (≈ ${estimatedSettlements} settlements)` : "";
      lines.push(`    USDC change:   ${usdcSign}${usdcDelta} USDC${settlementsNote}`);
      const ethSign = Number(ethDelta) >= 0 ? "+" : "";
      const ethNote = Number(ethDelta) >= 0 ? "  (topped up)" : "  (gas spent)";
      lines.push(`    ETH change:    ${ethSign}${ethDelta} ETH${ethNote}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Send the report via Scaleway Transactional Email. Mirrors comment_service's
 * sendEmailNotification: skip-with-warning when TEM env vars are unset, never throw.
 */
async function sendReport(subject: string, text: string): Promise<void> {
  try {
    if (
      !process.env.TEM_PROJECT_ID ||
      !process.env.NOTIFICATION_EMAIL ||
      !process.env.SCW_SECRET_KEY
    ) {
      logger.warn(
        "Email report skipped: TEM_PROJECT_ID, NOTIFICATION_EMAIL or SCW_SECRET_KEY not set",
      );
      return;
    }

    const res = await fetch(
      "https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails",
      {
        method: "POST",
        headers: {
          "X-Auth-Token": process.env.SCW_SECRET_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: process.env.TEM_PROJECT_ID,
          from: { email: "comments@fretchen.eu", name: "Facilitator Monitor" },
          to: [{ email: process.env.NOTIFICATION_EMAIL }],
          subject,
          text,
        }),
      },
    );

    if (!res.ok) {
      logger.error(`Email API returned ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    logger.error({ err }, "Email report failed");
  }
}

export async function handle(_: ScalewayEvent, _context: unknown): Promise<ScalewayResponse> {
  const headers = { "Content-Type": "application/json" };

  const facilitator = getFacilitatorAddress();
  if (!facilitator) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Facilitator wallet not configured. Set FACILITATOR_WALLET_PRIVATE_KEY.",
      }),
    };
  }

  const reports: NetworkReport[] = [];
  for (const network of REPORT_NETWORKS) {
    reports.push(await buildNetworkReport(network, facilitator));
  }

  const text = renderEmailText(facilitator, reports);
  await sendReport("📊 Facilitator weekly report", text);

  // 500 only when every network failed — a partial report is still useful.
  const allFailed = reports.every((r) => r.error !== undefined);
  return {
    statusCode: allFailed ? 500 : 200,
    headers,
    body: JSON.stringify({ facilitator, reports }),
  };
}

if (process.env.NODE_ENV === "test") {
  (async () => {
    const dotenvModule = await import("dotenv");
    dotenvModule.config();
    const scw_fnc_node = await import("@scaleway/serverless-functions");
    scw_fnc_node.serveHandler(handle as Parameters<typeof scw_fnc_node.serveHandler>[0], 8085);
  })().catch((err) => logger.error({ err }, "Error starting local server"));
}
