import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { getChain, getGenAiNFTContractConfig } from "../utils/getChain";
import { css } from "../styled-system/css";
import { TransactionReceipt, MintingStatus } from "../types/blockchain";
import { ImageGeneratorProps } from "../types/components";
import * as styles from "../layouts/styles";

// Helper function to wait for transaction confirmation
export const waitForTransaction = async (hash: `0x${string}`): Promise<TransactionReceipt> => {
  return new Promise<TransactionReceipt>((resolve, reject) => {
    const checkReceipt = async () => {
      try {
        const receipt = await window.ethereum.request({
          method: "eth_getTransactionReceipt",
          params: [hash],
        });
        if (receipt) {
          resolve(receipt as TransactionReceipt);
        } else {
          setTimeout(checkReceipt, 2000);
        }
      } catch (error) {
        reject(error);
      }
    };
    checkReceipt();
  });
};

export function ImageGenerator({
  apiUrl = "https://mypersonaljscloudivnad9dy-readnftv2.functions.fnc.fr-par.scw.cloud",
  onSuccess,
  onError,
}: ImageGeneratorProps) {
  const genAiNFTContractConfig = getGenAiNFTContractConfig();
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>();
  const [tokenId, setTokenId] = useState<bigint>();

  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<"1024x1024" | "1792x1024">("1024x1024");
  const [isLoading, setIsLoading] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<MintingStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Blockchain interaction
  const { address, isConnected } = useAccount();
  const chain = getChain();

  // Read mint price from contract
  const { data: mintPrice } = useReadContract({
    ...genAiNFTContractConfig,
    functionName: "mintPrice",
    args: [],
    ...(chain?.id && { chainId: chain.id }),
  });

  // Contract write operations
  const { writeContractAsync } = useWriteContract();

  const handleMintAndGenerate = async () => {
    if (!isConnected || !address) {
      const errorMsg = "Please connect your account first";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }
    if (!prompt.trim()) {
      const errorMsg = "Please enter a prompt";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }
    if (!mintPrice) {
      const errorMsg = "Could not load creation fee from system";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);
    setMintingStatus("minting");

    try {
      // Start minting with a temporary URI
      const tempUri = `ipfs://tempURI/${Date.now()}`;
      const txHash = await writeContractAsync({
        ...genAiNFTContractConfig,
        functionName: "safeMint",
        args: [tempUri],
        value: mintPrice as bigint,
        ...(chain?.id && { chainId: chain.id }),
      });

      console.log("Minting transaction sent:", txHash);
      const receipt = await waitForTransaction(txHash);

      // Extract Token ID from transfer event
      const transferEvent = receipt?.logs.find(
        (log) => log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      );

      if (!transferEvent || transferEvent.topics.length < 4) {
        throw new Error("Could not extract artwork ID from transaction");
      }

      const tokenIdHex = transferEvent.topics[3];
      const newTokenId = BigInt(tokenIdHex);
      console.log("Created artwork ID:", newTokenId);
      setTokenId(newTokenId);

      // Proceed with image generation
      setMintingStatus("generating");
      const response = await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${newTokenId}&size=${size}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Image generation completed", data);
      const imageUrl = data.image_url;
      setGeneratedImageUrl(imageUrl);
      setMintingStatus("idle");

      // Erstelle Metadaten-Objekt aus der API-Antwort
      const metadata = {
        name: `AI Generated Artwork #${newTokenId}`,
        description: `AI generated artwork based on the prompt: "${prompt}"`,
        image: imageUrl,
        external_url: data.metadata_url || "",
        attributes: [
          {
            trait_type: "Prompt",
            value: prompt,
          },
          {
            trait_type: "Generation Method",
            value: "AI Generated",
          },
        ],
      };

      // Erfolgreich - rufe Callback auf mit erweiterten Daten
      onSuccess?.(newTokenId, imageUrl, metadata);

      // Reset form für nächste Erstellung
      setTimeout(() => {
        setPrompt("");
        setSize("1024x1024");
        setGeneratedImageUrl(undefined);
        setTokenId(undefined);
        setError(null);
      }, 3000);
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMsg);
      setMintingStatus("error");
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.imageGen.compactLayout}>
      <div className={styles.imageGen.compactContainer}>
        <div className={styles.imageGen.compactHeader}>
          <h3 className={styles.imageGen.compactTitle}>Create Your Art</h3>
          <span className={styles.imageGen.compactSubtitle}>
            Describe what you want and generate your unique digital artwork (~10¢)
          </span>
        </div>

        <div className={styles.imageGen.compactForm}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your image in detail... (e.g., 'A futuristic city skyline at sunset')"
            disabled={isLoading || mintingStatus !== "idle"}
            className={styles.imageGen.compactTextarea}
          />

          <div className={styles.imageGen.compactFormRow}>
            <label className={styles.imageGen.compactLabel}>Format:</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as "1024x1024" | "1792x1024")}
              disabled={isLoading || mintingStatus !== "idle"}
              className={styles.imageGen.compactSelect}
            >
              <option value="1024x1024">Square (1024×1024)</option>
              <option value="1792x1024">Wide (1792×1024)</option>
            </select>

            <button
              onClick={handleMintAndGenerate}
              disabled={isLoading || !prompt.trim() || !isConnected}
              className={`${styles.imageGen.compactButton} ${
                isLoading || !prompt.trim() || !isConnected ? styles.imageGen.compactButtonDisabled : ""
              }`}
            >
              {isLoading ? (mintingStatus === "minting" ? "Creating..." : "Generating...") : "🎨 Create Art"}
            </button>
          </div>
        </div>

        {/* Status-Anzeige */}
        {mintingStatus !== "idle" && (
          <div className={styles.imageGen.compactStatus}>
            <div className={styles.spinner}></div>
            <span>{mintingStatus === "minting" ? "Creating your artwork..." : "Generating image..."}</span>
          </div>
        )}

        {!isConnected && <div className={styles.imageGen.compactError}>Connect your account to create artwork</div>}

        {error && <div className={styles.imageGen.compactError}>{error}</div>}

        {/* Erfolgreiche Erstellung */}
        {tokenId && generatedImageUrl && (
          <div className={styles.successMessage}>
            <h4 className={css({ margin: 0, fontSize: "sm" })}>✅ Artwork created successfully!</h4>
            <p className={css({ margin: "xs 0", fontSize: "sm" })}>
              ID: {tokenId.toString()} - Check your gallery below
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageGenerator;
