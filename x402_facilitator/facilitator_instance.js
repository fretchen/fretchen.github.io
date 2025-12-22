// @ts-check

/**
 * x402 v2 Facilitator Instance
 * Centralized facilitator configuration with Optimism support
 */

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { optimism, optimismSepolia } from "viem/chains";
import { x402Facilitator } from "@x402/core/facilitator";
import { registerExactEvmScheme } from "@x402/evm/exact/facilitator";
import pino from "pino";
import { isAgentWhitelisted } from "./x402_whitelist.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Create the facilitator instance with Optimism support
 * @returns {x402Facilitator} Configured facilitator instance
 */
export function createFacilitator() {
  // Get facilitator private key
  let privateKey = process.env.FACILITATOR_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("FACILITATOR_WALLET_PRIVATE_KEY not configured");
  }

  // Normalize private key format
  privateKey = privateKey.trim();
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }

  // Validate private key length
  if (privateKey.length !== 66) {
    throw new Error(
      `Invalid FACILITATOR_WALLET_PRIVATE_KEY: Expected 64 hex characters, got ${privateKey.length - 2}`,
    );
  }

  // Create account from private key
  const account = privateKeyToAccount(privateKey);

  // Create combined client (public + wallet) for Optimism Mainnet
  const optimismClient = {
    public: createPublicClient({
      chain: optimism,
      transport: http(),
    }),
    wallet: createWalletClient({
      account,
      chain: optimism,
      transport: http(),
    }),
  };

  // Create combined client for Optimism Sepolia
  const sepoliaClient = {
    public: createPublicClient({
      chain: optimismSepolia,
      transport: http(),
    }),
    wallet: createWalletClient({
      account,
      chain: optimismSepolia,
      transport: http(),
    }),
  };

  // Create facilitator signer that selects the right client based on network
  const facilitatorSigner = {
    publicClient: (network) => {
      if (network === "eip155:10") {
        return optimismClient.public;
      }
      if (network === "eip155:11155420") {
        return sepoliaClient.public;
      }
      throw new Error(`Unsupported network: ${network}`);
    },
    walletClient: (network) => {
      if (network === "eip155:10") {
        return optimismClient.wallet;
      }
      if (network === "eip155:11155420") {
        return sepoliaClient.wallet;
      }
      throw new Error(`Unsupported network: ${network}`);
    },
    getAddresses: () => {
      // Return all facilitator wallet addresses
      return [account.address];
    },
  };

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
 * @returns {x402Facilitator} The facilitator instance
 */
export function getFacilitator() {
  if (!facilitatorInstance) {
    facilitatorInstance = createFacilitator();
  }
  return facilitatorInstance;
}

/**
 * Reset the facilitator instance (for testing)
 */
export function resetFacilitator() {
  facilitatorInstance = null;
}
