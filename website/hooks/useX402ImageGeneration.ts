/**
 * x402 Image Generation Hook
 *
 * Simplified hook following the x402 Quickstart pattern.
 * https://x402.gitbook.io/x402/getting-started/quickstart-for-buyers
 */

import { useState, useCallback } from "react";
import { useWalletClient, useAccount } from "wagmi";
import type { X402GenImgRequest, X402GenImgResponse, X402PaymentReceipt, X402GenerationStatus } from "../types/x402";

// API URL from environment
const X402_API_URL = import.meta.env.PUBLIC_ENV___IMAGE_URL;

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
        console.log("[x402] Loading x402 packages...");
        const { x402Client, wrapFetchWithPayment, x402HTTPClient } = await import("@x402/fetch");
        const { registerExactEvmScheme } = await import("@x402/evm/exact/client");
        console.log("[x402] Packages loaded successfully");

        // === Create signer adapter for wagmi WalletClient ===
        // The notebook uses privateKeyToAccount which returns { address, signTypedData }
        // We adapt wagmi's walletClient to match this interface
        const signer = {
          address: walletClient.account.address,
          signTypedData: walletClient.signTypedData.bind(walletClient),
        };
        console.log("[x402] Signer created:", signer.address);

        // === Setup x402 client (exactly like Quickstart) ===
        const client = new x402Client();
        registerExactEvmScheme(client, { signer: signer as any });
        console.log("[x402] x402Client created and EVM scheme registered");

        // === Wrap fetch with payment handling ===
        const fetchWithPayment = wrapFetchWithPayment(fetch, client);
        console.log("[x402] fetchWithPayment wrapper created");

        // === Make the paid request ===
        console.log("[x402] Making request to:", X402_API_URL);
        console.log("[x402] Request body:", JSON.stringify(request));

        const response = await fetchWithPayment(X402_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        console.log("[x402] Response received, status:", response.status);
        setStatus("processing");

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[x402] Error response:", errorText);
          throw new Error(`Request failed: ${response.status} - ${errorText}`);
        }

        const result: X402GenImgResponse = await response.json();
        console.log("[x402] Success! TokenId:", result.tokenId);

        // === Extract payment receipt (like Quickstart step 3) ===
        try {
          const httpClient = new x402HTTPClient(client);
          const receipt = httpClient.getPaymentSettleResponse(
            (name: string) => response.headers.get(name)
          );
          if (receipt) {
            setPaymentReceipt({
              transaction: receipt.transaction,
              network: receipt.network,
            });
            console.log("[x402] Payment settled:", receipt.transaction);
          }
        } catch (e) {
          console.warn("[x402] Could not extract payment receipt:", e);
        }

        setStatus("success");
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("[x402] Error:", errorMessage, err);
        setError(errorMessage);
        setStatus("error");
        throw err;
      }
    },
    [walletClient]
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
