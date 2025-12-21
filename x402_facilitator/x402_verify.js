// @ts-check

/**
 * x402 v2 Payment Verification Module
 * Uses x402 shared utilities for all networks
 */

import { createPublicClient, http, verifyTypedData, getContract } from "viem";
import { getUSDCBalance, getUsdcChainConfigForChain } from "x402/shared/evm";
import pino from "pino";
import { isAgentWhitelisted } from "./x402_whitelist.js";
import { getChain, getTokenInfo } from "./chain_utils.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

// EIP-3009 ABI for nonce checking
const EIP3009_ABI = [
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
];

// EIP-712 Types for USDC TransferWithAuthorization
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
 * Get USDC config with fallback for networks not in x402 package
 */
function getUsdcConfigWithFallback(chainId, network, asset) {
  // Try x402 package first
  const x402Config = getUsdcChainConfigForChain(chainId);
  if (x402Config) {
    return x402Config;
  }

  // Fallback: use our chain_utils for Optimism
  logger.info({ chainId, network }, "Using fallback USDC config");
  const tokenInfo = getTokenInfo(network, asset);

  return {
    address: tokenInfo.address,
    eip712: {
      name: tokenInfo.name,
      version: tokenInfo.version,
    },
  };
}

/**
 * Verify payment authorization - routes to appropriate implementation
 * @param {Object} paymentPayload - Payment payload from client
 * @param {Object} paymentRequirements - Payment requirements from resource server
 * @returns {Promise<{isValid: boolean, invalidReason?: string, payer?: string}>}
 */
export async function verifyPayment(paymentPayload, paymentRequirements) {
  try {
    // 1. CUSTOM EXTENSION: Early whitelist check (before expensive operations)
    const network = paymentPayload.accepted?.network;
    const recipient = paymentPayload.payload?.authorization?.to;

    if (!network || !recipient) {
      logger.warn("Missing network or recipient in payment payload");
      return {
        isValid: false,
        invalidReason: "invalid_payload",
      };
    }

    // Validate network exists before whitelist check
    try {
      getChain(network);
    } catch (error) {
      logger.warn({ network }, "Invalid network");
      return {
        isValid: false,
        invalidReason: "invalid_network",
      };
    }

    // Check recipient whitelist (GenImNFTv4/LLMv1 NFT holders only)
    const whitelistCheck = await isAgentWhitelisted(recipient, network);
    if (!whitelistCheck.isWhitelisted) {
      logger.warn({ recipient, network }, "Payment verification failed: Recipient not whitelisted");
      return {
        isValid: false,
        invalidReason: "unauthorized_agent",
        recipient,
      };
    }

    logger.info(
      { recipient, network, source: whitelistCheck.source },
      "Recipient whitelist check passed",
    );

    // 2. Verify using x402 utilities (supports all networks)
    return await verifyWithX402Utilities(paymentPayload, paymentRequirements);
  } catch (error) {
    logger.error({ err: error }, "Unexpected error during payment verification");
    return {
      isValid: false,
      invalidReason: "unexpected_verify_error",
    };
  }
}

/**
 * Verify using x402 shared utilities (for all networks)
 */
