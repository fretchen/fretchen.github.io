import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import {
  BatchSettlementEvmScheme,
  type AuthorizerSigner,
  type BatchSettlementChannelManager,
} from "@x402/evm/batch-settlement/server";
import { getUSDCConfig, loadPrivateKey } from "@fretchen/chain-utils";
import { privateKeyToAccount } from "viem/accounts";
import { S3ChannelStorage } from "./x402_channel_storage.js";
import { EXPOSED_X402_HEADERS } from "./utils.js";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://facilitator.fretchen.eu";

const SUPPORTED_NETWORKS = [
  "eip155:11155420", // Optimism Sepolia
  "eip155:10", // Optimism Mainnet
  "eip155:8453", // Base Mainnet
  "eip155:84532", // Base Sepolia
];

// Networks where the x402BatchSettlement contract (CREATE2, canonical address) is deployed.
// Keep in sync with x402_facilitator/chain_utils.ts::getBatchSettlementNetworks() — notably
// Optimism *Sepolia* has no deployment, so it is absent here despite being in
// SUPPORTED_NETWORKS above (the exact scheme works there; batch-settlement does not).
//
// Optimism mainnet was omitted here until @x402/evm 2.20: enhancePaymentRequirements() used
// to resolve the asset from the SDK's own `DEFAULT_STABLECOINS` registry, which has no
// "eip155:10" entry, so it threw and 500'd the *entire* 402 response (Promise.all in
// createBatchSettlementPaymentRequirements below), not just the Optimism entry. 2.20 honours
// the caller's `asset`/`extra` instead (x402-foundation/x402#2910). The registry itself STILL
// has no eip155:10 entry, so the remaining paths that read it must be passed an explicit
// token — see createChannelManager in llm_x402_cron.ts.
const BATCH_SETTLEMENT_NETWORKS = ["eip155:10", "eip155:8453", "eip155:84532"];

// Onchain channel state (balance/totalClaimed) is cached for this long before a fresh
// RPC read; the SDK's default resolves to a fixed 5 minutes (floored by the protocol's
// MIN_WITHDRAW_DELAY), which would make a user's first chat message right after
// depositing spuriously fail with cumulative_exceeds_balance. Confirmed via the B0 spike.
const ONCHAIN_STATE_TTL_MS = 5_000;

// How long a client must wait after requesting a unilateral exit before they can pull
// their escrow back out. Must stay well above the claim/settle cron's interval
// (llmx402cron, serverless.yml) or the server risks losing already-earned revenue on a
// channel that goes quiet — a channel could become withdrawable before the cron ever
// gets a chance to claim it. Previously unset here, which silently fell back to the
// SDK's own default (`MIN_WITHDRAW_DELAY`, 900s / 15 minutes) — far below the cron's
// hourly interval at the time. 24h leaves the (now 12h) cron a 2x safety margin.
const WITHDRAW_DELAY_SECONDS = Number(process.env.LLM_WITHDRAW_DELAY_SECONDS ?? "86400");

// TTL for the batch-settlement per-channel "pendingRequest" lock. @x402/evm sets this lock
// in onBeforeVerify and clears it in onAfterSettle to serialize concurrent requests on one
// channel; a second request while the lock is live is rejected with `channel_busy`.
// maxTimeoutSeconds is the ONLY thing that drives this TTL in the batch-settlement scheme —
// it does not gate voucher freshness or payment expiry (verified against the SDK). The SDK
// clamps the derived TTL to [5s, 10min] (pendingExpiresAt), so a large value like the
// previous 3600 pinned it to the 10-minute ceiling: if a request is abandoned between verify
// and settle (tab close, network drop, notebook interrupt) the lock is orphaned and the
// channel stays busy for the full 10 minutes — and the client SDK does NOT auto-recover from
// `channel_busy`. 120s keeps ample headroom over the real verify + LLM + settle wall-clock
// (seconds, even for a slow mainnet completion + on-chain claim) while cutting the worst-case
// orphan lockout to 2 minutes. Must be used identically at 402-advertise time (below) AND at
// verify time (sc_llm_x402.ts) — the SDK treats maxTimeoutSeconds as immutable across the two.
export const LLM_MAX_TIMEOUT_SECONDS = 120;

