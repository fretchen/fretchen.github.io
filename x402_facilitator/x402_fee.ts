/**
 * x402 Facilitator Fee Module
 *
 * Handles post-settlement fee collection via ERC-20 transferFrom.
 * The merchant must have previously approved the facilitator's wallet
 * to spend USDC on their behalf (standard ERC-20 approve flow).
 *
 * Fee flow:
 * 1. Settlement executes: transferWithAuthorization(client → merchant)
 * 2. Fee collected after: transferFrom(merchant → facilitator, feeAmount)
 */

import { createPublicClient, createWalletClient, http, getContract } from "viem";
import type { Address, Abi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import pino from "pino";
import { getChainConfig } from "./chain_utils";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface FeeResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface AllowanceInfo {
  allowance: bigint;
  remainingSettlements: number;
  sufficient: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ERC-20 ABI (minimal subset for fee operations)
// ═══════════════════════════════════════════════════════════════

const ERC20_FEE_ABI = [
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const satisfies Abi;

// ═══════════════════════════════════════════════════════════════
// Fee Configuration
// ═══════════════════════════════════════════════════════════════

/** Default fee: 0.01 USDC = 10000 (6 decimals) */
const DEFAULT_FEE_AMOUNT = 10000n;

/**
 * Get the fee amount from environment or default.
 * @returns Fee amount in USDC smallest unit (6 decimals)
 */
export function getFeeAmount(): bigint {
  const envFee = process.env.FACILITATOR_FEE_AMOUNT;
  if (envFee) {
    try {
      const parsed = BigInt(envFee);
      if (parsed < 0n) {
        logger.warn({ envFee }, "Invalid FACILITATOR_FEE_AMOUNT (negative), using default");
        return DEFAULT_FEE_AMOUNT;
      }
      return parsed;
    } catch {
      logger.warn({ envFee }, "Invalid FACILITATOR_FEE_AMOUNT (not a valid integer), using default");
      return DEFAULT_FEE_AMOUNT;
    }
  }
  return DEFAULT_FEE_AMOUNT;
}

/**
 * Get the facilitator wallet address (fee recipient).
 * Derived from the same private key used for settlements.
 */
export function getFacilitatorAddress(): Address | null {
  let privateKey = process.env.FACILITATOR_WALLET_PRIVATE_KEY;
  if (!privateKey) return null;

  privateKey = privateKey.trim();
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }
  if (privateKey.length !== 66) return null;

  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    return account.address;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// Allowance Check
// ═══════════════════════════════════════════════════════════════

/**
 * Check how much USDC the merchant has approved for the facilitator.
 * Used at verify time to give early feedback if fee cannot be collected.
 */
export async function checkMerchantAllowance(
  merchantAddress: Address,
  network: string,
): Promise<AllowanceInfo> {
  const facilitatorAddress = getFacilitatorAddress();
  if (!facilitatorAddress) {
    logger.warn("Cannot check allowance: facilitator address not configured");
    return { allowance: 0n, remainingSettlements: 0, sufficient: false };
  }

  const feeAmount = getFeeAmount();
  if (feeAmount === 0n) {
    // No fee configured — always sufficient
    return { allowance: 0n, remainingSettlements: Infinity, sufficient: true };
  }

  try {
    const config = getChainConfig(network);
    const publicClient = createPublicClient({
      chain: config.chain,
      transport: http(),
    });

    const usdc = getContract({
      address: config.USDC_ADDRESS as Address,
      abi: ERC20_FEE_ABI,
      client: publicClient,
    });

    const allowance = await usdc.read.allowance([merchantAddress, facilitatorAddress]);

    const remainingSettlements = feeAmount > 0n ? Number(allowance / feeAmount) : Infinity;
    const sufficient = allowance >= feeAmount;

    logger.debug(
      {
        merchant: merchantAddress,
        facilitator: facilitatorAddress,
        allowance: allowance.toString(),
        feeAmount: feeAmount.toString(),
        remainingSettlements,
        sufficient,
        network,
      },
      "Merchant allowance check",
    );

    return { allowance, remainingSettlements, sufficient };
  } catch (error) {
    logger.error(
      { err: error, merchant: merchantAddress, network },
      "Error checking merchant allowance",
    );
    // Fail open on RPC/read errors — don't block otherwise-valid payments.
    // If there's truly no allowance, fee collection will fail gracefully
    // at settle time (settlement still succeeds, fee flagged for retry).
    return { allowance: 0n, remainingSettlements: 0, sufficient: true };
  }
}

// ═══════════════════════════════════════════════════════════════
// Fee Collection
// ═══════════════════════════════════════════════════════════════

/**
 * Collect fee from merchant via ERC-20 transferFrom.
 * Called AFTER successful settlement only.
 *
 * @param merchantAddress - The merchant who received payment (fee source)
 * @param network - The CAIP-2 network identifier
 * @returns FeeResult with success status and optional tx hash
 */
export async function collectFee(merchantAddress: Address, network: string): Promise<FeeResult> {
  const feeAmount = getFeeAmount();

  // No fee configured — skip silently
  if (feeAmount === 0n) {
    logger.debug("Fee amount is 0, skipping fee collection");
    return { success: true };
  }

  let privateKey = process.env.FACILITATOR_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    logger.error("Cannot collect fee: FACILITATOR_WALLET_PRIVATE_KEY not configured");
    return { success: false, error: "facilitator_not_configured" };
  }

  privateKey = privateKey.trim();
  if (!privateKey.startsWith("0x")) {
    privateKey = "0x" + privateKey;
  }

  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
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

    const usdc = getContract({
      address: config.USDC_ADDRESS as Address,
      abi: ERC20_FEE_ABI,
      client: { public: publicClient, wallet: walletClient },
    });

    logger.info(
      {
        merchant: merchantAddress,
        facilitator: account.address,
        feeAmount: feeAmount.toString(),
        network,
        usdcAddress: config.USDC_ADDRESS,
      },
      "Collecting fee via transferFrom",
    );

    const txHash = await usdc.write.transferFrom([merchantAddress, account.address, feeAmount]);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === "success") {
      logger.info(
        {
          txHash,
          merchant: merchantAddress,
          feeAmount: feeAmount.toString(),
          network,
        },
        "Fee collected successfully",
      );
      return { success: true, txHash };
    } else {
      logger.error(
        { txHash, receipt, merchant: merchantAddress, network },
        "Fee transaction reverted",
      );
      return { success: false, txHash, error: "fee_transaction_reverted" };
    }
  } catch (error) {
    const err = error as Error;
    logger.error({ err, merchant: merchantAddress, network }, "Fee collection failed");

    let errorReason = "fee_collection_failed";
    if (
      err.message?.includes("insufficient allowance") ||
      err.message?.includes("ERC20InsufficientAllowance")
    ) {
      errorReason = "insufficient_fee_allowance";
    } else if (
      err.message?.includes("insufficient balance") ||
      err.message?.includes("ERC20InsufficientBalance")
    ) {
      errorReason = "insufficient_merchant_balance";
    }

    return { success: false, error: errorReason };
  }
}
