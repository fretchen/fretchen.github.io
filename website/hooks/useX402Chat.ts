/**
 * x402 Batch-Settlement Chat Hook
 *
 * Pays for LLM chat messages via x402 batch-settlement USDC payment channels
 * (the `sc_llm_x402.ts` backend). The first message opens a channel (one on-chain
 * deposit, wallet-signed); later messages are off-chain voucher signatures reusing
 * the open channel.
 *
 * Mirrors `useX402ImageGeneration.ts` (exact scheme) structurally, but batch-settlement
 * has no `registerBatchSettlementEvmScheme` helper — the scheme is constructed manually.
 * The client sequence here is the browser port of the verified blueprint in
 * `scw_js/notebooks/sc_llm_x402_buyer.ipynb`.
 */

import { useState, useCallback, useEffect } from "react";
import { useWalletClient, useAccount } from "wagmi";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { getConfiguredPublicClient } from "./useConfiguredPublicClient";
import { probeAccepts, negotiateNetwork, LLM_V1_FLOOR } from "./x402Discovery";
import type { X402ChatMessage, X402ChatResponse, X402PaymentReceipt, X402GenerationStatus } from "../types/x402";
// Type-only import — erased at compile time, so no @x402 runtime is pulled into SSR.
import type {
  ClientChannelStorage,
  BatchSettlementClientContext,
  BatchSettlementDepositStrategyContext,
} from "@x402/evm/batch-settlement/client";

// Default batch-settlement chat agent — fretchen's own llm/v1 endpoint (the origin
// advertised in scw_js/openapi.llm.json). Override for local dev with
// PUBLIC_ENV__LLM_X402_ENDPOINT=http://localhost:8085. Callers may also pass an explicit
// agentUrl to useX402Chat to target any other llm/v1 agent (see the open-agent-platform
// work) — this constant is only the fallback when none is given.
export const DEFAULT_LLM_AGENT_URL =
  (import.meta.env.PUBLIC_ENV__LLM_X402_ENDPOINT as string | undefined) ?? "https://llm-agent.fretchen.eu";

// The model id sent in the OpenAI-shaped request. Must match an id the target agent
// advertises in its openapi.json (the default fretchen agent serves mistral-large-latest).
const LLM_MODEL = (import.meta.env.PUBLIC_ENV__LLM_MODEL as string | undefined) ?? "mistral-large-latest";

/**
 * Client-side `ClientChannelStorage` backed by the Web Storage API. Persists channel
 * state to `localStorage` so an open channel survives a page reload (the browser
 * equivalent of the notebook's file/localStorage storage). Channel context is all
 * strings, so plain JSON round-trips cleanly.
 */
export class WebStorageClientChannelStorage implements ClientChannelStorage {
  constructor(
    private backend: Storage,
    private prefix = "x402-channel:",
  ) {}
  private keyFor(key: string) {
    return `${this.prefix}${key.toLowerCase()}`;
  }
  get(key: string): Promise<BatchSettlementClientContext | undefined> {
    const raw = this.backend.getItem(this.keyFor(key));
    return Promise.resolve(raw ? (JSON.parse(raw) as BatchSettlementClientContext) : undefined);
  }
  set(key: string, context: BatchSettlementClientContext): Promise<void> {
    this.backend.setItem(this.keyFor(key), JSON.stringify(context));
    return Promise.resolve();
  }
  delete(key: string): Promise<void> {
    this.backend.removeItem(this.keyFor(key));
    return Promise.resolve();
  }
}

/**
 * Returns a stable, locally-generated delegate signer for voucher signing, persisted to
 * `localStorage` and keyed by the connected wallet address. Passing this as `voucherSigner`
 * to `BatchSettlementEvmScheme` means only the channel deposit (and later top-ups) prompts
 * the real wallet — every off-chain voucher after that signs in-memory, with no wallet popup.
 *
 * IMPORTANT: this key's address is baked into the channel's `payerAuthorizer` field (part of
 * the EIP-712 struct hashed into `channelId`) at deposit time. It must stay stable for the
 * life of an open channel — rotating it independently of the channel storage below would make
 * the SDK compute a different channelId and silently open an unwanted new channel. Bounded
 * risk: this key can only sign vouchers up to the currently escrowed deposit (never pull in
 * additional funds) and can request a cooperative refund, which returns funds to the real
 * wallet, not an attacker — same plaintext-localStorage trust model as the channel state below.
 */
function getOrCreateVoucherSigner(walletAddress: string) {
  const storageKey = `x402-voucher-signer:${walletAddress.toLowerCase()}`;
  let privateKey = window.localStorage.getItem(storageKey) as `0x${string}` | null;
  if (!privateKey) {
    privateKey = generatePrivateKey();
    window.localStorage.setItem(storageKey, privateKey);
  }
  return privateKeyToAccount(privateKey);
}

