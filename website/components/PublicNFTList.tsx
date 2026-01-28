import React, { useState, useEffect, useCallback } from "react";
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { getGenAiNFTAddress, GenImNFTv4ABI, GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";
import { useConfiguredPublicClient } from "../hooks/useConfiguredPublicClient";
import { ModalImageData } from "../types/components";
import * as styles from "../layouts/styles";
import { NFTCard } from "./NFTCard";
import { ImageModal } from "./ImageModal";

export function PublicNFTList() {
  // Get network and contract address from chain-utils
  const network = useAutoNetwork(GENAI_NFT_NETWORKS);
  const contractAddress = getGenAiNFTAddress(network);

  // Public NFTs state - now just store token IDs
  const [publicTokenIds, setPublicTokenIds] = useState<bigint[]>([]);
  const [isLoadingTokenIds, setIsLoadingTokenIds] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ModalImageData | null>(null);

  // Use the custom hook for a stable public client reference
  const publicClient = useConfiguredPublicClient(network);

  // Load all public token IDs using getAllPublicTokens
  const loadPublicTokenIds = useCallback(async () => {
    setIsLoadingTokenIds(true);

    try {
      // Get all public token IDs using the public client
      const tokenIds = (await publicClient.readContract({
        address: contractAddress,
        abi: GenImNFTv4ABI,
        functionName: "getAllPublicTokens",
      })) as bigint[];

      if (!tokenIds || tokenIds.length === 0) {
        setPublicTokenIds([]);
        return;
      }

      // Sort by tokenId in descending order (newest first)
      const sortedTokenIds = tokenIds.sort((a, b) => {
        if (b > a) return 1;
        if (b < a) return -1;
        return 0;
      });

      setPublicTokenIds(sortedTokenIds);
    } catch (error) {
      console.error("Error loading public token IDs:", error);
      setPublicTokenIds([]);
    } finally {
      setIsLoadingTokenIds(false);
    }
  }, [publicClient]);

  // Load data when component mounts
  useEffect(() => {
    loadPublicTokenIds();
  }, [loadPublicTokenIds]);

  if (isLoadingTokenIds && publicTokenIds.length === 0) {
    return (
      <div className={styles.nftList.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading public artworks...</p>
      </div>
    );
  }

  if (publicTokenIds.length === 0) {
    return (
      <div className={styles.nftList.emptyStateContainer}>
        <p className={styles.nftList.emptyStateText}>No public artworks available yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.nftList.grid}>
        {publicTokenIds.map((tokenId, index) => (
          <NFTCard
            key={`public-${tokenId}-${index}`}
            tokenId={tokenId}
            onImageClick={setSelectedImage}
            onNftBurned={() => {}} // No burn functionality for public view
            isHighlighted={false}
            isPublicView={true}
          />
        ))}
      </div>

      {/* Bildvergrößerungs-Modal */}
      {selectedImage && <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
    </>
  );
}
