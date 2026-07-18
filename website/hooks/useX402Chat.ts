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

import { useState, useCallback } from "react";
import { useWalletClient, useAccount } from "wagmi";
import { useConfiguredPublicClient } from "./useConfiguredPublicClient";
import type { X402ChatMessage, X402ChatResponse, X402PaymentReceipt, X402GenerationStatus } from "../types/x402";
// Type-only import — erased at compile time, so no @x402 runtime is pulled into SSR.
import type { ClientChannelStorage, BatchSettlementClientContext } from "@x402/evm/batch-settlement/client";

// Endpoint of the batch-settlement chat function (override for local dev with
// PUBLIC_ENV__LLM_X402_ENDPOINT=http://localhost:8085).
const X402_LLM_URL =
  (import.meta.env.PUBLIC_ENV__LLM_X402_ENDPOINT as string | undefined) ??
  "https://mypersonaljscloudivnad9dy-llmx402.functions.fnc.fr-par.scw.cloud";

/**
 * Client-side `ClientChannelStorage` backed by the Web Storage API. Persists channel
 * state to `localStorage` so an open channel survives a page reload (the browser
 * equivalent of the notebook's file/localStorage storage). Channel context is all
 * strings, so plain JSON round-trips cleanly.
 */
class WebStorageClientChannelStorage implements ClientChannelStorage {
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

export interface UseX402ChatResult {
  sendMessage: (prompt: X402ChatMessage[]) => Promise<X402ChatResponse>;
  status: X402GenerationStatus;
  error: string | null;
  paymentReceipt: X402PaymentReceipt | null;
  reset: () => void;
  isReady: boolean;
}

/**
 * @param network - CAIP-2 network the channel operates on (e.g. "eip155:84532").
 *   Determines the public client used for on-chain channel reads and the scheme
 *   registration network.
 */
export function useX402Chat(network: string): UseX402ChatResult {
  const { data: walletClient } = useWalletClient();
  const { isConnected } = useAccount();
  // A readContract-capable client is required: batch-settlement's corrective-402
  // recovery reads channel state on-chain, unlike the exact scheme.
  const publicClient = useConfiguredPublicClient(network);

  const [status, setStatus] = useState<X402GenerationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<X402PaymentReceipt | null>(null);

  const isReady = isConnected && !!walletClient && !!publicClient;

  const sendMessage = useCallback(
    async (prompt: X402ChatMessage[]): Promise<X402ChatResponse> => {
      if (!walletClient) {
        throw new Error("Wallet not connected");
      }
      if (!publicClient) {
        throw new Error(`No public client for network ${network}`);
      }

      setStatus("awaiting-signature");
      setError(null);
      setPaymentReceipt(null);

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
        const scheme = new BatchSettlementEvmScheme(signer, { storage });

        const client = new x402Client();
        client.register(network, scheme);

        // === Validating fetch: reject before signing if the server doesn't offer our network ===
        const validatingFetch: typeof fetch = async (input, init) => {
          const response = await fetch(input, init);
          if (response.status === 402) {
            const paymentRequiredHeader = response.headers.get("Payment-Required");
            if (paymentRequiredHeader) {
              try {
                const decoded = JSON.parse(atob(paymentRequiredHeader)) as {
                  accepts?: Array<{ network?: string }>;
                };
                const offered = decoded.accepts?.map((a) => a.network).filter(Boolean) as string[] | undefined;
                if (offered && offered.length > 0 && !offered.includes(network)) {
                  throw new Error(
                    `Server does not offer ${network}. Offered: ${offered.join(", ")}. ` +
                      `This could indicate a backend configuration error.`,
                  );
                }
              } catch (parseError) {
                if (parseError instanceof Error && parseError.message.includes("does not offer")) {
                  throw parseError;
                }
                // Silently continue if header parsing fails — the request will proceed
              }
            }
          }
          return response;
        };

        const fetchWithPayment = wrapFetchWithPayment(validatingFetch, client);

        // First bare request → 402 → SDK opens channel (deposit) or signs a voucher → retries.
        // Wrapped in try/catch as defense-in-depth (see notebook: a client-side crash could
        // once mask a successful settlement; the underlying facilitator bug is fixed).
        const response = await fetchWithPayment(X402_LLM_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { prompt } }),
        });

        setStatus("processing");

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Request failed: ${response.status} - ${errorText}`);
        }

        const result = (await response.json()) as X402ChatResponse;

        // === Extract settlement receipt (deposit tx on the first message, "" for vouchers) ===
        try {
          const httpClient = new x402HTTPClient(client);
          const receipt = httpClient.getPaymentSettleResponse((name: string) => response.headers.get(name));
          if (receipt) {
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
    [walletClient, publicClient, network],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setPaymentReceipt(null);
  }, []);

  return { sendMessage, status, error, paymentReceipt, reset, isReady };
}

export default useX402Chat;
