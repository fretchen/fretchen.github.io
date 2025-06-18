import React, { useEffect, useState, useMemo } from "react";
import { createPublicClient, http } from "viem";
import { optimism } from "viem/chains";
import { getGenAiNFTContractConfig } from "../utils/getChain";
import { css } from "../styled-system/css";

interface NFTPreviewImageProps {
  tokenId?: number;
  fallbackImageUrl?: string;
  isVisible: boolean;
  position: { x: number; y: number };
  alt: string;
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
}

const previewStyles = {
  container: css({
    position: "fixed",
    pointerEvents: "none",
    zIndex: 1000,
    transition: "opacity 0.2s ease, transform 0.2s ease",
    opacity: 0,
    transform: "scale(0.9)",
    "&[data-visible='true']": {
      opacity: 1,
      transform: "scale(1)",
    },
  }),
  image: css({
    maxWidth: "200px",
    maxHeight: "150px",
    borderRadius: "md",
    boxShadow: "lg",
    backgroundColor: "white",
    border: "1px solid",
    borderColor: "gray.200",
  }),
};

/**
 * Lightweight NFT preview component for hover states
 * Reuses logic from NFTFloatImage but optimized for previews
 */
export const NFTPreviewImage: React.FC<NFTPreviewImageProps> = ({
  tokenId,
  fallbackImageUrl,
  isVisible,
  position,
  alt,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(fallbackImageUrl || null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const genAiNFTContractConfig = getGenAiNFTContractConfig();

  // Memoize the public client
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: optimism,
        transport: http(),
      }),
    [],
  );

  // Fetch metadata from tokenURI (only if no fallback and we have tokenId)
  const fetchNFTMetadata = async (tokenURI: string): Promise<NFTMetadata | null> => {
    try {
      if (tokenURI.startsWith("file://")) {
        return null;
      }

      const response = await fetch(tokenURI);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching NFT metadata for preview:", error);
      return null;
    }
  };

  useEffect(() => {
    // If we already have a fallback image, don't fetch from blockchain
    if (fallbackImageUrl) {
      setImageLoaded(false);
      return;
    }

    // Only fetch if we have tokenId and component is visible
    if (!tokenId || !isVisible) {
      return;
    }

    const loadNFTData = async () => {
      try {
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

        if (metadata?.image) {
          setImageUrl(metadata.image);
        }
      } catch (error) {
        console.error(`Error loading NFT preview ${tokenId}:`, error);
      }
    };

    loadNFTData();
  }, [tokenId, fallbackImageUrl, isVisible, publicClient, genAiNFTContractConfig]);

  // Don't render if no image URL
  if (!imageUrl) {
    return null;
  }

  return (
    <div
      className={previewStyles.container}
      style={{
        left: position.x + 10,
        top: position.y - 75,
      }}
      data-visible={isVisible && imageLoaded ? "true" : "false"}
    >
      <img
        src={imageUrl}
        alt={alt}
        className={previewStyles.image}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(false)}
      />
    </div>
  );
};
