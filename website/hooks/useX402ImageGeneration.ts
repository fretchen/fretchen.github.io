/**
 * x402 Image Generation Hook
 *
 * Simplified hook following the x402 Quickstart pattern.
 * https://x402.gitbook.io/x402/getting-started/quickstart-for-buyers
 */

import { useState, useCallback } from "react";
import { useWalletClient, useAccount } from "wagmi";
import type { X402GenImgRequest, X402GenImgResponse, X402PaymentReceipt, X402GenerationStatus } from "../types/x402";

// API URL from environment (fallback to env var if not set)
const X402_API_URL =
  import.meta.env.PUBLIC_ENV__IMAGE_URL ||
  "https://mypersonaljscloudivnad9dy-genimgx402token.functions.fnc.fr-par.scw.cloud";
// const X402_API_URL = import.meta.env.PUBLIC_ENV__IMAGE_URL;

export interface UseX402ImageGenerationResult {
  generateImage: (request: X402GenImgRequest) => Promise<X402GenImgResponse>;
  status: X402GenerationStatus;
  error: string | null;
  paymentReceipt: X402PaymentReceipt | null;
  reset: () => void;
  isReady: boolean;
}

export function useX402ImageGeneration(): UseX402ImageGenerationResult {
  const { data: walletClient } = useWalletClient();
  const { isConnected } = useAccount();

  const [status, setStatus] = useState<X402GenerationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<X402PaymentReceipt | null>(null);

  // Ready when wallet is connected
  const isReady = isConnected && !!walletClient;

  const generateImage = useCallback(
    async (request: X402GenImgRequest): Promise<X402GenImgResponse> => {
      if (!walletClient) {
        throw new Error("Wallet not connected");
      }

      setStatus("awaiting-signature");
      setError(null);
      setPaymentReceipt(null);

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
        const client = new x402Client();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- x402 SDK expects specific signer interface
        registerExactEvmScheme(client, { signer: signer as any });

        // === Make the paid request ===
        // Remove expectedChainId from request body (it's only for client-side validation)
        // Keep network in the body - backend uses it to filter 402 response
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
                const decoded = JSON.parse(atob(paymentRequiredHeader));
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

        const result: X402GenImgResponse = await response.json();

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
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setStatus("error");
        throw err;
      }
    },
    [walletClient],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setPaymentReceipt(null);
  }, []);

  return {
    generateImage,
    status,
    error,
    paymentReceipt,
    reset,
    isReady,
  };
}

export default useX402ImageGeneration;
