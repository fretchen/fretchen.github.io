import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { getChain, getGenAiNFTContractConfig } from "../../utils/getChain";
import { css } from "../../styled-system/css";
import { layouts, typography, elements } from "../../layouts/theme";

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

function ImageGenerator({ onGenerate }: { onGenerate: (imageUrl?: string, tokenId?: bigint) => void }) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<"idle" | "minting" | "generating" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentTokenId, setCurrentTokenId] = useState<bigint | undefined>(undefined);

  // Blockchain interaction
  const { address, isConnected } = useAccount();
  const chain = getChain();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();

  // Read mint price from contract
  const { data: mintPrice } = useReadContract({
    ...genAiNFTContractConfig,
    functionName: "mintPrice",
    args: [],
    chainId: chain.id,
  });
  console.log("2. Mint price:", mintPrice ? mintPrice.toString() : "Loading...");

  const mintPriceEth = mintPrice ? parseFloat(mintPrice.toString()) / 1e18 : undefined;
  console.log("3. Mint price in ETH:", mintPriceEth ? mintPriceEth.toString() : "Loading...");

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
      const tokenId = BigInt(tokenIdHex);
      console.log("Minted token ID:", tokenId);
      setCurrentTokenId(tokenId);

      // Proceed with image generation
      setMintingStatus("generating");
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";
      const response = await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Image generation completed", data);
      const imageUrl = data.image_url;
      onGenerate(imageUrl, tokenId);
      setMintingStatus("idle");
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setMintingStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified styles using theme tokens
  const formStyle = css({
    ...layouts.flexColumn,
    alignItems: "flex-start",
    gap: "sm",
  });

  const textareaStyle = css({
    ...elements.input,
    height: "150px",
    resize: "vertical",
    opacity: isLoading || mintingStatus !== "idle" ? 0.7 : 1,
  });

  return (
    <div className={layouts.container}>
      <div className={formStyle}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your image..."
          disabled={isLoading || mintingStatus !== "idle"}
          className={textareaStyle}
        />
        <button
          onClick={handleMintAndGenerate}
          disabled={isLoading || !prompt.trim() || !isConnected || !address}
          className={elements.button}
        >
          {isLoading
            ? mintingStatus === "minting"
              ? "NFT is being minted..."
              : "Image is being generated..."
            : "Mint & Generate"}
        </button>
        {!isConnected && <p className={css({ color: "#666" })}>Connect your wallet to create an NFT</p>}
        {error && <p className={elements.errorMessage}>{error}</p>}
        {currentTokenId && mintingStatus === "idle" && (
          <p className={elements.successMessage}>NFT successfully created! Token ID: {currentTokenId.toString()}</p>
        )}
      </div>
    </div>
  );
}

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

  const handleGenerate = (imageUrl?: string, mintedTokenId?: bigint) => {
    setGeneratedImageUrl(imageUrl);
    if (mintedTokenId) {
      setTokenId(mintedTokenId);
    }
  };

  return (
    <div className={layouts.container}>
      <h1 className={typography.heading}>Decentral AI Image Generator</h1>
      <p className={typography.paragraph}>Create your AI image and pay for it with ETH. The process:</p>
      <ol className={typography.list}>
        <li>Enter a prompt</li>
        <li>Click on &quot;Mint & Generate&quot;</li>
        <li>First an NFT is created, then the image is generated</li>
        <li>Your image shows up after roughly 30s in the placeholder below</li>
      </ol>

      <div className={layouts.flexColumn}>
        <ImageGenerator onGenerate={handleGenerate} />
        <ImageDisplay imageUrl={generatedImageUrl} />
      </div>

      {tokenId && (
        <div className={elements.successMessage}>
          <h3>🎉 NFT successfully created!</h3>
          <p>
            <strong>Token ID:</strong> {tokenId.toString()}
          </p>
          <p>
            <a
              href={`https://optimistic.etherscan.io/token/${genAiNFTContractConfig.address}?a=${tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={elements.link}
            >
              View on Etherscan →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
