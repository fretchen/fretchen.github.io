// @ts-check

/**
 * x402 v2 Facilitator Instance
 * Centralized facilitator configuration with Optimism support
 *
 * Architecture: One ExactEvmScheme per network (following x402 best practices)
 * Each network has its own dedicated viem client, eliminating chain selection issues
 */

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { x402Facilitator } from "@x402/core/facilitator";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
import pino from "pino";
import { isAgentWhitelisted } from "./x402_whitelist.js";
import { getChainConfig, getSupportedNetworks } from "./chain_utils.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Create a FacilitatorEvmSigner for a specific network
 * The signer is bound to a single chain - no dynamic chain selection needed
 * @param {import("viem").Account} account - The account to use for signing
 * @param {string} network - The network identifier (e.g., "eip155:10")
 * @returns {Object} FacilitatorEvmSigner bound to the specified network
 */
function createSignerForNetwork(account, network) {
  const config = getChainConfig(network);

  const publicClient = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: config.chain,
    transport: http(config.rpcUrl),
  });

  // Create signer bound to this specific chain
  // No dynamic chain selection needed - the viem clients are already configured
  return toFacilitatorEvmSigner({
    address: account.address,
    readContract: (args) =>
      publicClient.readContract({
        ...args,
        args: args.args || [],
      }),
    verifyTypedData: (args) => publicClient.verifyTypedData(args),
    writeContract: (args) =>
      walletClient.writeContract({
        ...args,
        args: args.args || [],
      }),
    sendTransaction: (args) => walletClient.sendTransaction(args),
    waitForTransactionReceipt: (args) => publicClient.waitForTransactionReceipt(args),
    getCode: (args) => publicClient.getCode(args),
  });
}

/**
 * Create read-only facilitator (without signer, for getSupported() only)
 * @returns {x402Facilitator} Read-only facilitator instance
 */
export function createReadOnlyFacilitator() {
  const facilitator = new x402Facilitator();

  // Register each network with a read-only scheme
  for (const network of getSupportedNetworks()) {
    const config = getChainConfig(network);

    const publicClient = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    // Read-only signer (no wallet operations)
    const readOnlySigner = toFacilitatorEvmSigner({
      address: "0x0000000000000000000000000000000000000000",
      readContract: (args) =>
        publicClient.readContract({
          ...args,
          args: args.args || [],
        }),
      verifyTypedData: (args) => publicClient.verifyTypedData(args),
      writeContract: () => {
        throw new Error("Read-only facilitator cannot write contracts");
      },
      sendTransaction: () => {
        throw new Error("Read-only facilitator cannot send transactions");
      },
      waitForTransactionReceipt: () => {
        throw new Error("Read-only facilitator cannot wait for receipts");
      },
      getCode: (args) => publicClient.getCode(args),
    });

    facilitator.register(network, new ExactEvmScheme(readOnlySigner));
  }

  logger.info({
    networks: getSupportedNetworks(),
    msg: "x402 Facilitator initialized (read-only mode)",
  });

  return facilitator;
}

/**
 * Create the facilitator instance with Optimism support
 * Uses separate ExactEvmScheme per network (x402 best practice)
 * @param {boolean} requirePrivateKey - Whether to require private key (default: true)
 * @returns {x402Facilitator} Configured facilitator instance
 */
export function createFacilitator(requirePrivateKey = true) {
  // Get facilitator private key
  let privateKey = process.env.FACILITATOR_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    if (requirePrivateKey) {
      throw new Error("FACILITATOR_WALLET_PRIVATE_KEY not configured");
    }
    return createReadOnlyFacilitator();
  }

  // Normalize private key format
  privateKey = privateKey.trim();
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }

  // Validate private key length
  if (privateKey.length !== 66) {
    if (!requirePrivateKey) {
      return createReadOnlyFacilitator();
    }
    throw new Error(
      `Invalid FACILITATOR_WALLET_PRIVATE_KEY: Expected 64 hex characters, got ${privateKey.length - 2}`,
    );
  }

  // Create account from private key
  const account = privateKeyToAccount(privateKey);

  // Create and configure facilitator
  const facilitator = new x402Facilitator();

  // Register a separate ExactEvmScheme for each network
  // This follows x402 best practices: one signer per network
  const supportedNetworks = getSupportedNetworks();
  for (const network of supportedNetworks) {
    const signer = createSignerForNetwork(account, network);
    facilitator.register(network, new ExactEvmScheme(signer));
  }

  // Add whitelist check AFTER verification
  facilitator.onAfterVerify(async ({ paymentPayload, result }) => {
    if (!result.isValid) {
      return;
    }

    const network = paymentPayload.accepted?.network;
    const recipient = paymentPayload.payload?.authorization?.to;

    if (!network || !recipient) {
      logger.warn("Missing network or recipient after verification");
      result.isValid = false;
      result.invalidReason = "invalid_payload";
      return;
    }

    const whitelistCheck = await isAgentWhitelisted(recipient, network);
    if (!whitelistCheck.isWhitelisted) {
      logger.warn({ recipient, network }, "Payment verification failed: Recipient not whitelisted");
      result.isValid = false;
      result.invalidReason = "unauthorized_agent";
      result.recipient = recipient;
      return;
    }

    logger.info(
      { recipient, network, source: whitelistCheck.source },
      "Recipient whitelist check passed",
    );
  });

  logger.info(
    {
      networks: supportedNetworks,
      signerAddress: account.address,
    },
    "x402 Facilitator initialized",
  );

  return facilitator;
}

// Singleton instance
let facilitatorInstance = null;

/**
 * Get or create the facilitator instance
 * @param {boolean} requirePrivateKey - Whether to require private key (default: true)
 * @returns {x402Facilitator} The facilitator instance
 */
export function getFacilitator(requirePrivateKey = true) {
  if (!facilitatorInstance) {
    facilitatorInstance = createFacilitator(requirePrivateKey);
  }
  return facilitatorInstance;
}

/**
 * Reset the facilitator instance (for testing)
 */
export function resetFacilitator() {
  facilitatorInstance = null;
}
