import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { BatchSettlementEvmScheme } from "@x402/evm/batch-settlement/server";
import { getUSDCConfig, loadPrivateKey } from "@fretchen/chain-utils";
import { privateKeyToAccount } from "viem/accounts";
import { S3ChannelStorage } from "./x402_channel_storage.js";

const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://facilitator.fretchen.eu";

const SUPPORTED_NETWORKS = [
  "eip155:11155420", // Optimism Sepolia
  "eip155:10", // Optimism Mainnet
  "eip155:8453", // Base Mainnet
  "eip155:84532", // Base Sepolia
];

// The x402BatchSettlement contract (CREATE2, canonical address) is deployed on Optimism
// mainnet too, but @x402/evm's own `DEFAULT_STABLECOINS` registry (consulted internally
// by BatchSettlementEvmScheme.enhancePaymentRequirements(), regardless of the `asset`
// address we already pass in) has no entry for "eip155:10" — enhancing throws
// "No default asset configured for network eip155:10", which would 500 the *entire* 402
// response (Promise.all in createBatchSettlementPaymentRequirements below), not just the
// Optimism entry. Confirmed live via the sc_llm_x402_buyer.ipynb notebook run (2026-07-15).
// Omit Optimism mainnet here until the SDK adds it. Keep in sync (for the deployed-contract
// fact, not this SDK limitation) with x402_facilitator/chain_utils.ts::getBatchSettlementNetworks().
const BATCH_SETTLEMENT_NETWORKS = ["eip155:8453", "eip155:84532"];

// Onchain channel state (balance/totalClaimed) is cached for this long before a fresh
// RPC read; the SDK's default resolves to a fixed 5 minutes (floored by the protocol's
// MIN_WITHDRAW_DELAY), which would make a user's first chat message right after
// depositing spuriously fail with cumulative_exceeds_balance. Confirmed via the B0 spike.
const ONCHAIN_STATE_TTL_MS = 5_000;

export function getSupportedNetworks(): string[] {
  return SUPPORTED_NETWORKS;
}

export function getBatchSettlementNetworks(): string[] {
  return BATCH_SETTLEMENT_NETWORKS;
}

export function createFacilitatorClient(): HTTPFacilitatorClient {
  return new HTTPFacilitatorClient({ url: FACILITATOR_URL });
}

export function createResourceServer(): x402ResourceServer {
  const server = new x402ResourceServer(createFacilitatorClient());
  for (const network of getSupportedNetworks()) {
    server.register(network as `${string}:${string}`, new ExactEvmScheme());
  }
  return server;
}

export interface LLMResourceServer {
  resourceServer: x402ResourceServer;
  scheme: BatchSettlementEvmScheme;
}

/**
 * Resource server for the LLM assistant's x402 batch-settlement channels. A single
 * `BatchSettlementEvmScheme` instance is shared across every supported network (the
 * scheme is receiver-bound, not network-bound — see B0 spike) and reused by the
 * claim/settle cron via `scheme.createChannelManager()`.
 */
export function createLLMResourceServer(receiverAddress: `0x${string}`): LLMResourceServer {
  const resourceServer = new x402ResourceServer(createFacilitatorClient());

  const authorizerAccount = privateKeyToAccount(loadPrivateKey("RECEIVER_AUTHORIZER_PRIVATE_KEY"));
  const scheme = new BatchSettlementEvmScheme(receiverAddress, {
    storage: new S3ChannelStorage(),
    receiverAuthorizerSigner: {
      address: authorizerAccount.address,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signTypedData: (params: any) => authorizerAccount.signTypedData(params),
    },
    onchainStateTtlMs: ONCHAIN_STATE_TTL_MS,
  });

  for (const network of BATCH_SETTLEMENT_NETWORKS) {
    resourceServer.register(network as `${string}:${string}`, scheme);
  }

  return { resourceServer, scheme };
}

export interface BatchSettlementPaymentRequirementsOptions {
  resourceUrl: string;
  description: string;
  mimeType: string;
  amount: string;
  payTo: string;
  scheme: BatchSettlementEvmScheme;
  networks?: readonly string[];
}

