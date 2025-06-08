import React, { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { config } from "../wagmi.config";
import { getChain, getGenAiNFTContractConfig } from "../utils/getChain";
import { NFT, NFTMetadata, ModalImageData } from "../types/components";
import * as styles from "../layouts/styles";
import { NFTCard } from "./NFTCard";
import { ImageModal } from "./ImageModal";

interface MyNFTListProps {
  newlyCreatedNFT?: {
    tokenId: bigint;
    imageUrl: string;
    metadata?: NFTMetadata;
  };
  onNewNFTDisplayed?: () => void;
}

export function MyNFTList({ newlyCreatedNFT, onNewNFTDisplayed }: MyNFTListProps) {
  const { address, isConnected } = useAccount();
  const chain = getChain();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();

  // My NFTs state
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [highlightedNFT, setHighlightedNFT] = useState<bigint | null>(null);
  const [selectedImage, setSelectedImage] = useState<ModalImageData | null>(null);

  // Get user's NFT balance
  const { data: userBalance, isLoading: isLoadingBalance } = useReadContract({
    ...genAiNFTContractConfig,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: chain.id,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Fetch metadata from tokenURI
  const fetchNFTMetadata = async (tokenURI: string): Promise<NFTMetadata | null> => {
    try {
      // Handle file:// URLs for local development
      if (tokenURI.startsWith("file://")) {
        console.warn("Cannot fetch file:// URLs in browser. Metadata:", tokenURI);
        return null;
      }

      const response = await fetch(tokenURI);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      const metadata: NFTMetadata = await response.json();
      return metadata;
    } catch (error) {
      console.error("Error fetching NFT metadata:", error);
      return null;
    }
  };

  // Load user's NFTs using enumerable functions
  const loadUserNFTs = async () => {
    if (!isConnected || !address) {
      setNfts([]);
      return;
    }

    setIsLoadingMetadata(true);

    try {
      // Get fresh balance directly from contract to avoid stale state
      const freshBalance = await readContract(config, {
        ...genAiNFTContractConfig,
        functionName: "balanceOf",
        args: [address],
      });

      if (!freshBalance || freshBalance === 0n) {
        setNfts([]);
        return;
      }

      // Show loading placeholders initially
      const placeholderNFTs = Array.from({ length: Number(freshBalance) }, () => ({
        tokenId: 0n,
        tokenURI: "",
        isLoading: true,
      }));

      setNfts(placeholderNFTs);

      // Load all NFT data first, then sort by tokenId
      const nftPromises: Promise<NFT>[] = [];

      for (let i = 0; i < Number(freshBalance); i++) {
        const nftPromise = (async () => {
          try {
            // Get token ID at index using wagmi's readContract
            const tokenIdResult = await readContract(config, {
              ...genAiNFTContractConfig,
              functionName: "tokenOfOwnerByIndex",
              args: [address, BigInt(i)],
            });

            const tokenId = tokenIdResult as bigint;

            // Get token URI
            const tokenURIResult = await readContract(config, {
              ...genAiNFTContractConfig,
              functionName: "tokenURI",
              args: [tokenId],
            });

            const tokenURI = tokenURIResult as string;

            // Get listing status
            const isListedResult = await readContract(config, {
              ...genAiNFTContractConfig,
              functionName: "isTokenListed",
              args: [tokenId],
            });

            const isListed = isListedResult as boolean;

            // Fetch metadata
            const metadata = await fetchNFTMetadata(tokenURI);

            return {
              tokenId,
              tokenURI,
              metadata: metadata || undefined,
              imageUrl: metadata?.image,
              isLoading: false,
              isListed,
            };
          } catch (error) {
            console.error(`Error loading NFT at index ${i}:`, error);
            return {
              tokenId: 0n,
              tokenURI: "",
              isLoading: false,
              error: `Failed to load NFT #${i}: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
          }
        })();

        nftPromises.push(nftPromise);
      }

      // Wait for all NFTs to load
      const loadedNFTs = await Promise.all(nftPromises);

      // Sort by tokenId in descending order (newest first)
      const sortedNFTs = loadedNFTs.sort((a, b) => {
        // Handle error cases - put them at the end
        if (a.error && !b.error) return 1;
        if (!a.error && b.error) return -1;
        if (a.error && b.error) return 0;

        // Sort by tokenId (descending - newest first)
        // Use BigInt comparison to avoid precision loss for large token IDs
        if (b.tokenId > a.tokenId) return 1;
        if (b.tokenId < a.tokenId) return -1;
        return 0;
      });

      // Update state with sorted NFTs
      setNfts(sortedNFTs);
    } catch (error) {
      console.error("Error loading NFTs:", error);
      setNfts([]);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Handle listed status change for user NFTs
  const handleListedStatusChanged = async (tokenId: bigint, isListed: boolean) => {
    // Update the local state immediately for better UX
    setNfts((prevNfts) => prevNfts.map((nft) => (nft.tokenId === tokenId ? { ...nft, isListed } : nft)));
  };

  // Load data when component mounts or dependencies change
  useEffect(() => {
    if (isConnected && address) {
      loadUserNFTs();
    }
  }, [address, isConnected, userBalance]); // Keep userBalance for automatic updates

  // Handle newly created NFT
  useEffect(() => {
    if (newlyCreatedNFT) {
      // Set highlighting for the new NFT
      setHighlightedNFT(newlyCreatedNFT.tokenId);

      // Create temporary NFT for immediate display
      const tempNFT: NFT = {
        tokenId: newlyCreatedNFT.tokenId,
        tokenURI: "",
        imageUrl: newlyCreatedNFT.imageUrl,
        metadata: newlyCreatedNFT.metadata,
        isLoading: false,
        isListed: false, // New NFTs are private by default
      };

      // Add to top of list, but ensure we don't duplicate if it already exists
      setNfts((prevNfts) => {
        const existingIndex = prevNfts.findIndex((nft) => nft.tokenId === newlyCreatedNFT.tokenId);
        if (existingIndex !== -1) {
          // Update existing NFT with image and metadata
          const updatedNfts = [...prevNfts];
          updatedNfts[existingIndex] = {
            ...updatedNfts[existingIndex],
            imageUrl: newlyCreatedNFT.imageUrl,
            metadata: newlyCreatedNFT.metadata,
          };
          return updatedNfts;
        } else {
          // Add new NFT at the top
          return [tempNFT, ...prevNfts];
        }
      });

      // Remove highlighting after 5 seconds - no automatic reload needed
      setTimeout(() => {
        setHighlightedNFT(null);
        onNewNFTDisplayed?.();
      }, 5000);
    }
  }, [newlyCreatedNFT, onNewNFTDisplayed]);

  const isLoading = isLoadingBalance || isLoadingMetadata;

  if (!isConnected) {
    return (
      <div className={styles.nftList.walletPrompt}>
        <h3>🔗 Connect Your Wallet</h3>
        <p>To view and manage your personal NFT artworks, please connect your wallet using the button above.</p>
        <p>Your artworks are stored on the blockchain and linked to your wallet address.</p>
        <p style={{ marginTop: "1rem", fontSize: "0.9em", opacity: 0.8 }}>
          💡 Tip: You can explore public artworks from other users in the &ldquo;All Public Artworks&rdquo; tab without
          connecting your wallet.
        </p>
      </div>
    );
  }

  if (isLoading && nfts.length === 0) {
    return (
      <div className={styles.nftList.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your artworks...</p>
      </div>
    );
  }

  if (userBalance === 0n || !userBalance) {
    return (
      <div className={styles.nftList.emptyStateContainer}>
        <p className={styles.nftList.emptyStateText}>
          You haven&apos;t created any artworks yet. Use the generator above to create your first one!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.nftList.grid}>
        {nfts.map((nft, index) => (
          <NFTCard
            key={`my-${nft.tokenId}-${index}`}
            nft={nft}
            onImageClick={setSelectedImage}
            onNftBurned={() => loadUserNFTs()}
            onListedStatusChanged={handleListedStatusChanged}
            isHighlighted={highlightedNFT === nft.tokenId}
            isPublicView={false}
          />
        ))}
      </div>

      {/* Bildvergrößerungs-Modal */}
      {selectedImage && <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
    </>
  );
}