export function getSupportedNetworks(): string[] {
  return SUPPORTED_NETWORKS;
}

export function getBatchSettlementNetworks(): string[] {
  return BATCH_SETTLEMENT_NETWORKS;
}

export function createFacilitatorClient(): HTTPFacilitatorClient {
  return new HTTPFacilitatorClient({ url: FACILITATOR_URL });
}

/** What the facilitator charges, and the address that collects it. */
export interface FacilitatorFeeConfig {
  /** Spender to approve — the facilitator wallet that runs `transferFrom`. */
  recipient: `0x${string}`;
  /** Flat fee per settlement, in USDC atomic units. */
  flatFee: bigint;
}

/**
 * Read the fee model the facilitator currently advertises, or null when it charges none.
 *
 * `/supported` is the documented source of truth for both the amount and the collecting
 * address, so reading it here means no extra env var to keep in sync and no breakage if
 * the facilitator rotates its key.
 *
 * Returns null — never throws — when the facilitator is unreachable, advertises no fee, or
 * returns something unparseable. Callers use this for advisory checks only, so a failure
 * here must degrade to "no warning", never to a blocked payment.
 *
 * Bounded to FEE_CONFIG_FETCH_TIMEOUT_MS: this is awaited once, before the per-network
 * claim loop even starts, so an unbounded fetch would stall every network's claim behind
 * it — the opposite of "advisory only" if the facilitator is merely slow, not down.
 */
const FEE_CONFIG_FETCH_TIMEOUT_MS = 5_000;

