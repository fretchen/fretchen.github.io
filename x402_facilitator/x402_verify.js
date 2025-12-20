// @ts-check

/**
 * x402 v2 Payment Verification Module
 * Verifies EIP-3009 payment authorizations without executing on-chain transactions
 */

import { createPublicClient, http, getContract, verifyTypedData } from "viem";
import pino from "pino";
import { isAgentWhitelisted } from "./x402_whitelist.js";
import { getChain, getTokenInfo } from "./chain_utils.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// x402 v2 Error Codes
const X402_ERRORS = {
  INSUFFICIENT_FUNDS: "insufficient_funds",
  INVALID_SIGNATURE: "invalid_exact_evm_payload_signature",
  INVALID_AMOUNT: "invalid_exact_evm_payload_authorization_value",
  INVALID_TIME_AFTER: "invalid_exact_evm_payload_authorization_valid_after",
  INVALID_TIME_BEFORE: "invalid_exact_evm_payload_authorization_valid_before",
  INVALID_RECIPIENT: "invalid_exact_evm_payload_recipient_mismatch",
  INVALID_NETWORK: "invalid_network",
  INVALID_PAYLOAD: "invalid_payload",
  UNSUPPORTED_SCHEME: "unsupported_scheme",
  INVALID_VERSION: "invalid_x402_version",
  VERIFY_ERROR: "unexpected_verify_error",
  UNAUTHORIZED: "unauthorized_agent",
};

