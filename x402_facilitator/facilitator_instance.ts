/**
 * x402 v2 Facilitator Instance
 * Centralized facilitator configuration with multi-chain support
 *
 * Architecture: One ExactEvmScheme per network (following x402 best practices),
 * plus one BatchSettlementEvmScheme per network THAT HAS THE CONTRACT DEPLOYED
 * (see getBatchSettlementNetworks() in chain_utils.ts — a strict subset of
 * getSupportedNetworks()). Each network has its own dedicated viem client,
 * eliminating chain selection issues. The facilitator routes by scheme, so both
 * schemes coexist on the same /verify and /settle endpoints.
 */

import { createPublicClient, createWalletClient, http, type Account } from "viem";
import { x402Facilitator } from "@x402/core/facilitator";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
import { BatchSettlementEvmScheme } from "@x402/evm/batch-settlement/facilitator";
import pino from "pino";
import { evaluateFeeGate, getFacilitatorAddress, loadFacilitatorAccount } from "./x402_fee";
import {
  getChainConfig,
  getSupportedNetworks,
  getBatchSettlementNetworks,
  getRpcUrl,
} from "./chain_utils";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

/**
 * Create a FacilitatorEvmSigner for a specific network.
 * The signer is bound to a single chain — no dynamic chain selection needed.
 */
function createSignerForNetwork(account: Account, network: string) {
  const config = getChainConfig(network);
  // Falls back to the chain's public endpoint when unset — fine for testnets, but
  // set RPC_URL_<NETWORK> for anything carrying real traffic (see getRpcUrl).
  const rpcUrl = getRpcUrl(network);

  const publicClient = createPublicClient({
    chain: config.chain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: config.chain,
    transport: http(rpcUrl),
  });

  return toFacilitatorEvmSigner({
    address: account.address,
    readContract: (args) =>
      publicClient.readContract({
        ...args,
        args: args.args || [],
      }),
    // The SDK's FacilitatorEvmSigner.verifyTypedData types `types` loosely as
    // Record<string, unknown>; viem's VerifyTypedDataParameters wants the strict
    // TypedDataParameter mapping. Runtime-correct pass-through — cast at the boundary.
    verifyTypedData: (args) =>
      publicClient.verifyTypedData(args as Parameters<typeof publicClient.verifyTypedData>[0]),
    writeContract: (args) =>
      walletClient.writeContract({
        ...args,
        args: args.args || [],
      }),
    sendTransaction: (args) => walletClient.sendTransaction(args),
    waitForTransactionReceipt: (args) => publicClient.waitForTransactionReceipt(args),
    getCode: (args) => publicClient.getCode(args),
  });
}

/**
 * Create read-only facilitator (without signer, for getSupported() only)
 */
export function createReadOnlyFacilitator(): InstanceType<typeof x402Facilitator> {
  const facilitator = new x402Facilitator();

  for (const network of getSupportedNetworks()) {
    const config = getChainConfig(network);

    const publicClient = createPublicClient({
      chain: config.chain,
      transport: http(getRpcUrl(network)),
    });

    const readOnlySigner = toFacilitatorEvmSigner({
      // Report the real facilitator address when a private key is configured — required
      // for /supported to pass newer SDK clients' strict validation (e.g. the official
      // x402HTTPResourceServer.initialize() path); falls back to the zero address only
      // when no valid key exists (this instance never signs anything either way).
      address: getFacilitatorAddress() ?? "0x0000000000000000000000000000000000000000",
      readContract: (args) =>
        publicClient.readContract({
          ...args,
          args: args.args || [],
        }),
      // The SDK's FacilitatorEvmSigner.verifyTypedData types `types` loosely as
      // Record<string, unknown>; viem's VerifyTypedDataParameters wants the strict
      // TypedDataParameter mapping. Runtime-correct pass-through — cast at the boundary.
      verifyTypedData: (args) =>
        publicClient.verifyTypedData(args as Parameters<typeof publicClient.verifyTypedData>[0]),
      writeContract: () => {
        throw new Error("Read-only facilitator cannot write contracts");
      },
      sendTransaction: () => {
        throw new Error("Read-only facilitator cannot send transactions");
      },
      waitForTransactionReceipt: () => {
        throw new Error("Read-only facilitator cannot wait for receipts");
      },
      getCode: (args) => publicClient.getCode(args),
    });

    facilitator.register(network, new ExactEvmScheme(readOnlySigner));
    // Only advertise batch-settlement where the contract is actually deployed —
    // see getBatchSettlementNetworks(). No authorizerSigner → no receiverAuthorizer
    // advertised; servers self-manage it.
    if (getBatchSettlementNetworks().includes(network)) {
      facilitator.register(network, new BatchSettlementEvmScheme(readOnlySigner));
    }
  }

  logger.info({
    networks: getSupportedNetworks(),
    msg: "x402 Facilitator initialized (read-only mode)",
  });

  return facilitator;
}

/**
 * Create the facilitator instance with multi-chain support.
 * Uses separate ExactEvmScheme per network (x402 best practice).
 */
