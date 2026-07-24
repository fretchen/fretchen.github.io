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
 * (A 7-day transfer-history summary was considered but dropped: it needs wide
 * eth_getLogs ranges, and the configured Alchemy key is on the free tier which caps
 * eth_getLogs at a 10-block range. Balances alone cover the real need — knowing when
 * to top up gas before settlements stall.)
 *
 * Results are emailed weekly via Scaleway Transactional Email (same mechanism as
 * comment_service). One network failing (e.g. an RPC hiccup) degrades that network's
 * row to an error but never kills the whole report.
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
import { getFacilitatorAddress } from "./x402_fee";
import { getChainConfig, getRpcUrl } from "./chain_utils";
import type { ScalewayEvent, ScalewayResponse } from "./x402_facilitator";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// Mainnets only — the two networks where real fees accrue and gas actually matters.
const REPORT_NETWORKS = ["eip155:10", "eip155:8453"] as const;

// Low native-gas warning threshold (ETH). Overridable via env.
const DEFAULT_LOW_GAS_THRESHOLD_ETH = "0.005";

const USDC_DECIMALS = 6;

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

interface NetworkReport {
  network: string;
  chainName: string;
  eth?: string;
  usdc?: string;
  lowGas?: boolean;
  error?: string;
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

    const [ethBalance, usdcBalance] = await Promise.all([
      publicClient.getBalance({ address: facilitator }),
      usdc.read.balanceOf([facilitator]),
    ]);

    const eth = formatEther(ethBalance);
    const threshold = Number(process.env.LOW_GAS_THRESHOLD_ETH ?? DEFAULT_LOW_GAS_THRESHOLD_ETH);

    return {
      network,
      chainName,
      eth,
      usdc: formatUnits(usdcBalance, USDC_DECIMALS),
      lowGas: Number(eth) < threshold,
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
    lines.push(`  Gas (ETH):    ${r.eth}${r.lowGas ? "   ⚠️ LOW — top up to avoid stalled settlements" : ""}`);
    lines.push(`  USDC balance: ${r.usdc}`);
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
    if (!process.env.TEM_PROJECT_ID || !process.env.NOTIFICATION_EMAIL || !process.env.SCW_SECRET_KEY) {
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
