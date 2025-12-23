// @ts-check

/**
 * x402 v2 Resource Server Configuration
 * Centralized server instance for handling x402 payments across multiple chains
 */

import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

// Facilitator configuration
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://facilitator.fretchen.eu";

/**
 * Multi-chain network configuration
 * Maps CAIP-2 network identifiers to chain-specific details
 */
export const NETWORK_CONFIG = {
  // ⚠️ ORDER MATTERS: x402 client may choose first matching network!
  // Put Sepolia first to test client network selection behavior
  "eip155:11155420": {
    // Optimism Sepolia
    name: "Optimism Sepolia",
    chainId: 11155420,
    usdc: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    usdcDecimals: 6,
    usdcName: "USDC",
    usdcVersion: "2",
  },
  "eip155:10": {
    // Optimism Mainnet
    name: "Optimism Mainnet",
    chainId: 10,
    usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    usdcDecimals: 6,
    usdcName: "USDC",
    usdcVersion: "2",
  },
  "eip155:8453": {
    // Base Mainnet
    name: "Base Mainnet",
    chainId: 8453,
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    usdcDecimals: 6,
    usdcName: "USDC",
    usdcVersion: "2",
  },
  "eip155:84532": {
    // Base Sepolia
    name: "Base Sepolia",
    chainId: 84532,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    usdcDecimals: 6,
    usdcName: "USDC",
    usdcVersion: "2",
  },
};

/**
 * Get supported networks list
 * @returns {string[]} Array of supported CAIP-2 network identifiers
 */
export function getSupportedNetworks() {
  return Object.keys(NETWORK_CONFIG);
}

/**
 * Create and configure x402 Resource Server
 * Registers all supported networks with ExactEvmScheme
 * @returns {x402ResourceServer} Configured resource server instance
 */
export function createResourceServer() {
  // Create facilitator client
  const facilitatorClient = new HTTPFacilitatorClient({
    url: FACILITATOR_URL,
  });

  // Create resource server
  const server = new x402ResourceServer(facilitatorClient);

  // Register ExactEvmScheme for all supported networks
  // This enables the same payment mechanism across Optimism, Base, etc.
  for (const network of getSupportedNetworks()) {
    server.register(network, new ExactEvmScheme());
  }

  return server;
}

/**
 * Create payment requirements for a route
 * Supports multiple networks (client chooses which to use)
 * @param {Object} options - Payment options
 * @param {string} options.resourceUrl - URL of the protected resource
 * @param {string} options.description - Human-readable description
 * @param {string} options.mimeType - Response MIME type
 * @param {string} options.amount - USDC amount in atomic units (e.g., "1000" = $0.001)
 * @param {string} options.payTo - Recipient wallet address
 * @param {string[]} [options.networks] - Networks to accept (defaults to all supported)
 * @returns {Object} Payment requirements object
 */
export function createPaymentRequirements({
  resourceUrl,
  description,
  mimeType,
  amount,
  payTo,
  networks = getSupportedNetworks(),
}) {
  // Build accepts array with all supported networks
  const accepts = networks.map((network) => {
    const config = NETWORK_CONFIG[network];
    if (!config) {
      throw new Error(`Unsupported network: ${network}`);
    }

    return {
      scheme: "exact",
      network,
      amount,
      asset: config.usdc,
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
    resource: {
      url: resourceUrl,
      description,
      mimeType,
    },
    accepts,
  };
}

/**
 * Create 402 Payment Required response
 * @param {Object} paymentRequirements - Payment requirements from createPaymentRequirements()
 * @returns {Object} HTTP response object
 */
export function create402Response(paymentRequirements) {
  // x402 v2 uses PAYMENT-REQUIRED header (base64 encoded)
  const paymentRequiredHeader = Buffer.from(JSON.stringify(paymentRequirements)).toString("base64");

  return {
    statusCode: 402,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
      "Content-Type": "application/json",
      "Payment-Required": paymentRequiredHeader,
      // Backwards compatibility with v1
      "X-Payment": JSON.stringify(paymentRequirements),
    },
    body: JSON.stringify(paymentRequirements),
  };
}

/**
 * Extract payment payload from request headers
 * Supports both v2 (PAYMENT-SIGNATURE) and v1 (X-PAYMENT) headers
 * @param {Object} headers - Request headers object
 * @returns {Object|null} Parsed payment payload or null if not present
 */
export function extractPaymentPayload(headers) {
  // Try v2 header first (base64-encoded)
  const v2Header = headers["payment-signature"] || headers["Payment-Signature"];
  if (v2Header) {
    try {
      // v2 header is base64-encoded, decode it first
      const decoded = Buffer.from(v2Header, "base64").toString("utf-8");
      return JSON.parse(decoded);
    } catch (error) {
      console.error("Failed to parse PAYMENT-SIGNATURE header:", error);
      return null;
    }
  }

  // Fallback to v1 header (plain JSON string)
  const v1Header = headers["x-payment"] || headers["X-Payment"];
  if (v1Header) {
    try {
      return JSON.parse(v1Header);
    } catch (error) {
      console.error("Failed to parse X-PAYMENT header:", error);
      return null;
    }
  }

  return null;
}

/**
 * Create payment settlement response
 * @param {Object} settlementResult - Result from server.settle()
 * @returns {Object} Response headers with settlement confirmation
 */
export function createSettlementHeaders(settlementResult) {
  // x402 v2 uses PAYMENT-RESPONSE header
  const paymentResponseHeader = Buffer.from(JSON.stringify(settlementResult)).toString("base64");

  return {
    "Payment-Response": paymentResponseHeader,
    // Backwards compatibility with v1
    "X-Payment-Response": JSON.stringify(settlementResult),
  };
}