export function createFacilitator(requirePrivateKey = true): InstanceType<typeof x402Facilitator> {
  let account;
  try {
    // Shares viem's nonceManager with the fee pull that follows every settlement — see
    // loadFacilitatorAccount.
    account = loadFacilitatorAccount();
  } catch (err) {
    if (!requirePrivateKey) {
      return createReadOnlyFacilitator();
    }
    throw err;
  }

  // Create and configure facilitator
  const facilitator = new x402Facilitator();

  // Register a separate ExactEvmScheme + BatchSettlementEvmScheme for each network
  const supportedNetworks = getSupportedNetworks();
  for (const network of supportedNetworks) {
    const signer = createSignerForNetwork(account, network);
    facilitator.register(network, new ExactEvmScheme(signer));
    // Only advertise batch-settlement where the contract is actually deployed —
    // see getBatchSettlementNetworks(). No authorizerSigner → no receiverAuthorizer
    // advertised; servers self-manage it (self-managed receiver, per the
    // batch-settlement migration plan).
    //
    // Passing no authorizerSigner is also load-bearing for safety: the SDK's refund path
    // omits the per-claim `receiverAuthorizer === authorizerSigner.address` check that its
    // claim path performs, so it would sign a claim batch for channels naming any
    // authorizer. That gap is unreachable here only because claimAuthorizerSignature must
    // always come from the client. Adding an authorizerSigner would make it live.
    if (getBatchSettlementNetworks().includes(network)) {
      facilitator.register(network, new BatchSettlementEvmScheme(signer));
    }
  }

  // Add fee allowance check AFTER verification
  facilitator.onAfterVerify(async ({ paymentPayload, requirements, result }) => {
    if (!result.isValid) {
      return;
    }

    // Batch-settlement carries NO fee decision in this hook — deliberately. Its
    // fee-bearing event is a claimWithSignature, which is a property of the payload's
    // SHAPE (a `claim`, a `settle`, or a `refund` enriched with a non-empty `claims[]`),
    // not of `payload.type`, and it has to be gated against the receiver the SDK actually
    // pays out to. That decision is made once, in x402_settle.ts's
    // classifyBatchSettlement(). Forcing feeRequired=false here keeps this hook from
    // becoming a second, label-based source of truth for the same question — which is the
    // split-brain the enriched-refund bypass came out of. deposit/voucher/claim-less
    // refunds are genuinely free: they fund, sign or unwind a channel rather than realize
    // a payment (FEE_MODEL_PLAN.md Phase 3).
    if (paymentPayload.accepted?.scheme === "batch-settlement") {
      (result as Record<string, unknown>).feeRequired = false;
      return;
    }

    // The `exact` scheme accepts two payload shapes (@x402/evm ExactEvmPayloadV2):
    // EIP-3009 (`authorization`, USDC/EURC) and Permit2 (`permit2Authorization`, EURe —
    // which has no EIP-3009). Both reach the gate below unchanged, because it reads only
    // `requirements`.
    //
    // Gate on `requirements`, NOT on the client's payload envelope — consistent with the
    // batch-settlement branch above. The SDK pins the payload to the requirements before
    // this hook runs: verifyEIP3009 enforces `authorization.to === payTo`
    // (ErrRecipientMismatch), verifyPermit2 enforces `permit2Authorization.witness.to ===
    // payTo` (ErrPermit2RecipientMismatch) plus the token and amount. So requirements.payTo
    // is the recipient actually paid, shape-independent, not client-set.
    const network = requirements?.network;
    const recipient = requirements?.payTo as string | undefined;
    // The token the payment settles in, and so the one the fee is charged in.
    // Requirements again, not the payload envelope: verify signed against this asset.
    const asset = requirements?.asset as string | undefined;

    if (!network || !recipient || !asset) {
      logger.warn("Missing network, recipient or asset after verification");
      result.isValid = false;
      result.invalidReason = "invalid_payload";
      return;
    }

    // The same gate batch-settlement's claim/settle path runs (x402_fee.ts) — shared so
    // the two schemes cannot drift apart on when a fee is owed or when to fail closed.
    const gate = await evaluateFeeGate(recipient as `0x${string}`, network, asset as `0x${string}`);

    if (gate.kind === "no_fee") {
      // Fees disabled — allow all recipients without fee
      (result as Record<string, unknown>).feeRequired = false;
      return;
    }

    if (gate.kind === "reject") {
      // Only the reason travels. The allowance detail behind it (how much was approved,
      // how much is needed, which address to approve) is already published by
      // `/supported` → `facilitatorFees`, and is logged by evaluateFeeGate for operators
      // — restating it here would widen the wire contract for no new information.
      result.isValid = false;
      result.invalidReason = gate.reason;
      return;
    }

    (result as Record<string, unknown>).feeRequired = true;
    (result as Record<string, unknown>).recipient = recipient;
    // Surfaced in the verify response so sellers see their approval running down.
    // Left undefined when the allowance was unreadable — never reported as 0.
    if (gate.remainingSettlements !== undefined) {
      (result as Record<string, unknown>).remainingSettlements = gate.remainingSettlements;
    }
  });

  logger.info(
    {
      networks: supportedNetworks,
      signerAddress: account.address,
    },
    "x402 Facilitator initialized",
  );

  return facilitator;
}

// Singleton instance
let facilitatorInstance: InstanceType<typeof x402Facilitator> | null = null;

/**
 * Get or create the facilitator instance
 */
export function getFacilitator(requirePrivateKey = true): InstanceType<typeof x402Facilitator> {
  if (!facilitatorInstance) {
    facilitatorInstance = createFacilitator(requirePrivateKey);
  }
  return facilitatorInstance;
}

/**
 * Reset the facilitator instance (for testing)
 */
export function resetFacilitator(): void {
  facilitatorInstance = null;
}
