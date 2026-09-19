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
import { useWalletClient } from "wagmi";
import { getConfiguredPublicClient } from "./useConfiguredPublicClient";
import { useIsWalletConnected } from "./useIsWalletConnected";
import { probeAccepts, negotiateNetwork, LLM_V1_FLOOR } from "./x402Discovery";
import { createPaidFetch, type PaidFetch } from "../utils/x402PaidFetch";
import type {
  X402ChatMessage,
  X402ChatResponse,
  X402PaymentReceipt,
  X402GenerationStatus,
  X402Tool,
} from "../types/x402";

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

/** Additive: offering tools is opt-in per call, so every existing caller is unaffected. */
export interface SendMessageOptions {
  tools?: X402Tool[];
  tool_choice?: "auto" | "none";
}

export interface UseX402ChatResult {
  sendMessage: (prompt: X402ChatMessage[], options?: SendMessageOptions) => Promise<X402ChatResponse>;
  /** Pays for something other than a chat message on the same channel — see the tools in
   *  `website/tools/`. Throws `PaymentError` when the payment fails. */
  paidFetch: PaidFetch;
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
  const isConnected = useIsWalletConnected();

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
    async (prompt: X402ChatMessage[], options?: SendMessageOptions): Promise<X402ChatResponse> => {
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
        // The channel, the signer, the deposit strategy and the drained-channel recovery all live
        // in `utils/x402PaidFetch.ts` — /assistent's paid tools spend on this same channel, so the
        // assembly could not stay private to the chat.
        const { paidFetch, readReceipt } = await createPaidFetch({
          walletClient,
          publicClient,
          network: payNetwork,
          onTopUp: () => setStatus("topping-up"),
        });

        // First bare request → 402 → SDK opens channel (deposit) or signs a voucher → retries.
        const response = await paidFetch(agentUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // OpenAI chat-completions body. `model` must be one the agent advertises in its
          // openapi.json (mistral-large-latest for fretchen's default agent). `tools` is
          // spread in only when offered, so a caller that never passes `options` sends the
          // exact body it always has — no behaviour change for existing callers.
          body: JSON.stringify({
            model: LLM_MODEL,
            messages: prompt,
            ...(options?.tools ? { tools: options.tools, tool_choice: options.tool_choice ?? "auto" } : {}),
          }),
        });

        setStatus("processing");

        const result = (await response.json()) as X402ChatResponse;

        // The deposit tx on the message that opened the channel; nothing on the vouchers after it.
        const receipt = readReceipt(response);
        if (receipt) {
          setPaymentReceipt(receipt);
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

  /**
   * A `fetch` that pays on **this chat's channel**, for the paid tools `/assistent` offers during
   * a turn (`scw_js/search_api.ts` sells as the same receiver, so the channel is the same one).
   *
   * Bound to `paymentNetwork`, not to the caller's preference: registering a different network
   * would compute a different `channelId` and open a second channel the user has to fund again.
   *
   * No status juggling here — a tool failure is the model's to report, not the chat UI's, so this
   * deliberately leaves `status` alone and lets `PaymentError` reach the caller.
   */
  const paidFetch = useCallback<PaidFetch>(
    async (input, init) => {
      if (!walletClient) {
        throw new Error("Wallet not connected");
      }
      const publicClient = getConfiguredPublicClient(paymentNetwork);
      if (!publicClient) {
        throw new Error(`No public client for network ${paymentNetwork}`);
      }
      const client = await createPaidFetch({ walletClient, publicClient, network: paymentNetwork });
      return client.paidFetch(input, init);
    },
    [walletClient, paymentNetwork],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setPaymentReceipt(null);
  }, []);

  return { sendMessage, paidFetch, status, error, paymentReceipt, reset, isReady, paymentNetwork };
}

export default useX402Chat;
