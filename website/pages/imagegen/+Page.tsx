import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { getChain, getGenAiNFTContractConfig } from "../../utils/getChain";
import { css } from "../../styled-system/css";
import { layouts, typography, elements, layoutStyles } from "../../layouts/theme";

// Define the correct type for transaction receipt
interface TransactionReceipt {
  blockHash: string;
  blockNumber: string;
  contractAddress: string | null;
  cumulativeGasUsed: string;
  effectiveGasPrice: string;
  from: string;
  gasUsed: string;
  logs: Array<{
    address: string;
    topics: string[];
    data: string;
    blockNumber: string;
    transactionHash: string;
    transactionIndex: string;
    blockHash: string;
    logIndex: string;
    removed: boolean;
  }>;
  logsBloom: string;
  status: string;
  to: string;
  transactionHash: string;
  transactionIndex: string;
  type: string;
}

// Helper function to wait for transaction confirmation
const waitForTransaction = async (hash: `0x${string}`): Promise<TransactionReceipt> => {
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

interface ImageDisplayProps {
  imageUrl?: string;
}

function ImageDisplay({ imageUrl }: ImageDisplayProps) {
  const displayStyle = css({
    width: "300px",
    height: "300px",
    border: "2px dashed token(colors.border)",
    borderRadius: "sm",
    ...layouts.flexCenter,
    marginTop: "md",
  });

  return (
    <div className={displayStyle}>
      {imageUrl ? (
        <img src={imageUrl} alt="Generated" className={css({ maxWidth: "100%", maxHeight: "100%" })} />
      ) : (
        <p className={css({ color: "text" })}>Your image will appear here</p>
      )}
    </div>
  );
}

export default function Page() {
  const genAiNFTContractConfig = getGenAiNFTContractConfig();
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>();
  const [tokenId, setTokenId] = useState<bigint>();

  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<"idle" | "minting" | "generating" | "error">("idle");
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

  const mintPriceEth = mintPrice ? parseFloat(mintPrice.toString()) / 1e18 : undefined;

  // Contract write operations
  const { writeContractAsync } = useWriteContract();

  const handleMintAndGenerate = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }
    if (!mintPrice) {
      setError("Could not load mint price from contract");
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
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";
      const response = await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${newTokenId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Image generation completed", data);
      const imageUrl = data.image_url;
      setGeneratedImageUrl(imageUrl);
      setMintingStatus("idle");
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setMintingStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={layouts.container}>
      <h1 className={typography.heading}>Decentral AI Image Generator</h1>

      {/* Card-basiertes Layout mit zwei Spalten */}
      <div
        className={css({
          display: "flex",
          flexDirection: ["column", "column", "row"],
          gap: "lg",
          marginTop: "md",
          backgroundColor: "background",
          borderRadius: "md",
          border: "1px solid token(colors.border)",
          padding: "md",
        })}
      >
        {/* Linke Spalte: Eingabe und Steuerung */}
        <div
          className={css({
            flex: "1",
            display: "flex",
            flexDirection: "column",
            gap: "md",
          })}
        >
          <h2 className={css({ fontSize: "lg", margin: 0 })}>Create Your Image</h2>

          {/* Schritte als nummerierte Karten */}
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "xs",
              marginBottom: "sm",
            })}
          >
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "sm",
              })}
            >
              <span
                className={css({
                  backgroundColor: "brand",
                  color: "light",
                  width: "24px",
                  height: "24px",
                  borderRadius: "full",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                })}
              >
                1
              </span>
              <span>Enter a descriptive prompt below</span>
            </div>

            <div
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "sm",
              })}
            >
              <span
                className={css({
                  backgroundColor: "brand",
                  color: "light",
                  width: "24px",
                  height: "24px",
                  borderRadius: "full",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                })}
              >
                2
              </span>
              <span>Click "Mint & Generate" (costs ~10¢ in ETH)</span>
            </div>

            <div
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "sm",
              })}
            >
              <span
                className={css({
                  backgroundColor: "brand",
                  color: "light",
                  width: "24px",
                  height: "24px",
                  borderRadius: "full",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                })}
              >
                3
              </span>
              <span>Wait ~30s for your image to appear</span>
            </div>
          </div>

          {/* Eingabeformular */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your image in detail... (e.g. 'A futuristic city skyline at sunset with flying cars')"
            disabled={isLoading || mintingStatus !== "idle"}
            className={css({
              padding: "md",
              height: "150px",
              borderRadius: "sm",
              border: "1px solid token(colors.border)",
              resize: "vertical",
              marginBottom: "sm",
              opacity: isLoading || mintingStatus !== "idle" ? 0.7 : 1,
            })}
          />

          {/* Status-Anzeige */}
          {mintingStatus !== "idle" && (
            <div
              className={css({
                padding: "sm",
                backgroundColor: "rgba(0, 102, 204, 0.1)",
                border: "1px solid token(colors.brand)",
                borderRadius: "sm",
                marginBottom: "sm",
              })}
            >
              <div className={css({ display: "flex", alignItems: "center", gap: "sm" })}>
                <div
                  className={css({
                    width: "16px",
                    height: "16px",
                    borderRadius: "full",
                    border: "2px solid token(colors.brand)",
                    borderRightColor: "transparent",
                    animation: "spin 1s linear infinite",
                  })}
                ></div>
                <span>{mintingStatus === "minting" ? "Creating your NFT..." : "Generating your image..."}</span>
              </div>
              <div className={css({ fontSize: "sm", color: "gray.600", marginTop: "xs" })}>
                {mintingStatus === "minting"
                  ? "Confirm the transaction in your wallet"
                  : "This may take up to 30 seconds"}
              </div>
            </div>
          )}

          {/* Mint-Button */}
          <button
            onClick={handleMintAndGenerate}
            disabled={isLoading || !prompt.trim() || !isConnected || !address}
            className={css({
              padding: "md",
              backgroundColor: "brand",
              color: "light",
              border: "none",
              borderRadius: "sm",
              cursor: isLoading || !prompt.trim() || !isConnected || !address ? "not-allowed" : "pointer",
              fontWeight: "bold",
              opacity: isLoading || !prompt.trim() || !isConnected || !address ? 0.7 : 1,
              transition: "all 0.2s",
              _hover: { backgroundColor: "brand" },
            })}
          >
            {isLoading ? (mintingStatus === "minting" ? "Creating NFT..." : "Generating Image...") : "Mint & Generate"}
          </button>

          {/* Fehlermeldungen */}
          {!isConnected && (
            <p className={css({ fontSize: "sm", color: "#666", margin: "xs 0" })}>
              Connect your wallet to create an NFT
            </p>
          )}
          {error && <div className={elements.errorMessage}>{error}</div>}
        </div>

        {/* Rechte Spalte: Bildvorschau und NFT-Details */}
        <div
          className={css({
            flex: "1",
            display: "flex",
            flexDirection: "column",
            gap: "md",
          })}
        >
          <h2 className={css({ fontSize: "lg", margin: 0 })}>Your Generated Image</h2>

          {/* Bildvorschau mit Statusanzeige */}
          <div
            className={css({
              width: "100%",
              aspectRatio: "1/1",
              border: "2px dashed token(colors.border)",
              borderRadius: "sm",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              backgroundColor: "#f9f9f9",
              position: "relative",
            })}
          >
            {mintingStatus !== "idle" && !generatedImageUrl && (
              <div
                className={css({
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.8)",
                  zIndex: 1,
                })}
              >
                <div
                  className={css({
                    width: "40px",
                    height: "40px",
                    borderRadius: "full",
                    border: "4px solid token(colors.brand)",
                    borderRightColor: "transparent",
                    animation: "spin 1s linear infinite",
                    marginBottom: "md",
                  })}
                ></div>
                <p className={css({ fontWeight: "medium" })}>
                  {mintingStatus === "minting" ? "Creating NFT..." : "AI is drawing..."}
                </p>
              </div>
            )}
            {generatedImageUrl ? (
              <img
                src={generatedImageUrl}
                alt="Generated"
                className={css({ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" })}
              />
            ) : (
              <div
                className={css({
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "md",
                  textAlign: "center",
                  color: "text",
                })}
              >
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={css({ marginBottom: "sm", opacity: 0.5 })}
                >
                  <path
                    d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 22H21C21.5304 22 22.0391 21.7893 22.4142 21.4142C22.7893 21.0391 23 20.5304 23 20V4C23 3.46957 22.7893 2.96086 22.4142 2.58579C22.0391 2.21071 21.5304 2 21 2H3C2.46957 2 1.96086 2.21071 1.58579 2.58579C1.21071 2.96086 1 3.46957 1 4V20C1 20.5304 1.21071 21.0391 1.58579 21.4142C1.96086 21.7893 2.46957 22 3 22Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                </svg>
                <p>Your image will appear here</p>
                <p className={css({ fontSize: "sm", color: "gray.500" })}>After generation, you'll own it as an NFT</p>
              </div>
            )}
          </div>

          {/* NFT-Details */}
          {tokenId && (
            <div
              className={css({
                padding: "md",
                backgroundColor: "rgba(40, 167, 69, 0.1)",
                border: "1px solid #28a745",
                borderRadius: "sm",
                marginTop: "sm",
              })}
            >
              <h3 className={css({ margin: 0, fontSize: "md" })}>🎉 NFT successfully created!</h3>
              <p className={css({ margin: "xs 0" })}>
                <strong>Token ID:</strong> {tokenId.toString()}
              </p>
              <a
                href={`https://optimistic.etherscan.io/token/${genAiNFTContractConfig.address}?a=${tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={css({
                  display: "inline-block",
                  color: "brand",
                  textDecoration: "none",
                  marginTop: "xs",
                  fontWeight: "medium",
                  _hover: { textDecoration: "underline" },
                })}
              >
                View on Etherscan →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
