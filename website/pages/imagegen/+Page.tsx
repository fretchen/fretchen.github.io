import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { getChain, getGenAiNFTContractConfig } from "../../utils/getChain";
import { css } from "../../styled-system/css";

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
        (log) => log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
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

  // PandaCSS styles for ImageGenerator
  const containerStyle = css({ padding: "md" });
  const formStyle = css({ display: "flex", flexDirection: "column", gap: "sm", marginTop: "md" });
  const textareaStyle = css({
    padding: "sm",
    width: "300px",
    height: "150px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    resize: "vertical",
    opacity: isLoading || mintingStatus !== "idle" ? 0.7 : 1,
  });
  const buttonStyle = css({
    padding: "8px 16px",
    backgroundColor: "brand",
    color: "light",
    border: "none",
    borderRadius: "4px",
    cursor: isLoading || !prompt.trim() || !isConnected || !address ? "not-allowed" : "pointer",
    width: "300px",
    opacity: isLoading || !prompt.trim() || !isConnected || !address ? 0.7 : 1,
  });
  const infoTextStyle = css({ color: "#666" });
  const errorStyle = css({ color: "red", margin: "10px 0" });
  const tokenMessageStyle = css({ color: "green", marginTop: "md", padding: "sm", border: "1px solid #28a745", borderRadius: "4px" });

  return (
    <div className={containerStyle}>
      <div className={formStyle}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your image..."
          disabled={isLoading || mintingStatus !== "idle"}
          className={textareaStyle}
        />
        <button onClick={handleMintAndGenerate} disabled={isLoading || !prompt.trim() || !isConnected || !address} className={buttonStyle}>
          {isLoading
            ? mintingStatus === "minting"
              ? "NFT is being minted..."
              : "Image is being generated..."
            : "Mint & Generate"}
        </button>
        {!isConnected && <p className={infoTextStyle}>Connect your wallet to create an NFT</p>}
        {error && <p className={errorStyle}>{error}</p>}
        {currentTokenId && mintingStatus === "idle" && (
          <p className={tokenMessageStyle}>NFT successfully created! Token ID: {currentTokenId.toString()}</p>
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
    border: "2px dashed #ccc",
    borderRadius: "4px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "md",
  });
  const placeholderTextStyle = css({ color: "#666" });
  return (
    <div className={displayStyle}>
      {imageUrl ? (
        <img src={imageUrl} alt="Generated" style={{ maxWidth: "100%", maxHeight: "100%" }} />
      ) : (
        <p className={placeholderTextStyle}>Your image will appear here</p>
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

  const headingStyle = css({ fontSize: "2xl", fontWeight: "bold", marginBottom: "sm" });
  const paragraphStyle = css({ marginBottom: "sm" });
  const listStyle = css({ paddingLeft: "2em", marginBottom: "sm" });
  const linkStyle = css({ color: "brand", textDecoration: "none" });

  return (
    <>
      <h1 className={headingStyle}>Decentral AI Image Generator</h1>
      <p className={paragraphStyle}>Create your AI image and pay for it with ETH. The process:</p>
      <ol className={listStyle}>
        <li>Enter a prompt</li>
        <li>Click on &quot;Mint & Generate&quot;</li>
        <li>First an NFT is created, then the image is generated</li>
        <li>Your image shows up after roughly 30s in the placeholder below</li>
      </ol>
      <ImageGenerator onGenerate={handleGenerate} />
      <ImageDisplay imageUrl={generatedImageUrl} />
      {tokenId && (
        <div className={css({ marginTop: "md", padding: "sm", border: "1px solid #28a745", borderRadius: "4px" })}>
          <h3>🎉 NFT successfully created!</h3>
          <p>
            <strong>Token ID:</strong> {tokenId.toString()}
          </p>
          <p>
            <a
              href={`https://optimistic.etherscan.io/token/${genAiNFTContractConfig.address}?a=${tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={linkStyle}
            >
              View on Etherscan →
            </a>
          </p>
        </div>
      )}
    </>
  );
}
