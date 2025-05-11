import React, { useState } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

import { getChain, getGenAiNFTContractConfig } from "../../utils/getChain";

function ImageGenerator({ onGenerate }: { onGenerate: (imageBase64?: string, tokenId?: bigint) => void }) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<"idle" | "minting" | "generating" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentTokenId, setCurrentTokenId] = useState<bigint | undefined>(undefined);

  // Blockchain interaction
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
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
  // transform the mintPrice to eth
  const mintPriceEth = mintPrice ? parseFloat(mintPrice.toString()) / 1e18 : undefined;
  console.log("3. Mint price in ETH:", mintPriceEth ? mintPriceEth.toString() : "Loading...");

  // Contract write operations
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();

  // Wait for transaction confirmation
  const { data: txReceipt, isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash: mintingStatus === "minting" ? undefined : undefined,
  });

  const handleMintAndGenerate = async () => {
    // Check conditions individually with precise error messages
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
      // We start with minting - with a temporary URI
      const tempUri = `ipfs://tempURI/${Date.now()}`;

      // Execute safeMint with temporary URI
      const txHash = await writeContractAsync({
        ...genAiNFTContractConfig,
        functionName: "safeMint",
        args: [tempUri],
        value: mintPrice,
        chainId: chain.id,
      });

      console.log("Minting transaction sent:", txHash);

      // Wait for confirmation and extract Token ID
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

      // Now proceed with image generation
      setMintingStatus("generating");

      // URL of the API service for image generation
      //const apiUrl = "http://localhost:8080";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      // GET request with prompt and token ID as parameters
      const response = await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Image generation completed");

      // Extract the image URL from the response
      const imageUrl = data.image_url;

      // Get the image as a JSON object
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Error retrieving the image: ${imageResponse.status} ${imageResponse.statusText}`);
      }

      const imageData = await imageResponse.json();
      // Extract the Base64 image from the response
      const imageBase64 = imageData.b64_image;

      // Pass image and token ID to the parent component
      onGenerate(imageBase64, tokenId);

      setMintingStatus("idle");
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setMintingStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to wait for transaction confirmation
  const waitForTransaction = async (hash: `0x${string}`) => {
    return new Promise<any>((resolve, reject) => {
      const checkReceipt = async () => {
        try {
          const receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [hash],
          });

          if (receipt) {
            resolve(receipt);
          } else {
            setTimeout(checkReceipt, 2000); // Check every 2 seconds
          }
        } catch (error) {
          reject(error);
        }
      };

      checkReceipt();
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexDirection: "column" }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your image..."
          disabled={isLoading || mintingStatus !== "idle"}
          style={{
            padding: "8px",
            width: "300px",
            height: "150px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            resize: "vertical",
            opacity: isLoading || mintingStatus !== "idle" ? 0.7 : 1,
          }}
        />
        <button
          onClick={handleMintAndGenerate}
          disabled={isLoading || !prompt.trim() || !isConnected || !address}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading || !prompt.trim() || !isConnected || !address ? "not-allowed" : "pointer",
            width: "300px",
            opacity: isLoading || !prompt.trim() || !isConnected || !address ? 0.7 : 1,
          }}
        >
          {isLoading
            ? mintingStatus === "minting"
              ? "NFT is being minted..."
              : "Image is being generated..."
            : "Mint & Generate"}
        </button>

        {!isConnected && <p style={{ color: "#666" }}>Connect your wallet to create an NFT</p>}

        {error && <p style={{ color: "red", margin: "10px 0" }}>{error}</p>}

        {currentTokenId && mintingStatus === "idle" && (
          <p style={{ color: "green" }}>NFT successfully created! Token ID: {currentTokenId.toString()}</p>
        )}
      </div>
    </div>
  );
}

interface ImageDisplayProps {
  imageBase64?: string;
}

function ImageDisplay({ imageBase64 }: ImageDisplayProps) {
  return (
    <div
      style={{
        width: "300px",
        height: "300px",
        border: "2px dashed #ccc",
        borderRadius: "4px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "20px",
      }}
    >
      {imageBase64 ? (
        <img
          src={`data:image/jpeg;base64,${imageBase64}`}
          alt="Generated"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />
      ) : (
        <p style={{ color: "#666" }}>Your image will appear here</p>
      )}
    </div>
  );
}

export default function Page() {
  // Chain and Contract configuration
  const chainId = useChainId();
  const chain = getChain();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();


  const [generatedImage, setGeneratedImage] = useState<string>();
  const [tokenId, setTokenId] = useState<bigint>();

  const handleGenerate = (imageBase64?: string, mintedTokenId?: bigint) => {
    setGeneratedImage(imageBase64);
    if (mintedTokenId) {
      setTokenId(mintedTokenId);
    }
  };

  return (
    <>
      <h1>AI Image NFT Generator</h1>
      <p>Create unique AI-generated art and own it as an NFT. The process:</p>
      <ol>
        <li>Enter a prompt</li>
        <li>Click on "Mint & Generate"</li>
        <li>First an NFT is created, then the image is generated</li>
      </ol>

      <ImageGenerator onGenerate={handleGenerate} />
      <ImageDisplay imageBase64={generatedImage} />

      {tokenId && (
        <div style={{ marginTop: "20px", padding: "15px", border: "1px solid #28a745", borderRadius: "4px" }}>
          <h3>🎉 NFT successfully created!</h3>
          <p>
            <strong>Token ID:</strong> {tokenId.toString()}
          </p>
          <p>
            <a
              href={`https://optimistic.etherscan.io/token/${genAiNFTContractConfig.address}?a=${tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0066cc", textDecoration: "none" }}
            >
              {" "}
              View on Etherscan →
            </a>
          </p>
        </div>
      )}
    </>
  );
}
