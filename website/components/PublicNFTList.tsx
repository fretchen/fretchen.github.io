import React, { useState } from "react";
import { useMultiChainPublicNFTs } from "../hooks/useMultiChainNFTs";
import { ModalImageData } from "../types/components";
import * as styles from "../layouts/styles";
import { NFTCard } from "./NFTCard";
import { ImageModal } from "./ImageModal";

export function PublicNFTList() {
  // Use the new multi-chain hook to fetch public NFTs from all networks
  const { tokens, isLoading } = useMultiChainPublicNFTs();

  // Modal state
  const [selectedImage, setSelectedImage] = useState<ModalImageData | null>(null);

  if (isLoading && tokens.length === 0) {
    return (
      <div className={styles.nftList.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading public artworks from all networks...</p>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className={styles.nftList.emptyStateContainer}>
        <p className={styles.nftList.emptyStateText}>No public artworks available yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.nftList.grid}>
        {tokens.map((token, index) => (
          <NFTCard
            key={`public-${token.network}-${token.tokenId}-${index}`}
            tokenId={token.tokenId}
            network={token.network}
            onImageClick={setSelectedImage}
            onNftBurned={() => {}} // No burn functionality for public view
            isHighlighted={false}
            isPublicView={true}
          />
        ))}
      </div>

      {/* Image enlargement modal */}
      {selectedImage && <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
    </>
  );
}
