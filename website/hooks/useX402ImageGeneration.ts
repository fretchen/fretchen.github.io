/**
 * x402 Image Generation Hook
 *
 * Simplified hook following the x402 Quickstart pattern.
 * https://x402.gitbook.io/x402/getting-started/quickstart-for-buyers
 */

import { useState, useCallback } from "react";
import { useWalletClient } from "wagmi";
import { useIsWalletConnected } from "./useIsWalletConnected";
import { buildStablecoinAllowedAssets } from "./x402SpendControls";
import { DEFAULT_CURRENCY, preferCurrency, type PaymentCurrency } from "./x402Currency";
import type { X402GenImgRequest, X402GenImgResponse, X402PaymentReceipt, X402GenerationStatus } from "../types/x402";
import { normalizeImageResponse, type X402ImageResult } from "./x402ImageResponse";

// API URL from environment (fallback to env var if not set)
const X402_API_URL =
  (import.meta.env.PUBLIC_ENV__IMAGE_URL as string | undefined) ??
  "https://mypersonaljscloudivnad9dy-genimgx402token.functions.fnc.fr-par.scw.cloud";

/** The normalized result, plus the currency it was paid in — returned rather than only kept as
 *  state, because a caller reading it right after `await generateImage()` would see stale state. */
export type X402PaidImageResult = X402ImageResult & { paidCurrency: PaymentCurrency | null };

export interface UseX402ImageGenerationResult {
  /**
   * Resolves to the *normalized* result, not the raw envelope — see `x402ImageResponse.ts`.
   * `tokenId` is optional there because a 200 does not guarantee the NFT was minted.
   */
  generateImage: (request: X402GenImgRequest) => Promise<X402PaidImageResult>;
  status: X402GenerationStatus;
  error: string | null;
  paymentReceipt: X402PaymentReceipt | null;
  /** The currency the last payment was actually made in — the preference, unless the seller did
   *  not offer it on this network and the selector fell back. Null before any payment. */
  paidCurrency: PaymentCurrency | null;
  reset: () => void;
  isReady: boolean;
}

/**
 * @param currency - The stablecoin to pay with when the seller offers it on the request's network
 *   (see `x402Currency.ts`). The caller picks the network; this only picks between the tokens
 *   offered on it.
 */
export function useX402ImageGeneration(currency: PaymentCurrency = DEFAULT_CURRENCY): UseX402ImageGenerationResult {
  const { data: walletClient } = useWalletClient();
  const isConnected = useIsWalletConnected();

  const [status, setStatus] = useState<X402GenerationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<X402PaymentReceipt | null>(null);
  const [paidCurrency, setPaidCurrency] = useState<PaymentCurrency | null>(null);

  // Ready when wallet is connected
  const isReady = isConnected && !!walletClient;

  const generateImage = useCallback(
    async (request: X402GenImgRequest): Promise<X402PaidImageResult> => {
      if (!walletClient) {
        throw new Error("Wallet not connected");
      }

      setStatus("awaiting-signature");
      setError(null);
      setPaymentReceipt(null);
      setPaidCurrency(null);

      try {
        // === Dynamic imports (browser-only, like the notebook) ===
        const { x402Client, wrapFetchWithPayment, x402HTTPClient } = await import("@x402/fetch");
        const { registerExactEvmScheme } = await import("@x402/evm/exact/client");

        // === Create signer adapter for wagmi WalletClient ===
        // The notebook uses privateKeyToAccount which returns { address, signTypedData }
        // We adapt wagmi's walletClient to match this interface
        const signer = {
          address: walletClient.account.address,
          signTypedData: walletClient.signTypedData.bind(walletClient),
        };

        // === Setup x402 client (exactly like Quickstart) ===
        // The selector picks the entry in `currency` among what the spend controls let through,
        // and reports what it picked — the seller lists both tokens on Base.
        let picked: PaymentCurrency | null = null;
        const client = new x402Client(
          preferCurrency(currency, (paid) => {
            picked = paid;
            setPaidCurrency(paid);
          }),
        );
        // Explicitly allowlist every stablecoin this site pays with — the SDK's default spend
        // controls reject Optimism USDC and all EURC otherwise. See x402SpendControls.ts.
        client.setSpendControls({ allowedAssets: buildStablecoinAllowedAssets() });

        registerExactEvmScheme(client, { signer: signer });

        // === Make the paid request ===
        // Remove expectedChainId from request body (it's only for client-side validation)
        // Keep network in the body - backend uses it to filter 402 response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { expectedChainId, ...requestBody } = request;

        // === Create a validating fetch wrapper ===
        // This validates the chain from the 402 response BEFORE signing,
        // avoiding an extra preflight request
        const validatingFetch: typeof fetch = async (input, init) => {
          const response = await fetch(input, init);

          // Validate chain from 402 response before x402 SDK triggers signing
          if (response.status === 402 && request.network) {
            const paymentRequiredHeader = response.headers.get("Payment-Required");
            if (paymentRequiredHeader) {
              try {
                const decoded = JSON.parse(atob(paymentRequiredHeader)) as { accepts?: Array<{ network?: string }> };
                const serverNetwork = decoded.accepts?.[0]?.network;

                if (serverNetwork && serverNetwork !== request.network) {
                  throw new Error(
                    `Network mismatch! Selected ${request.network} but server requires ${serverNetwork}. ` +
                      `This could indicate a backend configuration error.`,
                  );
                }
              } catch (parseError) {
                if (parseError instanceof Error && parseError.message.includes("Network mismatch")) {
                  throw parseError;
                }
                // Silently continue if header parsing fails - the request will proceed
              }
            }
          }

          return response;
        };

        // Wrap the validating fetch with payment handling
        const fetchWithPayment = wrapFetchWithPayment(validatingFetch, client);

        // Make the paid request (single request flow)
        const response = await fetchWithPayment(X402_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        setStatus("processing");

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Request failed: ${response.status} - ${errorText}`);
        }

        const result = normalizeImageResponse((await response.json()) as X402GenImgResponse);

        // === Extract payment receipt (like Quickstart step 3) ===
        try {
          const httpClient = new x402HTTPClient(client);
          const receipt = httpClient.getPaymentSettleResponse((name: string) => response.headers.get(name));
          if (receipt) {
            setPaymentReceipt({
              transaction: receipt.transaction,
              network: receipt.network,
            });
          }
        } catch {
          // Payment receipt extraction is optional - continue without it
        }

        setStatus("success");
        return { ...result, paidCurrency: picked };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setStatus("error");
        throw err;
      }
    },
    [walletClient, currency],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setPaymentReceipt(null);
    setPaidCurrency(null);
  }, []);

  return {
    generateImage,
    status,
    error,
    paymentReceipt,
    paidCurrency,
    reset,
    isReady,
  };
}

export default useX402ImageGeneration;
