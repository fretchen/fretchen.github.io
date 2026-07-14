/**
 * x402 v2 Payment Verification Module
 * Uses centralized x402Facilitator instance
 */

import { getFacilitator } from "./facilitator_instance";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

export interface VerifyResult {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
  recipient?: string;
  /** Whether fee collection is required at settle time */
  feeRequired?: boolean;
}

/**
 * Verify payment authorization using x402 Facilitator
 */
export async function verifyPayment(
  paymentPayload: Record<string, unknown>,
  paymentRequirements: Record<string, unknown>,
): Promise<VerifyResult> {
  try {
    // Log authorization data for debugging (only at debug level)
    const payload = paymentPayload?.payload as Record<string, unknown> | undefined;
    const auth = payload?.authorization as Record<string, unknown> | undefined;
    if (auth && logger.isLevelEnabled("debug")) {
      logger.debug(
        {
          authTypes: {
            value: typeof auth.value,
            validAfter: typeof auth.validAfter,
            validBefore: typeof auth.validBefore,
          },
          authValues: {
            value: auth.value,
            validAfter: auth.validAfter,
            validBefore: auth.validBefore,
          },
        },
        "Authorization data received",
      );
    }

    // Log EIP-712 domain parameters for debugging (only at debug level)
    const accepted = paymentPayload?.accepted as Record<string, unknown> | undefined;
    const extra = accepted?.extra as Record<string, unknown> | undefined;
    if (logger.isLevelEnabled("debug")) {
      logger.debug(
        {
          extraName: extra?.name,
          extraVersion: extra?.version,
          asset: accepted?.asset,
          network: accepted?.network,
          payTo: accepted?.payTo,
        },
        "EIP-712 Domain reconstruction parameters",
      );
    }

    // Pre-validate signature format before the RPC-heavy verify path.
    // The x402 library passes raw signatures to viem which throws on malformed input
    // rather than returning a structured failure — this would cause RPC timeouts first.
    const signature = payload?.signature as string | undefined;
    if (signature !== undefined && !signature.startsWith("0x")) {
      logger.warn({ signature: `${signature.slice(0, 8)}…` }, "Signature missing 0x prefix");
      return { isValid: false, invalidReason: "invalid_exact_evm_signature" };
    }

    const facilitator = getFacilitator();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const result = await facilitator.verify(paymentPayload as any, paymentRequirements as any);

    if (result.isValid) {
      logger.info(
        {
          payer: result.payer,
          amount: auth?.value,
          network: accepted?.network,
        },
        "Payment verification successful",
      );
    } else {
      logger.warn(
        { invalidReason: result.invalidReason, payer: result.payer },
        "Payment verification failed",
      );
    }

    // Pass through fee status from onAfterVerify hook
    const resultWithExtras = result as Record<string, unknown>;
    return {
      ...result,
      feeRequired: resultWithExtras.feeRequired as boolean | undefined,
      recipient: resultWithExtras.recipient as string | undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ message }, "Unexpected error during payment verification");
    return {
      isValid: false,
      invalidReason: "unexpected_verify_error",
    };
  }
}
