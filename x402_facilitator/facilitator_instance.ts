/**
 * x402 v2 Facilitator Instance
 * Centralized facilitator configuration with multi-chain support
 *
 * Architecture: One ExactEvmScheme per network (following x402 best practices),
 * plus one BatchSettlementEvmScheme per network THAT HAS THE CONTRACT DEPLOYED
 * (see getBatchSettlementNetworks() in chain_utils.ts — a strict subset of
 * getSupportedNetworks()). Each network has its own dedicated viem client,
 * eliminating chain selection issues. The facilitator routes by scheme, so both
 * schemes coexist on the same /verify and /settle endpoints.
 */

import { createPublicClient, createWalletClient, http, type Account } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { x402Facilitator } from "@x402/core/facilitator";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
import { BatchSettlementEvmScheme } from "@x402/evm/batch-settlement/facilitator";
import pino from "pino";
import { loadPrivateKey } from "@fretchen/chain-utils";
import { checkMerchantAllowance, getFeeAmount, getFacilitatorAddress } from "./x402_fee";
import { getChainConfig, getSupportedNetworks, getBatchSettlementNetworks } from "./chain_utils";

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

    facilitator.register(network, new ExactEvmScheme(readOnlySigner));
    // Only advertise batch-settlement where the contract is actually deployed —
    // see getBatchSettlementNetworks(). No authorizerSigner → no receiverAuthorizer
    // advertised; servers self-manage it.
    if (getBatchSettlementNetworks().includes(network)) {
      facilitator.register(network, new BatchSettlementEvmScheme(readOnlySigner));
    }
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
  let account;
  try {
    account = privateKeyToAccount(loadPrivateKey("FACILITATOR_WALLET_PRIVATE_KEY"));
  } catch (err) {
    if (!requirePrivateKey) {
      return createReadOnlyFacilitator();
    }
    throw err;
  }

  // Create and configure facilitator
  const facilitator = new x402Facilitator();

  // Register a separate ExactEvmScheme + BatchSettlementEvmScheme for each network
  const supportedNetworks = getSupportedNetworks();
  for (const network of supportedNetworks) {
    const signer = createSignerForNetwork(account, network);
    facilitator.register(network, new ExactEvmScheme(signer));
    // Only advertise batch-settlement where the contract is actually deployed —
    // see getBatchSettlementNetworks(). No authorizerSigner → no receiverAuthorizer
    // advertised; servers self-manage it (self-managed receiver, per the
    // batch-settlement migration plan).
    if (getBatchSettlementNetworks().includes(network)) {
      facilitator.register(network, new BatchSettlementEvmScheme(signer));
    }
  }

  // Add fee allowance check AFTER verification
  facilitator.onAfterVerify(async ({ paymentPayload, result }) => {
    if (!result.isValid) {
      return;
    }

    // Batch-settlement channels are fee-free. The facilitator fee model
    // (post-settlement USDC transferFrom) is specific to the exact scheme, and
    // batch-settlement payloads have no `authorization.to`, so run no fee gating
    // for them — otherwise the recipient check below would reject every request.
    if (paymentPayload.accepted?.scheme === "batch-settlement") {
      (result as Record<string, unknown>).feeRequired = false;
      return;
    }

    const network = paymentPayload.accepted?.network;
    const recipient = paymentPayload.payload?.authorization?.to as string | undefined;

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
