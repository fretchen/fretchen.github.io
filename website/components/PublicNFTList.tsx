import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPublicClient, http } from "viem";
import { optimism } from "viem/chains";
import { getGenAiNFTContractConfig } from "../utils/getChain";
import { ModalImageData } from "../types/components";
import * as styles from "../layouts/styles";
import { NFTCard } from "./NFTCard";
import { ImageModal } from "./ImageModal";

export function PublicNFTList() {
  const genAiNFTContractConfig = getGenAiNFTContractConfig();

  // Public NFTs state - now just store token IDs
  const [publicTokenIds, setPublicTokenIds] = useState<bigint[]>([]);
  const [isLoadingTokenIds, setIsLoadingTokenIds] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ModalImageData | null>(null);

  // Create a public client for reading contract data without wallet connection (memoized)
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: optimism,
        transport: http(),
      }),
    [],
  );

  // Load all public token IDs using getAllPublicTokens
  const loadPublicTokenIds = useCallback(async () => {
    setIsLoadingTokenIds(true);

    try {
      // Get all public token IDs using the public client
      const tokenIds = (await publicClient.readContract({
        address: genAiNFTContractConfig.address,
        abi: genAiNFTContractConfig.abi,
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
  }, []); // Keine Dependencies, da publicClient und genAiNFTContractConfig stabil sind

  // Load data when component mounts
  useEffect(() => {
    loadPublicTokenIds();
  }, []);

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
