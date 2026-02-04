import React, { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useMultiChainUserNFTs, MultiChainNFTToken } from "../hooks/useMultiChainNFTs";
import { NFTMetadata, ModalImageData } from "../types/components";
import * as styles from "../layouts/styles";
import { NFTCard } from "./NFTCard";
import { ImageModal } from "./ImageModal";

interface MyNFTListProps {
  newlyCreatedNFT?: {
    tokenId: bigint;
    imageUrl: string;
    metadata?: NFTMetadata;
    network: string;
  };
  onNewNFTDisplayed?: () => void;
}

export function MyNFTList({ newlyCreatedNFT, onNewNFTDisplayed }: MyNFTListProps) {
  const { isConnected } = useAccount();

  // Use the new multi-chain hook to fetch NFTs from all networks
  const { tokens, isLoading, reload } = useMultiChainUserNFTs();

  // Local state for highlighting and modal
  const [highlightedNFT, setHighlightedNFT] = useState<{ tokenId: bigint; network: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<ModalImageData | null>(null);

  // Merge newly created NFT into the list
  const [localTokens, setLocalTokens] = useState<MultiChainNFTToken[]>([]);

  // Sync tokens from hook to local state
  useEffect(() => {
    setLocalTokens(tokens);
  }, [tokens]);

  // Handle newly created NFT - add to top of list with highlighting
  const handleNewlyCreatedNFT = useCallback(
    (newToken: { tokenId: bigint; network: string }) => {
      // Set highlighting for the new NFT
      setHighlightedNFT(newToken);

      // Add to top of token list if not already present
      setLocalTokens((prev) => {
        const exists = prev.some((t) => t.tokenId === newToken.tokenId && t.network === newToken.network);
        if (exists) {
          return prev;
        }
        return [{ tokenId: newToken.tokenId, network: newToken.network }, ...prev];
      });

      // Remove highlighting after 5 seconds
      setTimeout(() => {
        setHighlightedNFT(null);
        onNewNFTDisplayed?.();
      }, 5000);
    },
    [onNewNFTDisplayed],
  );

  // Handle listing status changes (NFTCard handles blockchain state itself)
  const handleListedStatusChanged = useCallback((_tokenId: bigint, _isListed: boolean) => {
    // This callback can be used to update local state if needed
  }, []);

  // Handle newly created NFT when prop changes
  useEffect(() => {
    if (newlyCreatedNFT) {
      handleNewlyCreatedNFT({
        tokenId: newlyCreatedNFT.tokenId,
        network: newlyCreatedNFT.network,
      });
    }
  }, [newlyCreatedNFT, handleNewlyCreatedNFT]);

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

  if (isLoading && localTokens.length === 0) {
    return (
      <div className={styles.nftList.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your artworks from all networks...</p>
      </div>
    );
  }

  if (localTokens.length === 0) {
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
        {localTokens.map((token, index) => {
          // Check if this is the newly created NFT with preloaded data
          const isNewlyCreated =
            newlyCreatedNFT?.tokenId === token.tokenId && newlyCreatedNFT?.network === token.network;
          const preloadedImageUrl = isNewlyCreated ? newlyCreatedNFT.imageUrl : undefined;
          const preloadedMetadata = isNewlyCreated ? newlyCreatedNFT.metadata : undefined;

          // Check if this token should be highlighted
          const isHighlighted = highlightedNFT?.tokenId === token.tokenId && highlightedNFT?.network === token.network;

          return (
            <NFTCard
              key={`my-${token.network}-${token.tokenId}-${index}`}
              tokenId={token.tokenId}
              network={token.network}
              onImageClick={setSelectedImage}
              onNftBurned={() => reload()}
              onListedStatusChanged={handleListedStatusChanged}
              isHighlighted={isHighlighted}
              isPublicView={false}
              preloadedImageUrl={preloadedImageUrl}
              preloadedMetadata={preloadedMetadata}
            />
          );
        })}
      </div>

      {/* Image enlargement modal */}
      {selectedImage && <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
    </>
  );
}
