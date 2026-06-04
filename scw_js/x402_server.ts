import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { getUSDCConfig } from "@fretchen/chain-utils";

const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://facilitator.fretchen.eu";

const SUPPORTED_NETWORKS = [
  "eip155:11155420", // Optimism Sepolia
  "eip155:10", // Optimism Mainnet
  "eip155:8453", // Base Mainnet
  "eip155:84532", // Base Sepolia
];

export function getSupportedNetworks(): string[] {
  return SUPPORTED_NETWORKS;
}

export function createResourceServer(): x402ResourceServer {
  const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
  const server = new x402ResourceServer(facilitatorClient);
  for (const network of getSupportedNetworks()) {
    server.register(network as `${string}:${string}`, new ExactEvmScheme());
  }
  return server;
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

export function create402Response(paymentRequirements: PaymentRequirements): HttpResponse {
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
