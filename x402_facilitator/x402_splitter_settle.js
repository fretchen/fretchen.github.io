// @ts-check

/**
 * x402 Splitter Facilitator - Settlement Logic
 * Executes payments via EIP3009SplitterV1 contract
 *
 * Settlement Flow:
 * 1. Verify payment first (mandatory gatekeeper)
 * 2. Extract seller and salt from payload
 * 3. Compute nonce = keccak256(abi.encode(seller, salt))
 * 4. Call splitter.executeSplit() on-chain
 * 5. Wait for transaction confirmation
 * 6. Return transaction hash and network
 *
 * Key Features:
 * - Automatic fee split (seller gets totalAmount - fixedFee)
 * - No whitelist check (public facilitator)
 * - Nonce computed from seller+salt (prevents replay)
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  getContract,
  encodeAbiParameters,
  keccak256,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import pino from "pino";
import { getChain, getTokenInfo } from "./chain_utils.js";
import { verifySplitterPayment } from "./x402_splitter_verify.js";
import { SPLITTER_ABI, getSplitterAddress } from "./eip3009_splitter_abi.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Settle payment via Splitter Contract
 * @param {Object} paymentPayload - Payment payload from client
 * @param {Object} paymentRequirements - Payment requirements from resource server
 * @returns {Promise<{success: boolean, payer?: string, transaction?: string, network?: string, errorReason?: string}>}
 */
export async function settleSplitterPayment(paymentPayload, paymentRequirements) {
  try {
    // Step 1: Verify payment first (mandatory gatekeeper)
    logger.info("Verifying payment before settlement");
    const verifyResult = await verifySplitterPayment(paymentPayload, paymentRequirements);

    if (!verifyResult.isValid) {
      logger.warn({ invalidReason: verifyResult.invalidReason }, "Payment verification failed");
      return {
        success: false,
        errorReason: verifyResult.invalidReason || "verification_failed",
        payer: verifyResult.payer,
        transaction: "",
        network: paymentPayload.accepted?.network,
      };
    }

    // Step 2: Extract data from payload
    const network = paymentPayload.accepted?.network;
    const chain = getChain(network);

    const auth = paymentPayload.payload.authorization;
    const { from: buyer, value: totalAmountStr, validAfter, validBefore } = auth;
    const totalAmount = BigInt(totalAmountStr);

    // Extract signature (x402 v2 format: signature is separate field)
    const signature = paymentPayload.payload.signature;
    if (!signature) {
      throw new Error("Missing signature in payload");
    }

    // Parse signature (viem format: 0x prefixed hex string)
    // v, r, s can be extracted from signature
    const sig = signature.startsWith("0x") ? signature : `0x${signature}`;

    // Extract v, r, s from signature (EIP-2098 compact or standard format)
    const r = `0x${sig.slice(2, 66)}`;
    const s = `0x${sig.slice(66, 130)}`;
    const v = parseInt(sig.slice(130, 132) || "1b", 16);

    // Extract seller and salt from payload
    // The ExactSplitEvmScheme adds these fields to payload
    const seller = paymentPayload.payload?.seller;
    const salt = paymentPayload.payload?.salt;

    if (!seller) {
      throw new Error("Missing seller address in payload (required for splitter settlement)");
    }

    if (!salt) {
      throw new Error("Missing salt in payload (required for nonce computation)");
    }

    logger.info(
      {
        buyer,
        seller,
        totalAmount: totalAmount.toString(),
        salt: salt.slice(0, 20) + "...",
      },
      "Extracted settlement data",
    );

    // Step 3: Compute nonce = keccak256(abi.encode(seller, salt))
    // CRITICAL: This must match what the buyer signed!
    const nonce = keccak256(
      encodeAbiParameters([{ type: "address" }, { type: "bytes32" }], [seller, salt]),
    );

    logger.info(
      { nonce, seller, salt: salt.slice(0, 10) + "..." },
      "Computed nonce from seller+salt",
    );

    // Get contract addresses
    const splitterAddress = getSplitterAddress(network);
    const tokenInfo = getTokenInfo(network, paymentPayload.accepted?.asset);

    logger.info(
      {
        splitter: splitterAddress,
        token: tokenInfo.address,
        network,
      },
      "Settlement contract addresses",
    );

    // Step 4: Setup wallet client for on-chain transaction
    const facilitatorPrivateKey = process.env.FACILITATOR_WALLET_PRIVATE_KEY;
    if (!facilitatorPrivateKey) {
      throw new Error("FACILITATOR_WALLET_PRIVATE_KEY not configured");
    }

    const account = privateKeyToAccount(
      facilitatorPrivateKey.startsWith("0x") ? facilitatorPrivateKey : `0x${facilitatorPrivateKey}`,
    );

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(),
    });

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    logger.info({ facilitatorWallet: account.address }, "Using facilitator wallet");

    // Step 5: Get splitter contract instance
    const splitter = getContract({
      address: splitterAddress,
      abi: SPLITTER_ABI,
      client: { public: publicClient, wallet: walletClient },
    });

    // Step 6: Call executeSplit on-chain
    logger.info(
      {
        token: tokenInfo.address,
        buyer,
        seller,
        totalAmount: totalAmount.toString(),
        nonce,
      },
      "Calling splitter.executeSplit()",
    );

    const hash = await splitter.write.executeSplit([
      tokenInfo.address, // token (USDC)
      buyer, // buyer (payer)
      seller, // seller (recipient)
      salt, // salt (for nonce computation)
      totalAmount, // totalAmount (seller amount + fee)
      BigInt(validAfter), // validAfter
      BigInt(validBefore), // validBefore
      nonce, // nonce (keccak256(seller, salt))
      v, // v (signature component)
      r, // r (signature component)
      s, // s (signature component)
    ]);

    logger.info(
      {
        hash,
        buyer,
        seller,
        totalAmount: totalAmount.toString(),
      },
      "Settlement transaction submitted",
    );

    // Step 7: Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });

    if (receipt.status === "success") {
      logger.info(
        {
          hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        },
        "Transaction confirmed successfully",
      );

      return {
        success: true,
        payer: buyer,
        transaction: hash,
        network,
      };
    } else {
      logger.warn({ hash, status: receipt.status }, "Transaction failed on-chain");
      return {
        success: false,
        errorReason: "transaction_reverted",
        payer: buyer,
        transaction: hash,
        network,
      };
    }
  } catch (error) {
    logger.error({ err: error, message: error.message }, "Settlement failed");

    // Extract meaningful error reason from error message
    let errorReason = "settlement_failed";
    const errorMsg = error.message?.toLowerCase() || "";

    if (errorMsg.includes("insufficient")) {
      errorReason = "insufficient_funds";
    } else if (errorMsg.includes("nonce") || errorMsg.includes("authorization used")) {
      errorReason = "authorization_already_used";
    } else if (errorMsg.includes("expired") || errorMsg.includes("invalid time")) {
      errorReason = "authorization_expired";
    } else if (errorMsg.includes("signature") || errorMsg.includes("signer")) {
      errorReason = "invalid_signature";
    } else if (errorMsg.includes("seller") || errorMsg.includes("verification")) {
      errorReason = "seller_verification_failed";
    } else if (errorMsg.includes("fee")) {
      errorReason = "insufficient_amount_for_fee";
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
