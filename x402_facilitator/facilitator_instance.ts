/**
 * x402 v2 Facilitator Instance
 * Centralized facilitator configuration with multi-chain support
 *
 * Architecture: One ExactEvmScheme per network (following x402 best practices)
 * Each network has its own dedicated viem client, eliminating chain selection issues.
 * Supports both EIP-3009 and Permit2 payment flows (v2.3.1+).
 */

import { createPublicClient, createWalletClient, http } from "viem";
import type { Account } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { x402Facilitator } from "@x402/core/facilitator";
import { toFacilitatorEvmSigner, isPermit2Payload } from "@x402/evm";
import { registerExactEvmScheme } from "@x402/evm/exact/facilitator";
import type { ExactEvmPayloadV2 } from "@x402/evm";
import pino from "pino";
import { checkMerchantAllowance, getFeeAmount, getFacilitatorAddress } from "./x402_fee";
import { getChainConfig, getSupportedNetworks } from "./chain_utils";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Create a FacilitatorEvmSigner for a specific network.
 * The signer is bound to a single chain — no dynamic chain selection needed.
 */
function createSignerForNetwork(account: Account, network: string) {
  const config = getChainConfig(network);

  const publicClient = createPublicClient({
    chain: config.chain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: config.chain,
    transport: http(),
  });

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
 */
export function createReadOnlyFacilitator(): InstanceType<typeof x402Facilitator> {
  const facilitator = new x402Facilitator();

  for (const network of getSupportedNetworks()) {
    const config = getChainConfig(network);

    const publicClient = createPublicClient({
      chain: config.chain,
      transport: http(),
    });

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

    registerExactEvmScheme(facilitator, { signer: readOnlySigner, networks: network });
  }

  logger.info({
    networks: getSupportedNetworks(),
    msg: "x402 Facilitator initialized (read-only mode)",
  });

  return facilitator;
}

/**
 * Create the facilitator instance with multi-chain support.
 * Uses separate ExactEvmScheme per network (x402 best practice).
 */
export function createFacilitator(requirePrivateKey = true): InstanceType<typeof x402Facilitator> {
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
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  // Create and configure facilitator
  const facilitator = new x402Facilitator();

  // Register a separate ExactEvmScheme per network (each with its own RPC client).
  // registerExactEvmScheme also registers V1 schemes for backward compatibility.
  const supportedNetworks = getSupportedNetworks();
  for (const network of supportedNetworks) {
    const signer = createSignerForNetwork(account, network);
    registerExactEvmScheme(facilitator, { signer, networks: network });
  }

  // Add fee allowance check AFTER verification
  facilitator.onAfterVerify(async ({ paymentPayload, result }) => {
    if (!result.isValid) {
      return;
    }

    const network = paymentPayload.accepted?.network;

    // Extract recipient from either EIP-3009 or Permit2 payload
    const payload = paymentPayload.payload as ExactEvmPayloadV2 | undefined;
    let recipient: string | undefined;
    if (payload && isPermit2Payload(payload)) {
      recipient = payload.permit2Authorization?.witness?.to;
    } else {
      recipient = (payload as Record<string, unknown> | undefined)?.authorization
        ? ((payload as { authorization?: { to?: string } }).authorization?.to)
        : undefined;
    }

    if (!network || !recipient) {
      logger.warn("Missing network or recipient after verification");
      result.isValid = false;
      result.invalidReason = "invalid_payload";
      return;
    }

    // Check if fees are enabled
    const feeAmount = getFeeAmount();
    if (feeAmount === 0n) {
      // Fees disabled — allow all recipients without fee
      (result as Record<string, unknown>).feeRequired = false;
      return;
    }

    const facilitatorAddress = getFacilitatorAddress();
    if (!facilitatorAddress) {
      logger.warn(
        { recipient, network },
        "Cannot check fee allowance: facilitator address not configured",
      );
      result.isValid = false;
      result.invalidReason = "facilitator_not_configured";
      return;
    }

    // Check merchant's USDC allowance for fee payment
    const allowanceInfo = await checkMerchantAllowance(recipient as `0x${string}`, network);

    if (!allowanceInfo.sufficient) {
      logger.warn(
        {
          recipient,
          network,
          allowance: allowanceInfo.allowance.toString(),
          feeAmount: feeAmount.toString(),
          facilitatorAddress,
        },
        "Insufficient fee allowance — merchant must approve USDC for facilitator",
      );
      result.isValid = false;
      result.invalidReason = "insufficient_fee_allowance";
      (result as Record<string, unknown>).recipient = recipient;
      (result as Record<string, unknown>).requiredAllowance = feeAmount.toString();
      (result as Record<string, unknown>).currentAllowance = allowanceInfo.allowance.toString();
      (result as Record<string, unknown>).facilitatorAddress = facilitatorAddress;
      return;
    }

    // Fee allowance sufficient — mark for fee collection at settle time
    logger.info(
      {
        recipient,
        network,
        remainingSettlements: allowanceInfo.remainingSettlements,
      },
      "Recipient approved via fee allowance",
    );
    (result as Record<string, unknown>).feeRequired = true;
    (result as Record<string, unknown>).recipient = recipient;
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
let facilitatorInstance: InstanceType<typeof x402Facilitator> | null = null;

/**
 * Get or create the facilitator instance
 */
export function getFacilitator(requirePrivateKey = true): InstanceType<typeof x402Facilitator> {
  if (!facilitatorInstance) {
    facilitatorInstance = createFacilitator(requirePrivateKey);
  }
  return facilitatorInstance;
}

/**
 * Reset the facilitator instance (for testing)
 */
export function resetFacilitator(): void {
  facilitatorInstance = null;
}