// USDC EIP-3009 ABI (only needed functions)
const USDC_ABI = [
  {
    name: "authorizationState",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "authorizer", type: "address" },
      { name: "nonce", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

// EIP-712 Domain and Types for USDC
const EIP712_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

/**
 * Get EIP-712 domain for token contract
 * @param {number} chainId - Chain ID
 * @param {string} tokenAddress - Token contract address
 * @param {string} tokenName - Token name
 * @param {string} tokenVersion - Token version
 * @returns {Object} EIP-712 domain
 */
function getEIP712Domain(chainId, tokenAddress, tokenName, tokenVersion) {
  return {
    name: tokenName,
    version: tokenVersion,
    chainId,
    verifyingContract: tokenAddress,
  };
}

/**
 * Verify EIP-712 signature
 * @param {Object} authorization - Authorization parameters
 * @param {string} signature - EIP-712 signature
 * @param {number} chainId - Chain ID
 * @param {string} tokenAddress - Token contract address
 * @param {string} tokenName - Token name
 * @param {string} tokenVersion - Token version
 * @returns {Promise<boolean>} True if signature is valid
 */
async function verifySignature(
  authorization,
  signature,
  chainId,
  tokenAddress,
  tokenName,
  tokenVersion,
) {
  try {
    const domain = getEIP712Domain(chainId, tokenAddress, tokenName, tokenVersion);

    logger.info(
      {
        domain,
        message: authorization,
        signature,
        expectedAddress: authorization.from,
      },
      "Verifying EIP-712 signature",
    );

    const isValid = await verifyTypedData({
      address: authorization.from,
      domain,
      types: EIP712_TYPES,
      primaryType: "TransferWithAuthorization",
      message: authorization,
      signature,
    });

    logger.info({ isValid, expectedAddress: authorization.from }, "Signature verification result");

    return isValid;
  } catch (error) {
    logger.error(
      {
        err: error,
        errorMessage: error.message,
        errorStack: error.stack,
      },
      "Signature verification failed",
    );
    return false;
  }
}

/**
 * Verify payment authorization
 * @param {Object} paymentPayload - Payment payload from client
 * @param {Object} paymentRequirements - Payment requirements from resource server
 * @returns {Promise<{isValid: boolean, invalidReason?: string, payer?: string}>}
 */
export async function verifyPayment(paymentPayload, paymentRequirements) {
  try {
    // 1. Validate x402 version (basic format check)
    if (paymentPayload.x402Version !== 2) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_VERSION,
      };
    }

    // 2. Validate scheme (basic format check)
    if (paymentPayload.accepted.scheme !== "exact") {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.UNSUPPORTED_SCHEME,
      };
    }

    // 3. Validate network (required for whitelist check)
    const network = paymentPayload.accepted.network;
    let chain;
    try {
      chain = getChain(network);
    } catch (_error) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_NETWORK,
      };
    }

    // 4. Extract authorization (required for whitelist check)
    const { authorization, signature } = paymentPayload.payload || {};
    if (!authorization || !signature) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_PAYLOAD,
      };
    }

    const payer = authorization.from;

    // 5. Check agent whitelist (after basic validation, before expensive operations)
    const whitelistCheck = await isAgentWhitelisted(payer, network);
    if (!whitelistCheck.isWhitelisted) {
      logger.warn({ payer, network }, "Payment verification failed: Agent not whitelisted");
      return {
        isValid: false,
        invalidReason: X402_ERRORS.UNAUTHORIZED,
        payer,
      };
    }

    logger.info({ payer, network, source: whitelistCheck.source }, "Agent whitelist check passed");

    // 6. Verify time window (check before expensive signature verification)
    const now = Math.floor(Date.now() / 1000);
    const validAfter = parseInt(authorization.validAfter);
    const validBefore = parseInt(authorization.validBefore);

    if (now < validAfter) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_TIME_AFTER,
        payer,
      };
    }

    if (now >= validBefore) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_TIME_BEFORE,
        payer,
      };
    }

    // 7. Verify amount
    const authValue = BigInt(authorization.value);
    const requiredAmount = BigInt(paymentRequirements.amount);

    if (authValue < requiredAmount) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_AMOUNT,
        payer,
      };
    }

    // 8. Verify recipient matches
    if (authorization.to.toLowerCase() !== paymentRequirements.payTo.toLowerCase()) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_RECIPIENT,
        payer,
      };
    }

    // 8. Get token info and verify it's supported
    let tokenInfo;
    try {
      tokenInfo = getTokenInfo(network, paymentRequirements.asset);
    } catch (_error) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_PAYLOAD,
        payer,
      };
    }

    // 9. Verify signature format and validate (expensive operation, do after simple checks)
    // Check if signature has 0x prefix
    if (!signature.startsWith("0x")) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_SIGNATURE,
        payer,
        message: "Signature must start with '0x' prefix",
      };
    }

    // Check signature length (should be 132 characters: 0x + 130 hex chars)
    if (signature.length !== 132) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_SIGNATURE,
        payer,
        message: `Invalid signature length: expected 132 characters (0x + 130 hex), got ${signature.length}`,
      };
    }

    // Convert authorization values to proper types for EIP-712
    const authorizationForSig = {
      from: authorization.from,
      to: authorization.to,
      value: BigInt(authorization.value),
      validAfter: BigInt(authorization.validAfter),
      validBefore: BigInt(authorization.validBefore),
      nonce: authorization.nonce,
    };

    logger.info(
      {
        authorizationForSig,
        signature,
        chainId: chain.id,
        tokenAddress: tokenInfo.address,
      },
      "About to verify signature with these parameters",
    );

    const isSignatureValid = await verifySignature(
      authorizationForSig,
      signature,
      chain.id,
      tokenInfo.address,
      tokenInfo.name,
      tokenInfo.version,
    );

    if (!isSignatureValid) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_SIGNATURE,
        payer,
      };
    }

    // 10. Create public client for blockchain calls
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const tokenContract = getContract({
      address: tokenInfo.address,
      abi: USDC_ABI,
      client: publicClient,
    });

    // 11. Check if nonce has already been used
    const nonceUsed = await tokenContract.read.authorizationState([payer, authorization.nonce]);

    if (nonceUsed) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_SIGNATURE, // Nonce already used
        payer,
      };
    }

    // 12. Check balance
    const balance = await tokenContract.read.balanceOf([payer]);

    if (balance < authValue) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INSUFFICIENT_FUNDS,
        payer,
      };
    }

    // All checks passed
    logger.info(
      {
        payer,
        amount: authorization.value,
        network,
        recipient: authorization.to,
      },
      "Payment verification successful",
    );

    return {
      isValid: true,
      payer,
    };
  } catch (error) {
    logger.error({ err: error }, "Unexpected error during payment verification");
    return {
      isValid: false,
      invalidReason: X402_ERRORS.VERIFY_ERROR,
    };
  }
}