async function verifyWithX402Utilities(paymentPayload, paymentRequirements) {
  logger.info(
    { network: paymentPayload.accepted.network },
    "Using x402 utilities for verification",
  );

  try {
    // Validate basic structure
    if (paymentPayload.x402Version !== 2) {
      return {
        isValid: false,
        invalidReason: "invalid_x402_version",
      };
    }

    if (paymentPayload.accepted.scheme !== "exact") {
      return {
        isValid: false,
        invalidReason: "unsupported_scheme",
      };
    }

    const network = paymentPayload.accepted.network;
    const chain = getChain(network);
    const { authorization, signature } = paymentPayload.payload || {};

    if (!authorization || !signature) {
      return {
        isValid: false,
        invalidReason: "invalid_payload",
      };
    }

    const payer = authorization.from;

    // Get USDC config using x402 shared utility with fallback
    const usdcConfig = getUsdcConfigWithFallback(chain.id, network, paymentRequirements.asset);

    // Create public client for blockchain calls
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Verify time window
    const now = Math.floor(Date.now() / 1000);
    const validAfter = parseInt(authorization.validAfter);
    const validBefore = parseInt(authorization.validBefore);

    if (now < validAfter) {
      return {
        isValid: false,
        invalidReason: "invalid_exact_evm_payload_authorization_valid_after",
        payer,
      };
    }

    if (now >= validBefore) {
      return {
        isValid: false,
        invalidReason: "invalid_exact_evm_payload_authorization_valid_before",
        payer,
      };
    }

    // Verify amount
    const authValue = BigInt(authorization.value);
    const requiredAmount = BigInt(paymentRequirements.amount);

    if (authValue < requiredAmount) {
      return {
        isValid: false,
        invalidReason: "invalid_exact_evm_payload_authorization_value",
        payer,
      };
    }

    // Verify recipient matches
    if (authorization.to.toLowerCase() !== paymentRequirements.payTo.toLowerCase()) {
      return {
        isValid: false,
        invalidReason: "invalid_exact_evm_payload_recipient_mismatch",
        payer,
      };
    }

    // Verify signature format
    if (!signature || !signature.startsWith("0x")) {
      return {
        isValid: false,
        invalidReason: "invalid_exact_evm_payload_signature",
        payer,
        message: "Signature must start with '0x' prefix",
      };
    }

    if (signature.length !== 132) {
      return {
        isValid: false,
        invalidReason: "invalid_exact_evm_payload_signature",
        payer,
        message: `Invalid signature length: expected 132 characters (0x + 130 hex), got ${signature.length}`,
      };
    }

    // Verify signature using viem (same as x402)
    const domain = {
      name: usdcConfig.eip712.name,
      version: usdcConfig.eip712.version,
      chainId: chain.id,
      verifyingContract: usdcConfig.address,
    };

    const authorizationForSig = {
      from: authorization.from,
      to: authorization.to,
      value: BigInt(authorization.value),
      validAfter: BigInt(authorization.validAfter),
      validBefore: BigInt(authorization.validBefore),
      nonce: authorization.nonce,
    };

    logger.debug(
      {
        domain,
        authorization: authorizationForSig,
        signature,
      },
      "Verifying signature",
    );

    const isSignatureValid = await verifyTypedData({
      address: authorization.from,
      domain,
      types: EIP712_TYPES,
      primaryType: "TransferWithAuthorization",
      message: authorizationForSig,
      signature,
    });

    if (!isSignatureValid) {
      return {
        isValid: false,
        invalidReason: "invalid_exact_evm_payload_signature",
        payer,
      };
    }

    // Check nonce using contract
    const usdcContract = getContract({
      address: usdcConfig.address,
      abi: EIP3009_ABI,
      client: publicClient,
    });

    const nonceUsed = await usdcContract.read.authorizationState([payer, authorization.nonce]);

    if (nonceUsed) {
      return {
        isValid: false,
        invalidReason: "invalid_exact_evm_payload_signature", // Nonce already used
        payer,
      };
    }

    // Check balance - use x402 utility or manual check based on network support
    let balance;
    const x402HasConfig = getUsdcChainConfigForChain(chain.id);
    
    if (x402HasConfig) {
      // x402 supports this network - use their optimized balance check
      balance = await getUSDCBalance(publicClient, payer);
    } else {
      // Fallback for networks not in x402 (like Optimism) - manual balance check
      logger.debug({ chainId: chain.id, usdcAddress: usdcConfig.address }, "Using manual balance check");
      
      // ERC-20 balanceOf ABI
      const ERC20_BALANCE_ABI = [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ];
      
      const erc20Contract = getContract({
        address: usdcConfig.address,
        abi: ERC20_BALANCE_ABI,
        client: publicClient,
      });
      
      balance = await erc20Contract.read.balanceOf([payer]);
    }

    if (balance < authValue) {
      logger.warn({ balance: balance.toString(), required: authValue.toString(), payer }, "Insufficient balance");
      return {
        isValid: false,
        invalidReason: "insufficient_funds",
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
    logger.error({ err: error }, "Error in x402 utilities verification");
    return {
      isValid: false,
      invalidReason: "unexpected_verify_error",
    };
  }
}
