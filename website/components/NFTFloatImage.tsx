import React, { useEffect, useState } from "react";
import { genAiNFTContractConfig, getConfiguredPublicClient } from "../utils/getChain";
import { extractPromptFromDescription } from "../utils/nftLoader";
import * as styles from "../layouts/styles";

interface NFTFloatImageProps {
  tokenId: number;
}

import { NFTMetadata } from "../types/components";

export function NFTFloatImage({ tokenId }: NFTFloatImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [nftTitle, setNftTitle] = useState<string | null>(null);
  const [nftDescription, setNftDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoize the contract config to prevent infinite re-renders
  // The stable genAiNFTContractConfig constant is used directly

  // Extract prompt from description for display (reusing utility function)
  const getPromptPreview = (description: string | null): string => {
    if (!description) return "";
    return extractPromptFromDescription(description, 60);
  };

  // Create descriptive title for the image
  const getImageTitle = (): string => {
    const promptPreview = getPromptPreview(nftDescription);
    if (promptPreview) {
      return `Article Illustration: ${promptPreview}`;
    }
    return nftTitle ? `Article Illustration: ${nftTitle}` : `Article Illustration: NFT #${tokenId}`;
  };

  // Use wagmi's public client instead of creating our own
  const publicClient = getConfiguredPublicClient();

  // Fetch metadata from tokenURI
  const fetchNFTMetadata = async (tokenURI: string): Promise<NFTMetadata | null> => {
    try {
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

  useEffect(() => {
    const loadNFTData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get token URI using public client
        const tokenURIResult = await publicClient.readContract({
          address: genAiNFTContractConfig.address,
          abi: genAiNFTContractConfig.abi,
          functionName: "tokenURI",
          args: [BigInt(tokenId)],
        });

        const tokenURI = tokenURIResult as string;

        // Fetch metadata
        const metadata = await fetchNFTMetadata(tokenURI);

        if (metadata) {
          setImageUrl(metadata.image || null);
          setNftTitle(metadata.name || null);
          setNftDescription(metadata.description || null);
        }

        setIsLoading(false);
      } catch (error) {
        console.error(`Error loading NFT ${tokenId}:`, error);
        setError(`Failed to load NFT #${tokenId}`);
        setIsLoading(false);
      }
    };

    loadNFTData();
  }, [tokenId, publicClient]);

  if (isLoading) {
    return (
      <div className={styles.nftFloat.container}>
        <div className={styles.nftFloat.loading}>
          <div className={styles.nftFloat.spinner}></div>
          <p className={styles.nftFloat.loadingText}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={styles.nftFloat.container}>
        <div className={styles.nftFloat.placeholder}>
          <p className={styles.nftFloat.placeholderText}>NFT #{tokenId}</p>
          <p className={styles.nftFloat.errorText}>Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.nftFloat.container}>
      <img src={imageUrl} alt={nftTitle || `NFT #${tokenId}`} className={styles.nftFloat.image} />
      <p className={styles.nftFloat.caption}>{getImageTitle()}</p>
    </div>
  );
}