// Floor for channel deposits/top-ups, in USDC atomic units (6 decimals) — $0.50.
// The SDK's own default (depositMultiplier x per-message ceiling) tracks whatever the
// ceiling happens to be, currently ~$0.003/message, so it sizes deposits at ~1-3 cents:
// enough for only ~5 messages worst-case before another on-chain top-up (a real tx, a
// real wallet-adjacent wait) is needed. $0.50 comfortably covers a full multi-message
// session (100s of messages even at worst-case per-message pricing) while keeping the
// number small on the two axes that actually matter for this app: it's the blast radius
// of the localStorage voucher-signer above if it ever leaks (bounded to this amount,
// never more), and the capital a user has locked up if the server stops cooperating and
// they have to wait out withdrawDelay to exit unilaterally. Both are trivial at $0.50;
// neither improves by going lower, so lower just buys more top-up friction for no benefit.
const MINIMUM_DEPOSIT_ATOMIC = 500_000n;

/**
 * Custom deposit sizing: always deposit/top-up to at least `MINIMUM_DEPOSIT_ATOMIC`,
 * regardless of the SDK's default multiplier-of-ceiling formula — see the constant's
 * comment for why a fixed floor is the right lever here, not `depositPolicy.depositMultiplier`
 * (which would still scale with the ceiling rather than decoupling from it).
 * `minimumDepositAmount` is the true minimum the SDK needs for the top-up in progress; the
 * SDK requires the returned amount be >= it, so it's respected as a floor of its own.
 */
function depositStrategy(context: BatchSettlementDepositStrategyContext): string {
  const required = BigInt(context.minimumDepositAmount);
  return (required > MINIMUM_DEPOSIT_ATOMIC ? required : MINIMUM_DEPOSIT_ATOMIC).toString();
}

/**
 * Turn a non-OK payment response into a user-facing message. Batch-settlement's
 * `channel_busy` is a transient, self-healing per-channel lock — the server holds it across
 * a single message's verify→settle to serialize requests on one channel, and the x402 client
 * SDK does NOT auto-recover from it — so it warrants an actionable "wait and retry" line
 * rather than dumping the raw reason code. Any other reason keeps the informative default.
 */
function describePaymentError(status: number, body: string): string {
  let errorCode: string | undefined;
  try {
    errorCode = (JSON.parse(body) as { error?: string }).error;
  } catch {
    // Non-JSON body — fall through to the generic message.
  }
  if (errorCode?.includes("channel_busy")) {
    return "Your previous message is still being settled on-chain. Please wait a few seconds and send it again.";
  }
  return `Request failed: ${status} - ${body}`;
}

export interface UseX402ChatResult {
  sendMessage: (prompt: X402ChatMessage[]) => Promise<X402ChatResponse>;
  status: X402GenerationStatus;
  error: string | null;
  paymentReceipt: X402PaymentReceipt | null;
  reset: () => void;
  isReady: boolean;
  /**
   * The network this hook will actually pay on: the caller's preferred `network` when the
   * agent offers it, otherwise whichever floor network it does offer (see
   * `negotiateNetwork`). Equals `network` until the agent has been probed. Callers must
   * switch the wallet to THIS network, not to their preferred one.
   */
  paymentNetwork: string;
}

/**
 * @param network - Preferred CAIP-2 network for the channel (e.g. "eip155:10"). Used when the
 *   agent offers it; otherwise the hook negotiates down to a network the agent does offer and
 *   reports it as `paymentNetwork`.
 * @param agentUrl - The llm/v1 agent endpoint to pay and call. Defaults to fretchen's
 *   own endpoint (`DEFAULT_LLM_AGENT_URL`); pass any other llm/v1 agent to target it.
 *   Channel state in localStorage is keyed per-origin, so switching agents is isolated.
 */
