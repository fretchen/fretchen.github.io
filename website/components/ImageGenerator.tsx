import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { getChain, getGenAiNFTContractConfig } from "../utils/getChain";
import { css } from "../styled-system/css";
import { TransactionReceipt, MintingStatus } from "../types/blockchain";
import { ImageGeneratorProps } from "../types/components";
import * as styles from "../layouts/styles";
import InfoIcon from "./InfoIcon";
import { LocaleText } from "./LocaleText";
import { useLocale } from "../hooks/useLocale";
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
  const [isListed, setIsListed] = useState(false); // Default: not publicly listed
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
      // Start minting with a temporary URI and listing preference
      const tempUri = `ipfs://tempURI/${Date.now()}`;
      const txHash = await writeContractAsync({
        ...genAiNFTContractConfig,
        functionName: "safeMint",
        args: [tempUri, isListed], // Use the new safeMint(uri, isListed) function
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
          <h3 className={styles.imageGen.compactTitle}>
            🎨
            <LocaleText label="imagegen.title" />
          </h3>
          <span className={styles.imageGen.compactSubtitle}>
            <LocaleText label="imagegen.description" />
          </span>
        </div>

        <div className={styles.imageGen.compactForm}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={useLocale({ label: "imagegen.promptPlaceholder" })}
            disabled={isLoading || mintingStatus !== "idle"}
            className={styles.imageGen.compactTextarea}
          />

          <div className={styles.imageGen.controlBar}>
            <div className={styles.imageGen.optionsGroup}>
              <select
                id="imageSizeSelect"
                value={size}
                onChange={(e) => setSize(e.target.value as "1024x1024" | "1792x1024")}
                disabled={isLoading || mintingStatus !== "idle"}
                className={styles.imageGen.compactSelect}
                aria-label="Select image format for your artwork"
              >
                <option value="1024x1024">
                  <LocaleText label="imagegen.square" />
                </option>
                <option value="1792x1024">
                  <LocaleText label="imagegen.wide" />
                </option>
              </select>

              <label
                className={styles.nftCard.checkboxLabel}
                title={
                  isListed
                    ? "NFT will be publicly visible in the 'All Public Artworks' gallery"
                    : "NFT will remain unlisted from the 'All Public Artworks' gallery"
                }
              >
                <input
                  type="checkbox"
                  checked={isListed}
                  onChange={(e) => setIsListed(e.target.checked)}
                  disabled={isLoading || mintingStatus !== "idle"}
                  className={styles.nftCard.checkbox}
                />
                <LocaleText label="imagegen.listed" />
              </label>
            </div>

            <button
              onClick={handleMintAndGenerate}
              disabled={isLoading || !prompt.trim() || !isConnected}
              className={`${styles.imageGen.compactButton} ${
                isLoading || !prompt.trim() || !isConnected ? styles.imageGen.compactButtonDisabled : ""
              }`}
              title={useLocale({ label: "imagegen.mintingInfo" })}
              aria-describedby="create-artwork-info"
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner}></div>
                  {mintingStatus === "minting" ? "Creating..." : "Generating..."}
                </>
              ) : (
                <>
                  🎨 <LocaleText label="imagegen.createArtwork" />
                  <InfoIcon size="xs" className={css({ ml: "1", opacity: "0.7" })} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Contract details under Create Artwork button */}
        <div className={css({ mt: "2", fontSize: "xs", color: "gray.600", textAlign: "center" })}>
          Powered by{" "}
          <a
            href="https://optimism.io"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Learn more about Optimism (opens in new tab)"
            className={css({ color: "blue.600", textDecoration: "underline", _hover: { color: "blue.800" } })}
          >
            Optimism
          </a>{" "}
          •{" "}
          <a
            href={`https://optimistic.etherscan.io/address/${genAiNFTContractConfig.address}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View smart contract on Optimism Etherscan (opens in new tab)"
            className={css({ color: "blue.600", textDecoration: "underline", _hover: { color: "blue.800" } })}
          >
            View Contract ↗
          </a>
        </div>

        {/* Hidden accessible description used by aria-describedby for the Create Artwork button */}
        <span
          id="create-artwork-info"
          className={css({
            position: "absolute",
            left: "-9999px",
            top: "auto",
            width: "1px",
            height: "1px",
            overflow: "hidden",
          })}
        >
          Mints on Optimism (network fee \u003c 1¢). Sovereign generation — your prompt can only be used for your NFT,
          not stored elsewhere. View transaction details after minting.
        </span>

        {/* Mobile Info Text - only visible on small screens */}
        <div
          className={css({
            display: { base: "block", md: "none" },
            mt: "2",
            fontSize: "xs",
            color: "gray.600",
            textAlign: "center",
          })}
        >
          <InfoIcon size="xs" className={css({ mr: "1" })} />
          Mints on Optimism (network fee &lt;\u003c 1¢). Sovereign generation — your prompt can only be used for your
          NFT, not stored elsewhere.
        </div>

        {/* Status-Anzeige */}
        {mintingStatus !== "idle" && (
          <div className={styles.imageGen.compactStatus}>
            <div className={styles.spinner}></div>
            <span>{mintingStatus === "minting" ? "Creating your artwork..." : "Generating image..."}</span>
          </div>
        )}

        {!isConnected && (
          <div className={styles.imageGen.compactError}>
            <LocaleText label="imagegen.connectWallet" />
          </div>
        )}

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