export async function getFacilitatorFeeConfig(): Promise<FacilitatorFeeConfig | null> {
  try {
    const res = await fetch(`${FACILITATOR_URL}/supported`, {
      signal: AbortSignal.timeout(FEE_CONFIG_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      // Still advisory-only (returns null, same as every other branch here) — this just stops
      // the facilitator being unreachable from being completely silent.
      logger.warn({ status: res.status }, "Could not read facilitator fee config");
      return null;
    }
    const body: unknown = await res.json();
    const fees = (body as { facilitatorFees?: { recipient?: unknown; flatFee?: unknown } })
      ?.facilitatorFees;
    if (typeof fees?.recipient !== "string" || typeof fees?.flatFee !== "string") {
      // No fee configured on this facilitator — nothing to check an allowance against.
      return null;
    }
    const flatFee = BigInt(fees.flatFee);
    if (flatFee <= 0n) {
      return null;
    }
    return { recipient: fees.recipient as `0x${string}`, flatFee };
  } catch (err) {
    logger.warn({ err }, "Could not read facilitator fee config");
    return null;
  }
}

/**
 * The SDK's own per-request payload/requirements types, read off its public method signatures
 * rather than hand-copied — `@x402/core` uses both throughout its API (verify/settle,
 * enhancePaymentRequirements, ...) but does not export either from any of its public entry
 * points (`.`, `/client`, `/server`, `/facilitator` all checked). This is the stable way to name
 * them without depending on the internal, hash-named chunk file they actually live in, and it
 * stays correct across an SDK version bump since it reads whatever the installed `.d.ts` says.
 *
 * Named distinctly from this file's own `PaymentRequirements` below, which is the *whole* 402
 * challenge document (`{ x402Version, resource, accepts: [...] }`) — confusingly similar name,
 * different shape: the SDK's type here is what one entry of that `accepts` array looks like.
 */
export type SdkPaymentPayload = Parameters<x402ResourceServer["verifyPayment"]>[0];
export type SdkPaymentRequirements = Parameters<x402ResourceServer["verifyPayment"]>[1];

export function createResourceServer(): x402ResourceServer {
  const server = new x402ResourceServer(createFacilitatorClient());
  for (const network of getSupportedNetworks()) {
    server.register(network as `${string}:${string}`, new ExactEvmScheme());
  }
  return server;
}

export interface LLMResourceServer {
  resourceServer: x402ResourceServer;
  /**
   * The scheme serving `network`, whose storage is scoped to that network's S3 prefix.
   * Use this wherever channel storage is touched — settlement and the claim/settle cron.
   */
  schemeFor: (network: string) => BatchSettlementEvmScheme;
  /**
   * Convenience handle for storage-independent work only — building the 402 `accepts`
   * array, where `enhancePaymentRequirements` just stamps on `receiverAuthorizer`,
   * `withdrawDelay` and the EIP-712 domain. Anything that reads or writes channels must
   * go through `schemeFor` instead, or it will reach the wrong network's prefix.
   */
  scheme: BatchSettlementEvmScheme;
}

/**
 * Resource server for the LLM assistant's x402 batch-settlement channels.
 *
 * One `BatchSettlementEvmScheme` **per network**, each owning an `S3ChannelStorage` scoped to
 * that network's prefix. The scheme itself is receiver-bound rather than network-bound (see B0
 * spike), so a single shared instance used to serve every network — but its storage is not:
 * `ChannelStorage.list()` takes no network argument, so one shared store handed Base channels
 * to Optimism claim batches and every batch reverted. `x402ResourceServer` keys its registry by
 * network (`Map<network, Map<scheme, server>>`), so registering a distinct instance per network
 * routes settlement to the right store with no change at the call sites.
 */
export function createLLMResourceServer(receiverAddress: `0x${string}`): LLMResourceServer {
  const resourceServer = new x402ResourceServer(createFacilitatorClient());

  const authorizerAccount = privateKeyToAccount(loadPrivateKey("RECEIVER_AUTHORIZER_PRIVATE_KEY"));
  const receiverAuthorizerSigner: AuthorizerSigner = {
    address: authorizerAccount.address,
    signTypedData: (params) =>
      // AuthorizerSigner's own params shape (domain/types/message as Record<string, unknown>)
      // is looser than viem's TypedDataDefinition — the two libraries just don't share one
      // canonical typed-data type. Safe: viem validates the real EIP-712 structure at runtime
      // regardless of how loosely this bridge sees it.
      authorizerAccount.signTypedData(
        params as Parameters<typeof authorizerAccount.signTypedData>[0],
      ),
  };

  const schemes = new Map<string, BatchSettlementEvmScheme>();
  for (const network of BATCH_SETTLEMENT_NETWORKS) {
    const scheme = new BatchSettlementEvmScheme(receiverAddress, {
      storage: new S3ChannelStorage(network),
      receiverAuthorizerSigner,
      onchainStateTtlMs: ONCHAIN_STATE_TTL_MS,
      withdrawDelay: WITHDRAW_DELAY_SECONDS,
    });
    schemes.set(network, scheme);
    resourceServer.register(network as `${string}:${string}`, scheme);
  }

  const schemeFor = (network: string): BatchSettlementEvmScheme => {
    const scheme = schemes.get(network);
    if (!scheme) {
      throw new Error(
        `No batch-settlement scheme for network ${network} ` +
          `(supported: ${BATCH_SETTLEMENT_NETWORKS.join(", ")})`,
      );
    }
    return scheme;
  };

  return { resourceServer, schemeFor, scheme: schemeFor(BATCH_SETTLEMENT_NETWORKS[0]) };
}

/**
 * Make a `BatchSettlementChannelManager` send ENHANCED payment requirements.
 *
 * Works around an SDK gap present in @x402/evm 2.25 and 2.26 alike: the manager's own
 * `buildPaymentRequirements()` returns `extra: {}`, and the facilitator's
 * `validateChannelConfig` rejects any refund whose requirements carry no
 * `extra.receiverAuthorizer` — it treats "absent" as "mismatch" and fails closed:
 *
 *     const requiredReceiverAuthorizer = extra?.receiverAuthorizer;
 *     if (!requiredReceiverAuthorizer || …) return ErrReceiverAuthorizerMismatch;
 *
 * So every cooperative refund fails with `receiver_authorizer_mismatch` regardless of which
 * key signed it. This is the same trap already documented for the deposit path in
 * `sc_llm_x402.ts` — the requirements the facilitator checks against must carry
 * `receiverAuthorizer`/`withdrawDelay`, and only `enhancePaymentRequirements` adds them.
 *
 * Claims are unaffected: they are verified through `claimAuthorizerSignature`, not through
 * `validateChannelConfig` against `accepted.extra`.
 *
 * Apply this AFTER claiming and before refunding, so the claim/settle calls keep using the
 * requirements they already work with. Remove once the SDK enhances its own refund
 * requirements.
 */
export async function useEnhancedRefundRequirements(
  scheme: BatchSettlementEvmScheme,
  manager: BatchSettlementChannelManager,
  opts: { network: string; asset: string; payTo: string },
): Promise<void> {
  const base: SdkPaymentRequirements = {
    scheme: "batch-settlement",
    network: opts.network as `${string}:${string}`,
    asset: opts.asset,
    amount: "0",
    payTo: opts.payTo,
    maxTimeoutSeconds: 0,
    extra: {},
  };
  const enhanced = await scheme.enhancePaymentRequirements(
    base,
    {
      x402Version: 2,
      scheme: "batch-settlement",
      network: opts.network as `${string}:${string}`,
      extra: {},
    },
    [],
  );

  // Drop `withdrawDelay`, which the enhancer stamps from the CURRENT server config. It is part
  // of `computeChannelId` (payer, payerAuthorizer, receiver, receiverAuthorizer, token,
  // withdrawDelay, salt), so it is fixed per channel at creation and can never be updated — a
  // different delay is a different channel. The facilitator's validateChannelConfig compares
  // the payload's stored config against this field:
  //
  //     if (extra?.withdrawDelay !== undefined && config.withdrawDelay !== Number(extra.withdrawDelay))
  //       return ErrWithdrawDelayMismatch;
  //
  // so once LLM_WITHDRAW_DELAY_SECONDS changed (900 -> 86400, commit 313e76df), every channel
  // opened before it became permanently unrefundable: `withdraw_delay_mismatch` on every sweep,
  // escrow stranded with no way back. Absent, the equality branch is skipped; the range check
  // that follows still applies (MIN_WITHDRAW_DELAY is 900).
  //
  // Safe to omit because the check immediately above it in the same function already binds the
  // config cryptographically — `computeChannelId(config) === channelId` fails first if anything
  // in the config was forged. The equality test is policy ("this channel matches today's
  // setting"), not security, and enforcing today's policy on an old channel only strands funds.
  // `receiverAuthorizer` is kept: that one the facilitator fails closed on, and it is why this
  // function exists.
  const enhancedExtra = (enhanced as { extra?: Record<string, unknown> }).extra ?? {};
  const { withdrawDelay: _configuredDelay, ...extraWithoutDelay } = enhancedExtra;
  const refundRequirements = { ...enhanced, extra: extraWithoutDelay };

  (manager as unknown as { buildPaymentRequirements: () => unknown }).buildPaymentRequirements =
    () => refundRequirements;
}

export interface BatchSettlementPaymentRequirementsOptions {
  resourceUrl: string;
  description: string;
  mimeType: string;
  amount: string;
  payTo: string;
  scheme: BatchSettlementEvmScheme;
  networks?: readonly string[];
  /**
   * Lock TTL to advertise, defaulting to the LLM's. `search_api.ts` passes a shorter one: it is
   * not part of `channelConfig` (see `computeChannelId` — payer, payerAuthorizer, receiver,
   * receiverAuthorizer, token, withdrawDelay, salt), so routes sharing one channel may differ
   * here. Whatever a route advertises it must also pass at verify time.
   */
  maxTimeoutSeconds?: number;
}

/**
 * Builds the 402 `accepts` array for batch-settlement: each network's base requirements
 * must be run through the scheme's own `enhancePaymentRequirements` so the client
 * receives the `receiverAuthorizer`/`withdrawDelay`/EIP-712 domain fields it needs to
 * build a deposit payload (confirmed necessary in the B0 spike).
 */
export async function createBatchSettlementPaymentRequirements({
  resourceUrl,
  description,
  mimeType,
  amount,
  payTo,
  scheme,
  networks = BATCH_SETTLEMENT_NETWORKS,
  maxTimeoutSeconds = LLM_MAX_TIMEOUT_SECONDS,
}: BatchSettlementPaymentRequirementsOptions): Promise<{
  x402Version: number;
  resource: { url: string; description: string; mimeType: string };
  accepts: unknown[];
}> {
  const accepts = await Promise.all(
    networks.map(async (network) => {
      const config = getUSDCConfig(network);
      const base: SdkPaymentRequirements = {
        scheme: "batch-settlement",
        network: network as `${string}:${string}`,
        amount,
        asset: config.address,
        payTo,
        maxTimeoutSeconds,
        extra: { name: config.usdcName, version: config.usdcVersion },
      };
      return scheme.enhancePaymentRequirements(
        base,
        {
          x402Version: 2,
          scheme: "batch-settlement",
          network: network as `${string}:${string}`,
          extra: base.extra,
        },
        [],
      );
    }),
  );

  return {
    x402Version: 2,
    resource: { url: resourceUrl, description, mimeType },
    accepts,
  };
}

export interface PaymentRequirementsOptions {
  resourceUrl: string;
  description: string;
  mimeType: string;
  amount: string;
  payTo: string;
  networks?: readonly string[];
}

export interface PaymentRequirements {
  x402Version: number;
  resource: { url: string; description: string; mimeType: string };
  accepts: Array<{
    scheme: string;
    network: string;
    amount: string;
    asset: string;
    payTo: string;
    maxTimeoutSeconds: number;
    extra: { name: string; version: string };
  }>;
}

export function createPaymentRequirements({
  resourceUrl,
  description,
  mimeType,
  amount,
  payTo,
  networks = getSupportedNetworks(),
}: PaymentRequirementsOptions): PaymentRequirements {
  const accepts = networks.map((network) => {
    const config = getUSDCConfig(network);
    return {
      scheme: "exact",
      network,
      amount,
      asset: config.address,
      payTo,
      maxTimeoutSeconds: 60,
      extra: {
        name: config.usdcName,
        version: config.usdcVersion,
      },
    };
  });

  return {
    x402Version: 2,
    resource: { url: resourceUrl, description, mimeType },
    accepts,
  };
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export function create402Response(paymentRequirements: {
  x402Version: number;
  error?: string;
  resource: { url: string; description?: string; mimeType?: string };
  accepts: unknown[];
  extensions?: Record<string, unknown>;
}): HttpResponse {
  const paymentRequiredHeader = Buffer.from(JSON.stringify(paymentRequirements)).toString("base64");

  return {
    statusCode: 402,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
      // Shared with CORS_HEADERS so the 402 and the settled 200 cannot drift apart —
      // they did, and the 200 was the one missing Payment-Response.
      "Access-Control-Expose-Headers": EXPOSED_X402_HEADERS,
      "Content-Type": "application/json",
      "Payment-Required": paymentRequiredHeader,
      "X-Payment": JSON.stringify(paymentRequirements),
    },
    body: JSON.stringify(paymentRequirements),
  };
}

export function extractPaymentPayload(
  headers: Record<string, string>,
): Record<string, unknown> | null {
  const v2Header = headers["payment-signature"] ?? headers["Payment-Signature"];
  if (v2Header) {
    try {
      const decoded = Buffer.from(v2Header, "base64").toString("utf-8");
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      // The caller's fault (malformed header), not ours — warn, not error.
      logger.warn("Failed to parse PAYMENT-SIGNATURE header");
      return null;
    }
  }

  const v1Header = headers["x-payment"] ?? headers["X-Payment"];
  if (v1Header) {
    try {
      return JSON.parse(v1Header) as Record<string, unknown>;
    } catch {
      logger.warn("Failed to parse X-PAYMENT header");
      return null;
    }
  }

  return null;
}

/**
 * Converts a USDC atomic-unit amount (6 decimals, as used by accepts[].amount) into a
 * decimal USD string suitable for OpenAPI's x-payment-info.price (which the x402scan
 * discovery spec requires in decimal USD, not atomic units). Bigint-based to avoid float
 * precision loss; trims trailing zeros so "3000" -> "0.003", not "0.003000".
 */
export function formatUsdcAtomicAsDecimalUsd(atomicAmount: string): string {
  const atomic = BigInt(atomicAmount);
  const DECIMALS = 6n;
  const divisor = 10n ** DECIMALS;
  const whole = atomic / divisor;
  const fraction = (atomic % divisor).toString().padStart(Number(DECIMALS), "0");
  const trimmedFraction = fraction.replace(/0+$/, "");
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole.toString();
}

export function createSettlementHeaders(
  settlementResult: Record<string, unknown>,
): Record<string, string> {
  const paymentResponseHeader = Buffer.from(JSON.stringify(settlementResult)).toString("base64");
  return {
    "Payment-Response": paymentResponseHeader,
    "X-Payment-Response": JSON.stringify(settlementResult),
  };
}
