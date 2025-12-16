// @ts-check

/**
 * x402 v2 Payment Verification Module
 * Verifies EIP-3009 payment authorizations without executing on-chain transactions
 */

import { createPublicClient, http, getContract, verifyTypedData, parseUnits } from "viem";
import { optimism, optimismSepolia } from "viem/chains";
import pino from "pino";

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
 * Get chain configuration from network identifier
 * @param {string} network - CAIP-2 network identifier (e.g., "eip155:10")
 * @returns {Object} Viem chain object
 */
function getChain(network) {
  if (network === "eip155:10") return optimism;
  if (network === "eip155:11155420") return optimismSepolia;
  throw new Error(`Unsupported network: ${network}`);
}

/**
 * Get token contract address for network
 * @param {string} network - CAIP-2 network identifier
 * @param {string} asset - Token contract address
 * @returns {{address: string, name: string, version: string}} Token info
 */
function getTokenInfo(network, asset) {
  const normalizedAsset = asset.toLowerCase();
  
  // Optimism Mainnet
  if (network === "eip155:10") {
    if (normalizedAsset === "0x0b2c639c533813f4aa9d7837caf62653d097ff85") {
      return { address: asset, name: "USD Coin", version: "2" };
    }
    if (normalizedAsset === "0x01bff41798a0bcf287b996046ca68b395dbc1071") {
      return { address: asset, name: "Tether USD", version: "1" };
    }
  }
  
  // Optimism Sepolia
  if (network === "eip155:11155420") {
    if (normalizedAsset === "0x5fd84259d66cd46123540766be93dfe6d43130d7") {
      return { address: asset, name: "USD Coin", version: "2" };
    }
  }
  
  throw new Error(`Unknown or unsupported token address for network: ${network}`);
}

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
async function verifySignature(authorization, signature, chainId, tokenAddress, tokenName, tokenVersion) {
  try {
    const domain = getEIP712Domain(chainId, tokenAddress, tokenName, tokenVersion);

    const recoveredAddress = await verifyTypedData({
      address: authorization.from,
      domain,
      types: EIP712_TYPES,
      primaryType: "TransferWithAuthorization",
      message: authorization,
      signature,
    });

    return recoveredAddress;
  } catch (error) {
    logger.error({ err: error }, "Signature verification failed");
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
    // 1. Validate x402 version
    if (paymentPayload.x402Version !== 2) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_VERSION,
      };
    }

    // 2. Validate scheme
    if (paymentPayload.accepted.scheme !== "exact") {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.UNSUPPORTED_SCHEME,
      };
    }

    // 3. Validate network
    const network = paymentPayload.accepted.network;
    let chain;
    try {
      chain = getChain(network);
    } catch (error) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_NETWORK,
      };
    }

    // 4. Extract authorization and signature
    const { authorization, signature } = paymentPayload.payload;
    if (!authorization || !signature) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_PAYLOAD,
      };
    }

    const payer = authorization.from;

    // 5. Verify time window (check before expensive signature verification)
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

    // 6. Verify amount
    const authValue = BigInt(authorization.value);
    const requiredAmount = BigInt(paymentRequirements.amount);

    if (authValue < requiredAmount) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_AMOUNT,
        payer,
      };
    }

    // 7. Verify recipient matches
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
    } catch (error) {
      return {
        isValid: false,
        invalidReason: X402_ERRORS.INVALID_PAYLOAD,
        payer,
      };
    }

    // 9. Verify signature (expensive operation, do after simple checks)
    const isSignatureValid = await verifySignature(
      authorization,
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
    logger.info({
      payer,
      amount: authorization.value,
      network,
      recipient: authorization.to,
    }, "Payment verification successful");

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
