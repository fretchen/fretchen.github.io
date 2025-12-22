// @ts-check

/**
 * x402 v2 Facilitator Instance
 * Centralized facilitator configuration with Optimism support
 */

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimism, optimismSepolia } from "viem/chains";
import { x402Facilitator } from "@x402/core/facilitator";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { registerExactEvmScheme } from "@x402/evm/exact/facilitator";
import pino from "pino";
import { isAgentWhitelisted } from "./x402_whitelist.js";
import { getChainConfig, getSupportedNetworks } from "./chain_utils.js";

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
      if (network === "eip155:10") {
        return optimismPublic;
      }
      if (network === "eip155:11155420") {
        return sepoliaPublic;
      }
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

  // Create clients for all supported networks using chain_utils configuration
  const supportedNetworks = getSupportedNetworks();
  const clients = {};

  for (const network of supportedNetworks) {
    const config = getChainConfig(network);
    clients[config.chain.id] = {
      publicClient: createPublicClient({
        chain: config.chain,
        transport: http(config.rpcUrl),
      }),
      walletClient: createWalletClient({
        account,
        chain: config.chain,
        transport: http(config.rpcUrl),
      }),
    };
  }

  // Helper to select the correct client based on chainId
  // chainId can be extracted from domain parameter in verifyTypedData
  // or from the address/contract interaction context
  const getClientsForChain = (chainId) => {
    const client = clients[chainId];
    if (!client) {
      throw new Error(`Unsupported chainId: ${chainId}`);
    }
    return client;
  };

  // Use x402's toFacilitatorEvmSigner helper to create the signer
  // This ensures the signer interface matches what x402 expects
  // For operations without explicit chainId, we extract it from the domain parameter
  const facilitatorSigner = toFacilitatorEvmSigner({
    address: account.address,
    readContract: (args) => {
      // For now, default to Sepolia for contract reads
      // In production, this should be determined by the network parameter
      const { publicClient } = getClientsForChain(optimismSepolia.id);
      return publicClient.readContract({
        ...args,
        args: args.args || [],
      });
    },
    verifyTypedData: (args) => {
      // Extract chainId from domain parameter
      const chainId = Number(args.domain.chainId);
      const { publicClient } = getClientsForChain(chainId);
      return publicClient.verifyTypedData(args);
    },
    writeContract: (args) => {
      // Default to Sepolia for write operations
      const { walletClient } = getClientsForChain(optimismSepolia.id);
      return walletClient.writeContract({
        ...args,
        args: args.args || [],
      });
    },
    sendTransaction: (args) => {
      // Default to Sepolia for transactions
      const { walletClient } = getClientsForChain(optimismSepolia.id);
      return walletClient.sendTransaction(args);
    },
    waitForTransactionReceipt: (args) => {
      // Default to Sepolia for receipt waiting
      const { publicClient } = getClientsForChain(optimismSepolia.id);
      return publicClient.waitForTransactionReceipt(args);
    },
    getCode: (args) => {
      // Default to Sepolia for code retrieval
      const { publicClient } = getClientsForChain(optimismSepolia.id);
      return publicClient.getCode(args);
    },
  });

  // Create and configure facilitator
  const facilitator = new x402Facilitator();

  // Register EVM Exact scheme for Optimism networks
  registerExactEvmScheme(facilitator, {
    signer: facilitatorSigner,
    networks: getSupportedNetworks(),
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