/**
 * Builds the 402 `accepts` array for batch-settlement: each network's base requirements
 * must be run through the scheme's own `enhancePaymentRequirements` so the client
 * receives the `receiverAuthorizer`/`withdrawDelay`/EIP-712 domain fields it needs to
 * build a deposit payload (confirmed necessary in the B0 spike).
 */
export async function createBatchSettlementPaymentRequirements({
  resourceUrl,
  description,
  mimeType,
  amount,
  payTo,
  scheme,
  networks = BATCH_SETTLEMENT_NETWORKS,
}: BatchSettlementPaymentRequirementsOptions): Promise<{
  x402Version: number;
  resource: { url: string; description: string; mimeType: string };
  accepts: unknown[];
}> {
  const accepts = await Promise.all(
    networks.map(async (network) => {
      const config = getUSDCConfig(network);
      const base = {
        scheme: "batch-settlement",
        network,
        amount,
        asset: config.address,
        payTo,
        maxTimeoutSeconds: 3600,
        extra: { name: config.usdcName, version: config.usdcVersion },
      };
      return scheme.enhancePaymentRequirements(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        base as any,
        {
          x402Version: 2,
          scheme: "batch-settlement",
          network: network as `${string}:${string}`,
          extra: base.extra,
        },
        [],
      );
    }),
  );

  return {
    x402Version: 2,
    resource: { url: resourceUrl, description, mimeType },
    accepts,
  };
}

export interface PaymentRequirementsOptions {
  resourceUrl: string;
  description: string;
  mimeType: string;
  amount: string;
  payTo: string;
  networks?: readonly string[];
}

export interface PaymentRequirements {
  x402Version: number;
  resource: { url: string; description: string; mimeType: string };
  accepts: Array<{
    scheme: string;
    network: string;
    amount: string;
    asset: string;
    payTo: string;
    maxTimeoutSeconds: number;
    extra: { name: string; version: string };
  }>;
}

export function createPaymentRequirements({
  resourceUrl,
  description,
  mimeType,
  amount,
  payTo,
  networks = getSupportedNetworks(),
}: PaymentRequirementsOptions): PaymentRequirements {
  const accepts = networks.map((network) => {
    const config = getUSDCConfig(network);
    return {
      scheme: "exact",
      network,
      amount,
      asset: config.address,
      payTo,
      maxTimeoutSeconds: 60,
      extra: {
        name: config.usdcName,
        version: config.usdcVersion,
      },
    };
  });

  return {
    x402Version: 2,
    resource: { url: resourceUrl, description, mimeType },
    accepts,
  };
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export function create402Response(paymentRequirements: {
  x402Version: number;
  error?: string;
  resource: { url: string; description?: string; mimeType?: string };
  accepts: unknown[];
  extensions?: Record<string, unknown>;
}): HttpResponse {
  const paymentRequiredHeader = Buffer.from(JSON.stringify(paymentRequirements)).toString("base64");

  return {
    statusCode: 402,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Expose-Headers": "Payment-Required, X-Payment, PAYMENT-REQUIRED",
      "Content-Type": "application/json",
      "Payment-Required": paymentRequiredHeader,
      "X-Payment": JSON.stringify(paymentRequirements),
    },
    body: JSON.stringify(paymentRequirements),
  };
}

export function extractPaymentPayload(
  headers: Record<string, string>,
): Record<string, unknown> | null {
  const v2Header = headers["payment-signature"] ?? headers["Payment-Signature"];
  if (v2Header) {
    try {
      const decoded = Buffer.from(v2Header, "base64").toString("utf-8");
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      console.error("Failed to parse PAYMENT-SIGNATURE header");
      return null;
    }
  }

  const v1Header = headers["x-payment"] ?? headers["X-Payment"];
  if (v1Header) {
    try {
      return JSON.parse(v1Header) as Record<string, unknown>;
    } catch {
      console.error("Failed to parse X-PAYMENT header");
      return null;
    }
  }

  return null;
}

export function createSettlementHeaders(
  settlementResult: Record<string, unknown>,
): Record<string, string> {
  const paymentResponseHeader = Buffer.from(JSON.stringify(settlementResult)).toString("base64");
  return {
    "Payment-Response": paymentResponseHeader,
    "X-Payment-Response": JSON.stringify(settlementResult),
  };
}
