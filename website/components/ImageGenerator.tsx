import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { getChain, getGenAiNFTContractConfig } from "../utils/getChain";
import { css } from "../styled-system/css";
import { TransactionReceipt, MintingStatus } from "../types/blockchain";
import * as styles from "../layouts/styles";

export interface ImageGeneratorProps {
  apiUrl?: string;
  onSuccess?: (tokenId: bigint, imageUrl: string) => void;
  onError?: (error: string) => void;
}

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
      const errorMsg = "Please connect your wallet first";
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
      const errorMsg = "Could not load mint price from contract";
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
        throw new Error("Could not extract token ID from transaction");
      }

      const tokenIdHex = transferEvent.topics[3];
      const newTokenId = BigInt(tokenIdHex);
      console.log("Minted token ID:", newTokenId);
      setTokenId(newTokenId);

      // Proceed with image generation
      setMintingStatus("generating");
      const response = await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${newTokenId}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Image generation completed", data);
      const imageUrl = data.image_url;
      setGeneratedImageUrl(imageUrl);
      setMintingStatus("idle");

      // Erfolgreich - rufe Callback auf und reset Form
      onSuccess?.(newTokenId, imageUrl);

      // Reset form für nächste Erstellung
      setTimeout(() => {
        setPrompt("");
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
          <h3 className={styles.imageGen.compactTitle}>Create NFT</h3>
          <span className={styles.imageGen.compactSubtitle}>
            Enter prompt and generate your unique image (~10¢ in ETH)
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

          <button
            onClick={handleMintAndGenerate}
            disabled={isLoading || !prompt.trim() || !isConnected}
            className={`${styles.imageGen.compactButton} ${
              isLoading || !prompt.trim() || !isConnected ? styles.imageGen.compactButtonDisabled : ""
            }`}
          >
            {isLoading ? (mintingStatus === "minting" ? "Creating..." : "Generating...") : "🎨 Create NFT"}
          </button>
        </div>

        {/* Status-Anzeige */}
        {mintingStatus !== "idle" && (
          <div className={styles.imageGen.compactStatus}>
            <div className={styles.imageGen.spinner}></div>
            <span>{mintingStatus === "minting" ? "Creating your NFT..." : "Generating image..."}</span>
          </div>
        )}

        {!isConnected && <div className={styles.imageGen.compactError}>Connect your wallet to create an NFT</div>}

        {error && <div className={styles.imageGen.compactError}>{error}</div>}

        {/* Erfolgreiche Erstellung */}
        {tokenId && generatedImageUrl && (
          <div className={styles.successMessage}>
            <h4 className={css({ margin: 0, fontSize: "sm" })}>✅ NFT created successfully!</h4>
            <p className={css({ margin: "xs 0", fontSize: "sm" })}>
              Token ID: {tokenId.toString()} - Check your gallery below
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageGenerator;