export function useX402Chat(network: string, agentUrl: string = DEFAULT_LLM_AGENT_URL): UseX402ChatResult {
  const { data: walletClient } = useWalletClient();
  const { isConnected } = useAccount();

  const [status, setStatus] = useState<X402GenerationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<X402PaymentReceipt | null>(null);
  // The negotiated result, tagged with the inputs it was computed from. Tagging lets
  // `paymentNetwork` be derived during render, so switching agent or preference falls back
  // to the new preferred network immediately rather than briefly reporting a stale one.
  const [negotiated, setNegotiated] = useState<{ agentUrl: string; preferred: string; network: string } | null>(null);
  const paymentNetwork =
    negotiated?.agentUrl === agentUrl && negotiated?.preferred === network ? negotiated.network : network;

  // Probe the agent up front so the UI (and the caller's chain switch) knows which network
  // will be paid before the user hits send. Leaves the preferred network in place when the
  // agent can't be read — sendMessage negotiates again for real and reports any mismatch.
  useEffect(() => {
    let cancelled = false;
    void probeAccepts(agentUrl).then((accepts) => {
      if (cancelled) return;
      const result = negotiateNetwork(accepts, network);
      if (result) setNegotiated({ agentUrl, preferred: network, network: result });
    });
    return () => {
      cancelled = true;
    };
  }, [agentUrl, network]);

  const isReady = isConnected && !!walletClient;

  const sendMessage = useCallback(
    async (prompt: X402ChatMessage[]): Promise<X402ChatResponse> => {
      if (!walletClient) {
        throw new Error("Wallet not connected");
      }

      // Re-negotiate at send time rather than trusting the effect's result: it may not have
      // resolved yet, and the agent's offer can change between page load and sending.
      const accepts = await probeAccepts(agentUrl);
      const resolved = negotiateNetwork(accepts, network);
      if (accepts && !resolved) {
        const offered = accepts.map((a) => a.network).filter(Boolean) as string[];
        throw new Error(
          `Agent ${agentUrl} does not offer a network this site can pay on. ` +
            `It offers: ${offered.join(", ") || "nothing readable"}; this site pays on ` +
            `${LLM_V1_FLOOR.networks.join(", ")} via ${LLM_V1_FLOOR.scheme}. Choose a different agent.`,
        );
      }
      // `accepts === null` means the agent wasn't readable (CORS, offline). Don't block on
      // that — proceed on the preferred network and let the real 402 be the judge.
      const payNetwork = resolved ?? network;
      setNegotiated({ agentUrl, preferred: network, network: payNetwork });

      // A readContract-capable client is required: batch-settlement's corrective-402
      // recovery reads channel state on-chain, unlike the exact scheme. Resolved here, not
      // via the hook, because the network is only known after negotiating.
      const publicClient = getConfiguredPublicClient(payNetwork);
      if (!publicClient) {
        throw new Error(`No public client for network ${payNetwork}`);
      }

      setStatus("awaiting-signature");
      setError(null);
      // Don't clear paymentReceipt here: it represents the currently-open channel's
      // deposit tx, which stays valid across every message until the channel closes.
      // Voucher-only settlements report transaction: "" (see extraction below), so
      // clearing here would blank the link on every message after the first.

      try {
        // === Dynamic imports (browser-only, like the notebook) ===
        const { x402Client, wrapFetchWithPayment, x402HTTPClient } = await import("@x402/fetch");
        const { toClientEvmSigner } = await import("@x402/evm");
        const { BatchSettlementEvmScheme } = await import("@x402/evm/batch-settlement/client");

        // === Signer: wagmi WalletClient adapter wrapped so readContract exists ===
        const signerInput = {
          address: walletClient.account.address,
          signTypedData: walletClient.signTypedData.bind(walletClient),
        };
        const signer = toClientEvmSigner(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument -- viem/x402 signer interfaces differ slightly
          signerInput as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument -- wagmi public client satisfies the readContract dep
          publicClient as any,
        );

        // === Batch-settlement scheme (no register helper) + localStorage channel store ===
        const storage = new WebStorageClientChannelStorage(window.localStorage);
        // Delegate voucher signing to a persisted local key so only the deposit/top-up
        // prompts the real wallet — see getOrCreateVoucherSigner's doc comment.
        const voucherSigner = getOrCreateVoucherSigner(walletClient.account.address);
        const scheme = new BatchSettlementEvmScheme(signer, { storage, voucherSigner, depositStrategy });

        const client = new x402Client();
        // `payNetwork` is a CAIP-2 id (e.g. "eip155:10"); register's type wants the literal
        // `${string}:${string}` shape, which every CAIP-2 value satisfies.
        client.register(payNetwork as `${string}:${string}`, scheme);

        const fetchWithPayment = wrapFetchWithPayment(fetch, client);

        // First bare request → 402 → SDK opens channel (deposit) or signs a voucher → retries.
        // Wrapped in try/catch as defense-in-depth (see notebook: a client-side crash could
        // once mask a successful settlement; the underlying facilitator bug is fixed).
        const response = await fetchWithPayment(agentUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // OpenAI chat-completions body. `model` must be one the agent advertises in its
          // openapi.json (mistral-large-latest for fretchen's default agent).
          body: JSON.stringify({ model: LLM_MODEL, messages: prompt }),
        });

        setStatus("processing");

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(describePaymentError(response.status, errorText));
        }

        const result = (await response.json()) as X402ChatResponse;

        // === Extract settlement receipt (deposit tx on the first message, "" for vouchers) ===
        try {
          const httpClient = new x402HTTPClient(client);
          const receipt = httpClient.getPaymentSettleResponse((name: string) => response.headers.get(name));
          if (receipt?.transaction) {
            setPaymentReceipt({ transaction: receipt.transaction, network: receipt.network });
          }
        } catch {
          // Receipt extraction is optional — continue without it
        }

        setStatus("success");
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setStatus("error");
        throw err;
      }
    },
    [walletClient, network, agentUrl],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setPaymentReceipt(null);
  }, []);

  return { sendMessage, status, error, paymentReceipt, reset, isReady, paymentNetwork };
}

export default useX402Chat;
