// @ts-check

/**
 * x402 Splitter Facilitator - Verification (NO WHITELIST)
 * Validates EIP-3009 payments without seller whitelist check
 *
 * Key differences from whitelist version:
 * - ❌ NO isAgentWhitelisted() check
 * - ✅ Validates EIP-3009 signature correctness
 * - ✅ Validates amount >= fixedFee (10000)
 * - ✅ Validates token is USDC
 * - ✅ Validates network supported
 */

import { verifyTypedData, createPublicClient, http } from "viem";
import pino from "pino";
import { getChain, getTokenInfo } from "./chain_utils.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const FIXED_FEE = BigInt(process.env.FIXED_FEE || "10000"); // 0.01 USDC

/**
 * Verify EIP-3009 payment without whitelist check
 * @param {Object} paymentPayload - Payment payload from client
 * @param {Object} paymentRequirements - Payment requirements from resource server
 * @returns {Promise<{isValid: boolean, invalidReason?: string, payer?: string}>}
 */
export async function verifySplitterPayment(paymentPayload, paymentRequirements) {
  try {
    // Validate payment payload matches requirements
    const accepted = paymentPayload.accepted;
    if (!accepted) {
      logger.warn("Missing accepted field in payment payload");
      return { isValid: false, invalidReason: "missing_accepted" };
    }

    // Check amount matches
    if (accepted.amount !== paymentRequirements.amount) {
      logger.warn(
        { expected: paymentRequirements.amount, received: accepted.amount },
        "Amount mismatch",
      );
      return { isValid: false, invalidReason: "amount_mismatch" };
    }

    // Check recipient (payTo) matches
    if (accepted.payTo?.toLowerCase() !== paymentRequirements.payTo?.toLowerCase()) {
      logger.warn(
        { expected: paymentRequirements.payTo, received: accepted.payTo },
        "Recipient mismatch",
      );
      return { isValid: false, invalidReason: "recipient_mismatch" };
    }

    // Check network matches
    if (accepted.network !== paymentRequirements.network) {
      logger.warn(
        { expected: paymentRequirements.network, received: accepted.network },
        "Network mismatch",
      );
      return { isValid: false, invalidReason: "network_mismatch" };
    }

    // Check asset matches
    if (accepted.asset?.toLowerCase() !== paymentRequirements.asset?.toLowerCase()) {
      logger.warn(
        { expected: paymentRequirements.asset, received: accepted.asset },
        "Asset mismatch",
      );
      return { isValid: false, invalidReason: "asset_mismatch" };
    }

    // Check scheme matches
    if (accepted.scheme !== paymentRequirements.scheme) {
      logger.warn(
        { expected: paymentRequirements.scheme, received: accepted.scheme },
        "Scheme mismatch",
      );
      return { isValid: false, invalidReason: "scheme_mismatch" };
    }

    // Extract authorization
    const auth = paymentPayload.payload?.authorization;
    if (!auth) {
      logger.warn("Missing authorization in payment payload");
      return { isValid: false, invalidReason: "missing_authorization" };
    }

    const { from, to, value, validAfter, validBefore, nonce } = auth;

    // Extract signature (can be in different formats)
    // x402 v2: signature is a separate field at payload.payload.signature
    const signature = paymentPayload.payload?.signature;
    if (!signature) {
      logger.warn("Missing signature in payment payload");
      return { isValid: false, invalidReason: "invalid_signature" };
    }

    // Validate required fields
    if (!from || !to || !value || !validAfter || !validBefore || !nonce) {
      logger.warn("Missing required authorization fields");
      return { isValid: false, invalidReason: "invalid_authorization" };
    }

    // Validate network
    const network = paymentPayload.accepted?.network;
    if (!["eip155:10", "eip155:11155420"].includes(network)) {
      logger.warn({ network }, "Unsupported network");
      return { isValid: false, invalidReason: "unsupported_network" };
    }

    // Get chain config
    const chain = getChain(network);

    // Validate token is USDC
    const tokenAddress = paymentPayload.accepted?.asset;
    if (!tokenAddress) {
      logger.warn("Missing asset address");
      return { isValid: false, invalidReason: "invalid_payload" };
    }

    let tokenInfo;
    try {
      tokenInfo = getTokenInfo(network, tokenAddress);
    } catch (_error) {
      logger.warn({ tokenAddress, network }, "Unsupported token");
      return { isValid: false, invalidReason: "invalid_token_address" };
    }

    // Validate recipient address matches splitter contract
    // For splitter facilitator: to = splitter address (not token address!)
    // The splitter contract will receive the funds and split them
    const { getSplitterAddress } = await import("./eip3009_splitter_abi.js");

    let splitterAddress;
    try {
      splitterAddress = getSplitterAddress(network);
    } catch (_error) {
      logger.warn({ network }, "Splitter not deployed on network");
      return { isValid: false, invalidReason: "unsupported_network" };
    }

    if (to.toLowerCase() !== splitterAddress.toLowerCase()) {
      logger.warn({ to, expectedSplitter: splitterAddress }, "Recipient must be splitter contract");
      return { isValid: false, invalidReason: "invalid_exact_evm_payload_recipient_mismatch" };
    }

    // Validate amount >= fixedFee
    const totalAmount = BigInt(value);
    if (totalAmount < FIXED_FEE) {
      logger.warn(
        { totalAmount: totalAmount.toString(), fixedFee: FIXED_FEE.toString() },
        "Payment amount too low",
      );
      return { isValid: false, invalidReason: "invalid_exact_evm_payload_authorization_value" };
    }

    // Verify EIP-712 signature
    const domain = {
      name: tokenInfo.name,
      version: tokenInfo.version,
      chainId: chain.id,
      verifyingContract: tokenAddress,
    };

    const types = {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const message = {
      from,
      to,
      value: BigInt(value),
      validAfter: BigInt(validAfter),
      validBefore: BigInt(validBefore),
      nonce,
    };

    // Log domain and message for debugging (debug level only)
    if (logger.isLevelEnabled("debug")) {
      logger.debug(
        {
          domain,
          message: {
            ...message,
            value: message.value.toString(),
            validAfter: message.validAfter.toString(),
            validBefore: message.validBefore.toString(),
          },
        },
        "EIP-712 signature verification",
      );
    }

    const isValidSignature = await verifyTypedData({
      address: from,
      domain,
      types,
      primaryType: "TransferWithAuthorization",
      message,
      signature, // Use signature directly (already in correct format)
    });

    if (!isValidSignature) {
      logger.warn({ from }, "Invalid EIP-712 signature");
      return { isValid: false, invalidReason: "invalid_exact_evm_payload_signature", payer: from };
    }

    // Check time window
    const now = Math.floor(Date.now() / 1000);
    const validAfterNum = Number(validAfter);
    const validBeforeNum = Number(validBefore);

    if (now < validAfterNum) {
      logger.warn({ now, validAfter: validAfterNum }, "Authorization not yet valid");
      return {
        isValid: false,
        invalidReason: "invalid_exact_evm_payload_authorization_valid_after",
        payer: from,
      };
    }

    if (now > validBeforeNum) {
      logger.warn({ now, validBefore: validBeforeNum }, "Authorization expired");
      return {
        isValid: false,
        invalidReason: "invalid_exact_evm_payload_authorization_valid_before",
        payer: from,
      };
    }

    // Check if authorization already used (requires splitter contract call)
    // For verify, we'll check this on-chain during settlement
    // The contract will revert if nonce is reused
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Check buyer has sufficient balance
    try {
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: [
          {
            name: "balanceOf",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
          },
        ],
        functionName: "balanceOf",
        args: [from],
      });

      if (balance < totalAmount) {
        logger.warn(
          { balance: balance.toString(), required: totalAmount.toString() },
          "Insufficient balance",
        );
        return { isValid: false, invalidReason: "insufficient_funds", payer: from };
      }
    } catch (error) {
      logger.error({ err: error }, "Failed to check balance");
      // Continue - balance check will happen on-chain
    }

    logger.info(
      { from, value: totalAmount.toString(), network },
      "Payment verified (no whitelist)",
    );

    return {
      isValid: true,
      payer: from,
    };
  } catch (error) {
    logger.error({ err: error, message: error.message }, "Verification error");
    return {
      isValid: false,
      invalidReason: "unexpected_verify_error",
    };
  }
}
