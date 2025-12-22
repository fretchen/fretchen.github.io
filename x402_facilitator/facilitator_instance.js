// @ts-check

/**
 * x402 v2 Facilitator Instance
 * Centralized facilitator configuration with Optimism support
 */

import { createPublicClient, createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimism, optimismSepolia } from "viem/chains";
import { x402Facilitator } from "@x402/core/facilitator";
import { registerExactEvmScheme, toFacilitatorEvmSigner } from "@x402/evm/exact/facilitator";
import pino from "pino";
import { isAgentWhitelisted } from "./x402_whitelist.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Create read-only facilitator (without signer, for getSupported() only)
 * @returns {x402Facilitator} Read-only facilitator instance
 */
export function createReadOnlyFacilitator() {
  // Create public-only clients (no wallet/signer)
  const optimismPublic = createPublicClient({
    chain: optimism,
    transport: http(),
  });

  const sepoliaPublic = createPublicClient({
    chain: optimismSepolia,
    transport: http(),
  });

  // Create read-only signer (only publicClient, no walletClient or getAddresses)
  const readOnlySigner = {
    publicClient: (network) => {
      if (network === "eip155:10") return optimismPublic;
      if (network === "eip155:11155420") return sepoliaPublic;
      throw new Error(`Unsupported network: ${network}`);
    },
    // No walletClient - read-only mode
    // Return empty array for getAddresses - no signer available
    getAddresses: () => [],
  };

  // Create and configure facilitator
  const facilitator = new x402Facilitator();

  // Register EVM Exact scheme for Optimism networks (read-only)
  registerExactEvmScheme(facilitator, {
    signer: readOnlySigner,
    networks: ["eip155:10", "eip155:11155420"],
    deployERC4337WithEIP6492: false,
  });

  logger.info({
    networks: ["eip155:10", "eip155:11155420"],
    msg: "x402 Facilitator initialized (read-only mode)",
  });

  return facilitator;
}

/**
 * Create the facilitator instance with Optimism support
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
    // Create read-only facilitator without signer for getSupported()
    return createReadOnlyFacilitator();
  }

  // Normalize private key format
  privateKey = privateKey.trim();
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }

  // Validate private key length
  if (privateKey.length !== 66) {
    // If invalid and requirePrivateKey is false, return read-only facilitator
    if (!requirePrivateKey) {
      return createReadOnlyFacilitator();
    }
    throw new Error(
      `Invalid FACILITATOR_WALLET_PRIVATE_KEY: Expected 64 hex characters, got ${privateKey.length - 2}`,
    );
  }

  // Create account from private key
  const account = privateKeyToAccount(privateKey);

  // Create combined client for Optimism Mainnet using .extend(publicActions)
  // This gives us both wallet and public client methods in one object
  const optimismClient = createWalletClient({
    account,
    chain: optimism,
    transport: http(),
  }).extend(publicActions);

  // Create combined client for Optimism Sepolia
  const sepoliaClient = createWalletClient({
    account,
    chain: optimismSepolia,
    transport: http(),
  }).extend(publicActions);

  // Use Sepolia as default for development/testing
  const defaultClient = sepoliaClient;

  // Create facilitator signer using x402's toFacilitatorEvmSigner helper
  // The combined client already has all necessary methods (readContract, verifyTypedData, etc.)
  // toFacilitatorEvmSigner just adds getAddresses() wrapper
  const facilitatorSigner = toFacilitatorEvmSigner({
    address: account.address,
    readContract: (args) => defaultClient.readContract({
      ...args,
      args: args.args || [],
    }),
    verifyTypedData: (args) => defaultClient.verifyTypedData(args),
    writeContract: (args) => defaultClient.writeContract({
      ...args,
      args: args.args || [],
    }),
    sendTransaction: (args) => defaultClient.sendTransaction(args),
    waitForTransactionReceipt: (args) => defaultClient.waitForTransactionReceipt(args),
    getCode: (args) => defaultClient.getCode(args),
  });

  // Create and configure facilitator
  const facilitator = new x402Facilitator();

  // Register EVM Exact scheme for Optimism networks
  registerExactEvmScheme(facilitator, {
    signer: facilitatorSigner,
    networks: ["eip155:10", "eip155:11155420"],
    deployERC4337WithEIP6492: false, // We don't support smart wallets yet
  });

  // Add whitelist check BEFORE verification
  // If verification would succeed but recipient is not whitelisted, we reject it
  facilitator.onAfterVerify(async ({ paymentPayload, result }) => {
    if (!result.isValid) {
      // Already failed, no need to check whitelist
      return;
    }

    const network = paymentPayload.accepted?.network;
    const recipient = paymentPayload.payload?.authorization?.to;

    if (!network || !recipient) {
      logger.warn("Missing network or recipient after verification");
      // Modify result to fail
      result.isValid = false;
      result.invalidReason = "invalid_payload";
      return;
    }

    // Check recipient whitelist (GenImNFTv4/LLMv1 NFT holders only)
    const whitelistCheck = await isAgentWhitelisted(recipient, network);
    if (!whitelistCheck.isWhitelisted) {
      logger.warn({ recipient, network }, "Payment verification failed: Recipient not whitelisted");
      // Modify result to fail
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
      networks: ["eip155:10", "eip155:11155420"],
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
