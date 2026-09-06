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

import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  WaitForTransactionReceiptTimeoutError,
  type Address,
  type Abi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import pino from "pino";
import { loadPrivateKey } from "@fretchen/chain-utils";
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
  /**
   * Undefined when the allowance could not be read.
   *
   * Never conflate "unreadable" with `0n`: a caller that caps a transfer at the
   * allowance would silently stop collecting entirely during a transient RPC failure.
   */
  allowance?: bigint;
  /**
   * Undefined when the allowance could not be read ("unknown" status). Never
   * report 0 here for an unreadable allowance — it reads as "approval exhausted"
   * and pushes sellers to re-approve unnecessarily.
   */
  remainingSettlements?: number;
  /**
   * "ok"           — allowance covers at least one fee
   * "insufficient" — read succeeded, allowance is genuinely too low (fail closed)
   * "unknown"      — could not be read; callers proceed rather than block a payment
   */
  status: "ok" | "insufficient" | "unknown";
}

/**
 * Whether this settlement owes a fee, and whether the recipient can pay it.
 *
 * - `no_fee`  — fees are disabled. Settle normally and attach NO fee receipt: the
 *               `fee` / `extensions.facilitatorFees` fields are documented (see
 *               `x402_schemas.ts`) as present only when a fee is configured.
 * - `charge`  — a fee is owed; settle, then collect it.
 * - `reject`  — do not settle at all.
 */
export type FeeGateDecision =
  | { kind: "no_fee" }
  | { kind: "charge"; remainingSettlements?: number }
  | {
      /**
       * Only the reason travels. The allowance detail behind it is logged here for
       * operators, and `/supported` → `facilitatorFees` already publishes the address to
       * approve and the amount required — callers need nothing more from this type.
       */
      kind: "reject";
      reason: "insufficient_fee_allowance" | "facilitator_not_configured";
    };

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
 * Cap on how long fee collection may wait for its receipt.
 *
 * The settle handler has a 60s budget (serverless.yml) and has already spent part of it
 * confirming the settlement transaction before fee collection starts. Fee collection
 * must never be able to consume the rest: if the handler dies here, the buyer gets no
 * receipt for a payment that already landed on-chain. A settled payment's receipt is
 * worth far more than a 0.01 USDC fee.
 */
const FEE_RECEIPT_TIMEOUT_MS = 10_000;

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
      logger.warn(
        { envFee },
        "Invalid FACILITATOR_FEE_AMOUNT (not a valid integer), using default",
      );
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
  try {
    return privateKeyToAccount(loadPrivateKey("FACILITATOR_WALLET_PRIVATE_KEY")).address;
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
    return { allowance: 0n, remainingSettlements: 0, status: "insufficient" };
  }

  const feeAmount = getFeeAmount();
  if (feeAmount === 0n) {
    // No fee configured — nothing to collect, nothing to approve
    return { remainingSettlements: Infinity, status: "ok" };
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
    const status = allowance >= feeAmount ? "ok" : "insufficient";

    logger.debug(
      {
        merchant: merchantAddress,
        facilitator: facilitatorAddress,
        allowance: allowance.toString(),
        feeAmount: feeAmount.toString(),
        remainingSettlements,
        status,
        network,
      },
      "Merchant allowance check",
    );

    return { allowance, remainingSettlements, status };
  } catch (error) {
    // Fail open on RPC/read errors — don't block otherwise-valid payments over a
    // reading we could not take. `warn`, not `error`: proceeding is the policy here,
    // not a malfunction.
    //
    // `allowance` is deliberately left undefined rather than 0n. Reporting 0n would be
    // a lie that reads as "no allowance", and any caller capping a transfer at it would
    // silently stop collecting during a transient RPC blip.
    logger.warn(
      { err: error, merchant: merchantAddress, network },
      "Could not read merchant allowance — proceeding without it",
    );
    return { status: "unknown" };
  }
}

/**
 * The single fee gate both schemes run before settling.
 *
 * `exact` calls this from the `onAfterVerify` hook (`facilitator_instance.ts`);
 * `batch-settlement` calls it for `claim`/`settle` payloads (`x402_settle.ts`), which
 * skip verify() entirely and so never reach that hook. Sharing it is the point: these
 * were previously two hand-written implementations, and the batch-settlement copy had
 * silently omitted the fee-disabled and facilitator-not-configured checks.
 *
 * Fails closed only on an allowance that genuinely read too low. An *unreadable*
 * allowance proceeds — the payment is worth more than the fee.
 */
export async function evaluateFeeGate(
  recipient: Address,
  network: string,
): Promise<FeeGateDecision> {
  const feeAmount = getFeeAmount();
  if (feeAmount === 0n) {
    return { kind: "no_fee" };
  }

  const facilitatorAddress = getFacilitatorAddress();
  if (!facilitatorAddress) {
    logger.warn(
      { recipient, network },
      "Cannot check fee allowance: facilitator address not configured",
    );
    return { kind: "reject", reason: "facilitator_not_configured" };
  }

  const allowanceInfo = await checkMerchantAllowance(recipient, network);

  if (allowanceInfo.status === "insufficient") {
    logger.warn(
      {
        recipient,
        network,
        allowance: allowanceInfo.allowance?.toString(),
        feeAmount: feeAmount.toString(),
        facilitatorAddress,
      },
      "Insufficient fee allowance — merchant must approve USDC for facilitator",
    );
    return { kind: "reject", reason: "insufficient_fee_allowance" };
  }

  if (allowanceInfo.status === "unknown") {
    // Proceed by policy, not by accident: the payment is worth more than the fee.
    logger.warn(
      { recipient, network },
      "Fee allowance unreadable — proceeding, fee collection attempted anyway",
    );
  } else {
    logger.info(
      { recipient, network, remainingSettlements: allowanceInfo.remainingSettlements },
      "Recipient approved via fee allowance",
    );
  }

  return { kind: "charge", remainingSettlements: allowanceInfo.remainingSettlements };
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

  let account;
  try {
    account = privateKeyToAccount(loadPrivateKey("FACILITATOR_WALLET_PRIVATE_KEY"));
  } catch {
    logger.error("Cannot collect fee: FACILITATOR_WALLET_PRIVATE_KEY not configured or invalid");
    return { success: false, error: "facilitator_not_configured" };
  }

  try {
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

    // Wait for confirmation — bounded, so a slow fee tx can never eat the settle
    // handler's remaining timeout budget and cost the buyer their receipt.
    let receipt;
    try {
      receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: FEE_RECEIPT_TIMEOUT_MS,
      });
    } catch (error) {
      if (error instanceof WaitForTransactionReceiptTimeoutError) {
        // The tx is still in flight and may well succeed. Reporting it as failed would
        // be wrong, and retrying against a fee that actually landed would double-charge
        // the merchant. Return the hash so it can be reconciled later.
        logger.warn(
          {
            txHash,
            merchant: merchantAddress,
            network,
            timeoutMs: FEE_RECEIPT_TIMEOUT_MS,
          },
          "Fee tx not confirmed within budget — returning settlement receipt, fee outcome unknown",
        );
        return { success: false, txHash, error: "fee_collection_pending" };
      }
      throw error; // any other wait failure keeps existing outer-catch handling
    }

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
