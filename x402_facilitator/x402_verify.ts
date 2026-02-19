/**
 * x402 v2 Payment Verification Module
 * Uses centralized x402Facilitator instance.
 * Supports both EIP-3009 and Permit2 payment flows.
 */

import { getFacilitator } from "./facilitator_instance";
import { isPermit2Payload } from "@x402/evm";
import type { ExactEvmPayloadV2 } from "@x402/evm";
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
    const payload = paymentPayload?.payload as ExactEvmPayloadV2 | undefined;
    const accepted = paymentPayload?.accepted as Record<string, unknown> | undefined;

    if (payload && logger.isLevelEnabled("debug")) {
      if (isPermit2Payload(payload)) {
        // Permit2 payload logging
        const p2auth = payload.permit2Authorization;
        logger.debug(
          {
            payloadType: "permit2",
            from: p2auth?.from,
            to: p2auth?.witness?.to,
            amount: p2auth?.permitted?.amount,
            deadline: p2auth?.deadline,
            nonce: p2auth?.nonce,
            validAfter: p2auth?.witness?.validAfter,
          },
          "Permit2 authorization data received",
        );
      } else {
        // EIP-3009 payload logging
        const auth = (payload as Record<string, unknown>)?.authorization as Record<string, unknown> | undefined;
        if (auth) {
          logger.debug(
            {
              payloadType: "eip3009",
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
            "EIP-3009 authorization data received",
          );
        }
      }
    }

    // Log EIP-712 domain parameters for debugging (only at debug level)
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

    const facilitator = getFacilitator();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await facilitator.verify(paymentPayload as any, paymentRequirements as any);

    if (result.isValid) {
      // Extract amount from either payload type for logging
      let amount: unknown;
      if (payload && isPermit2Payload(payload)) {
        amount = payload.permit2Authorization?.permitted?.amount;
      } else {
        const auth = (payload as Record<string, unknown> | undefined)?.authorization as Record<string, unknown> | undefined;
        amount = auth?.value;
      }
      logger.info(
        {
          payer: result.payer,
          amount,
          network: accepted?.network,
          payloadType: payload && isPermit2Payload(payload) ? "permit2" : "eip3009",
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
      recipient: (resultWithExtras.recipient as string | undefined) || result.recipient,
    };
  } catch (error) {
    const err = error as Error;
    logger.error({ err, message: err.message }, "Unexpected error during payment verification");
    return {
      isValid: false,
      invalidReason: "unexpected_verify_error",
    };
  }
}
