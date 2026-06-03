import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { useMultiChainUserNFTs } from "../hooks/useMultiChainNFTs";
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

  // Merge newly created NFT into the top of the list without a sync effect.
  // If the NFT is not yet in the hook data, prepend it so it appears immediately.
  const displayTokens = useMemo(() => {
    if (!newlyCreatedNFT) return tokens;
    const exists = tokens.some((t) => t.tokenId === newlyCreatedNFT.tokenId && t.network === newlyCreatedNFT.network);
    if (exists) return tokens;
    return [{ tokenId: newlyCreatedNFT.tokenId, network: newlyCreatedNFT.network }, ...tokens];
  }, [tokens, newlyCreatedNFT]);

  // Handle listing status changes (NFTCard handles blockchain state itself)
  const handleListedStatusChanged = useCallback((_tokenId: bigint, _isListed: boolean) => {
    // This callback can be used to update local state if needed
  }, []);

  // Keep a stable ref to the callback so the highlight effect doesn't re-run (and
  // restart the 5s timer) if the caller passes a new function reference on each render.
  const onNewNFTDisplayedRef = React.useRef(onNewNFTDisplayed);
  useEffect(() => {
    onNewNFTDisplayedRef.current = onNewNFTDisplayed;
  });

  // Highlight the newly created NFT and clear after 5s.
  // setState inside an effect is necessary here because the highlight is time-limited.
  useEffect(() => {
    if (newlyCreatedNFT) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedNFT({ tokenId: newlyCreatedNFT.tokenId, network: newlyCreatedNFT.network });
      setTimeout(() => {
        setHighlightedNFT(null);
        onNewNFTDisplayedRef.current?.();
      }, 5000);
    }
  }, [newlyCreatedNFT]);

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

  if (isLoading && displayTokens.length === 0) {
    return (
      <div className={styles.nftList.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your artworks from all networks...</p>
      </div>
    );
  }

  if (displayTokens.length === 0) {
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
        {displayTokens.map((token, index) => {
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
