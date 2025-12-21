// @ts-check

/**
 * x402 v2 Facilitator - Settlement Logic
 * Uses x402 shared utilities for USDC operations
 */

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getUsdcChainConfigForChain } from "x402/shared/evm";
import { verifyPayment } from "./x402_verify.js";
import { getChain, getTokenInfo } from "./chain_utils.js";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// USDC Contract ABI (EIP-3009 transferWithAuthorization)
const USDC_ABI = [
  {
    name: "transferWithAuthorization",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
  },
];

/**
 * Split signature into v, r, s components
 * @param {string} signature - Signature in format "0x..."
 * @returns {{v: number, r: string, s: string}}
 */
function splitSignature(signature) {
  // Remove 0x prefix
  const sig = signature.startsWith("0x") ? signature.slice(2) : signature;

  if (sig.length !== 130) {
    throw new Error(`Invalid signature length: ${sig.length}`);
  }

  const r = "0x" + sig.slice(0, 64);
  const s = "0x" + sig.slice(64, 128);
  const v = parseInt(sig.slice(128, 130), 16);

  return { v, r, s };
}

/**
 * Settle a payment by executing transferWithAuthorization on-chain
 * @param {Object} paymentPayload - The payment payload from the request
 * @param {Object} paymentRequirements - The payment requirements
 * @returns {Promise<{success: boolean, payer?: string, transaction?: string, network?: string, errorReason?: string}>}
 */
export async function settlePayment(paymentPayload, paymentRequirements) {
  try {
    // First verify the payment
    logger.info("Verifying payment before settlement");
    const verifyResult = await verifyPayment(paymentPayload, paymentRequirements);

    if (!verifyResult.isValid) {
      logger.warn({ invalidReason: verifyResult.invalidReason }, "Payment verification failed");
      return {
        success: false,
        errorReason: verifyResult.invalidReason,
        payer: verifyResult.payer,
        transaction: "",
        network: paymentPayload.accepted.network,
      };
    }

    // Get network and token configuration
    const network = paymentPayload.accepted.network;
    const chain = getChain(network);
    
    // Get USDC config using x402 utility with fallback
    const usdcConfig = getUsdcChainConfigForChain(chain.id);
    let tokenAddress;
    
    if (usdcConfig) {
      tokenAddress = usdcConfig.address;
      logger.debug({ chainId: chain.id, tokenAddress }, "Using x402 USDC config");
    } else {
      // Fallback for Optimism
      const tokenInfo = getTokenInfo(network, paymentPayload.accepted.asset);
      tokenAddress = tokenInfo.address;
      logger.info({ chainId: chain.id, network, tokenAddress }, "Using fallback USDC config");
    }

    // Get RPC URL from chain config
    const rpcUrl = chain.rpcUrls.default.http[0];

    // Get facilitator private key
    let privateKey = process.env.FACILITATOR_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("FACILITATOR_WALLET_PRIVATE_KEY not configured");
    }

    // Normalize private key format (add 0x prefix if missing)
    privateKey = privateKey.trim();
    if (!privateKey.startsWith("0x")) {
      privateKey = "0x" + privateKey;
    }

    // Validate private key length
    if (privateKey.length !== 66) {
      throw new Error(
        `Invalid FACILITATOR_WALLET_PRIVATE_KEY: Expected 64 hex characters (with or without 0x prefix), got ${privateKey.length - 2} characters`,
      );
    }

    // Create clients
    const account = privateKeyToAccount(privateKey);
    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    // Extract authorization data
    const { authorization, signature } = paymentPayload.payload;

    // Split signature
    const { v, r, s } = splitSignature(signature);

    logger.info(
      {
        from: authorization.from,
        to: authorization.to,
        value: authorization.value,
        tokenAddress,
      },
      "Executing transferWithAuthorization",
    );

    // Execute the transaction
    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: USDC_ABI,
      functionName: "transferWithAuthorization",
      args: [
        authorization.from,
        authorization.to,
        BigInt(authorization.value),
        BigInt(authorization.validAfter),
        BigInt(authorization.validBefore),
        authorization.nonce,
        v,
        r,
        s,
      ],
    });

    logger.info({ hash, network }, "Transaction submitted successfully");

    // Wait for transaction confirmation (optional, could be async)
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    logger.info(
      { hash, status: receipt.status, blockNumber: receipt.blockNumber },
      "Transaction confirmed",
    );

    return {
      success: true,
      payer: verifyResult.payer,
      transaction: hash,
      network,
    };
  } catch (error) {
    logger.error({ err: error }, "Settlement failed");

    // Try to extract meaningful error reason
    let errorReason = "settlement_failed";
    if (error.message?.includes("insufficient")) {
      errorReason = "insufficient_funds";
    } else if (error.message?.includes("nonce")) {
      errorReason = "authorization_already_used";
    } else if (error.message?.includes("expired")) {
      errorReason = "authorization_expired";
    }

    return {
      success: false,
      errorReason,
      payer: paymentPayload.payload?.authorization?.from,
      transaction: "",
      network: paymentPayload.accepted?.network,
    };
  }
}
