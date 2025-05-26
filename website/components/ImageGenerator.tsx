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
  apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud",
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
    chainId: chain.id,
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
        value: mintPrice,
        chainId: chain.id,
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

      onSuccess?.(newTokenId, imageUrl);
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
    <div className={styles.imageGen.cardLayout}>
      {/* Linke Spalte: Eingabe und Steuerung */}
      <div className={styles.imageGen.column}>
        <h2 className={styles.imageGen.columnHeading}>Create Your Image</h2>

        {/* Schritte als nummerierte Karten */}
        <div className={styles.imageGen.stepsList}>
          <div className={styles.imageGen.stepItem}>
            <span className={styles.imageGen.stepNumber}>1</span>
            <span>Enter a descriptive prompt below</span>
          </div>

          <div className={styles.imageGen.stepItem}>
            <span className={styles.imageGen.stepNumber}>2</span>
            <span>Click &quot;Mint & Generate&quot; (costs ~10¢ in ETH)</span>
          </div>

          <div className={styles.imageGen.stepItem}>
            <span className={styles.imageGen.stepNumber}>3</span>
            <span>Wait ~30s for your image to appear</span>
          </div>
        </div>

        {/* Eingabeformular */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your image in detail... (e.g. 'A futuristic city skyline at sunset with flying cars')"
          disabled={isLoading || mintingStatus !== "idle"}
          className={`${styles.imageGen.promptTextarea} ${isLoading || mintingStatus !== "idle" ? css({ opacity: 0.7 }) : ""}`}
        />

        {/* Status-Anzeige */}
        {mintingStatus !== "idle" && (
          <div className={styles.imageGen.statusIndicator}>
            <div className={styles.imageGen.statusRow}>
              <div className={styles.imageGen.spinner}></div>
              <span>{mintingStatus === "minting" ? "Creating your NFT..." : "Generating your image..."}</span>
            </div>
            <div className={styles.imageGen.statusText}>
              {mintingStatus === "minting"
                ? "Confirm the transaction in your wallet"
                : "This may take up to 30 seconds"}
            </div>
          </div>
        )}

        {/* Mint-Button */}
        <button
          onClick={handleMintAndGenerate}
          disabled={isLoading}
          className={`${styles.button} ${
            isLoading || !prompt.trim() || !isConnected || !address ? css({ opacity: 0.7, cursor: "not-allowed" }) : ""
          }`}
        >
          {isLoading ? (mintingStatus === "minting" ? "Creating NFT..." : "Generating Image...") : "Mint & Generate"}
        </button>

        {/* Fehlermeldungen */}
        {!isConnected && (
          <p className={css({ fontSize: "sm", color: "#666", margin: "xs 0" })}>Connect your wallet to create an NFT</p>
        )}
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>

      {/* Rechte Spalte: Bildvorschau und NFT-Details */}
      <div className={styles.imageGen.column}>
        <h2 className={styles.imageGen.columnHeading}>Your Generated Image</h2>

        {/* Vereinfachte Bildvorschau */}
        <div className={styles.imageGen.imagePreview}>
          {/* Bild oder Platzhalter */}
          {generatedImageUrl ? (
            <img src={generatedImageUrl} alt="Generated" className={styles.imageGen.generatedImage} />
          ) : (
            <>
              {mintingStatus !== "idle" ? (
                <p className={css({ fontWeight: "medium" })}>
                  {mintingStatus === "minting" ? "Creating NFT..." : "Generating your image..."}
                </p>
              ) : (
                <p>Your image will appear here</p>
              )}
            </>
          )}
        </div>

        {/* NFT-Details */}
        {tokenId && (
          <div className={styles.successMessage}>
            <h3 className={css({ margin: 0, fontSize: "md" })}>🎉 NFT successfully created!</h3>
            <p className={css({ margin: "xs 0" })}>
              <strong>Token ID:</strong> {tokenId.toString()}
            </p>
            <a
              href={`https://optimistic.etherscan.io/token/${genAiNFTContractConfig.address}?a=${tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              View on Etherscan →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageGenerator;
