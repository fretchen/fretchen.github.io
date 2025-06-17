import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { config } from "../wagmi.config";
import { getChain, getGenAiNFTContractConfig } from "../utils/getChain";
import { NFTMetadata, ModalImageData } from "../types/components";
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

  // My NFTs state - now just store token IDs
  const [tokenIds, setTokenIds] = useState<bigint[]>([]);
  const [isLoadingTokenIds, setIsLoadingTokenIds] = useState(false);
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

  // Fetch metadata from tokenURI - remove this as NFTCard will handle it
  // const fetchNFTMetadata = async (tokenURI: string): Promise<NFTMetadata | null> => {
  //   ...
  // };

  // Load user's NFT token IDs only
  const loadUserTokenIds = useCallback(async () => {
    if (!isConnected || !address) {
      setTokenIds([]);
      return;
    }

    setIsLoadingTokenIds(true);

    try {
      // Get fresh balance directly from contract to avoid stale state
      const freshBalance = await readContract(config, {
        ...genAiNFTContractConfig,
        functionName: "balanceOf",
        args: [address],
      });

      if (!freshBalance || freshBalance === 0n) {
        setTokenIds([]);
        return;
      }

      // Load all token IDs
      const tokenIdPromises: Promise<bigint>[] = [];

      for (let i = 0; i < Number(freshBalance); i++) {
        const tokenIdPromise = (async () => {
          try {
            // Get token ID at index using wagmi's readContract
            const tokenIdResult = await readContract(config, {
              ...genAiNFTContractConfig,
              functionName: "tokenOfOwnerByIndex",
              args: [address, BigInt(i)],
            });

            return tokenIdResult as bigint;
          } catch (error) {
            console.error(`Error loading token ID at index ${i}:`, error);
            return 0n; // Return 0 as fallback
          }
        })();

        tokenIdPromises.push(tokenIdPromise);
      }

      // Wait for all token IDs to load
      const loadedTokenIds = await Promise.all(tokenIdPromises);

      // Filter out any 0 values (errors) and sort by tokenId in descending order (newest first)
      const validTokenIds = loadedTokenIds
        .filter((id) => id > 0n)
        .sort((a, b) => {
          // Sort by tokenId (descending - newest first)
          if (b > a) return 1;
          if (b < a) return -1;
          return 0;
        });

      // Update state with sorted token IDs
      setTokenIds(validTokenIds);
    } catch (error) {
      console.error("Error loading token IDs:", error);
      setTokenIds([]);
    } finally {
      setIsLoadingTokenIds(false);
    }
  }, [isConnected, address]); // Entfernt: genAiNFTContractConfig

  // Handle newly created NFT - just add to token list
  const handleNewlyCreatedNFT = (newTokenId: bigint) => {
    // Set highlighting for the new NFT
    setHighlightedNFT(newTokenId);

    // Add to top of token list if not already present
    setTokenIds((prevTokenIds) => {
      const exists = prevTokenIds.includes(newTokenId);
      if (exists) {
        return prevTokenIds;
      }
      return [newTokenId, ...prevTokenIds];
    });

    // Remove highlighting after 5 seconds
    setTimeout(() => {
      setHighlightedNFT(null);
      onNewNFTDisplayed?.();
    }, 5000);
  };

  // Load data when component mounts or dependencies change
  useEffect(() => {
    if (isConnected && address) {
      loadUserTokenIds();
    }
  }, [address, isConnected]); // Entfernt: userBalance to prevent too frequent reloads

  // Handle newly created NFT
  useEffect(() => {
    if (newlyCreatedNFT) {
      handleNewlyCreatedNFT(newlyCreatedNFT.tokenId);
    }
  }, [newlyCreatedNFT]); // Entfernt: onNewNFTDisplayed

  const isLoading = isLoadingBalance || isLoadingTokenIds;

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

  if (isLoading && tokenIds.length === 0) {
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
        {tokenIds.map((tokenId, index) => (
          <NFTCard
            key={`my-${tokenId}-${index}`}
            tokenId={tokenId}
            onImageClick={setSelectedImage}
            onNftBurned={() => loadUserTokenIds()}
            isHighlighted={highlightedNFT === tokenId}
            isPublicView={false}
          />
        ))}
      </div>

      {/* Bildvergrößerungs-Modal */}
      {selectedImage && <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
    </>
  );
}
