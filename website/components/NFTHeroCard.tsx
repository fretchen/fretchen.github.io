import React, { useEffect, useState, useMemo } from "react";
import { createPublicClient, http } from "viem";
import { optimism } from "viem/chains";
import { getGenAiNFTContractConfig } from "../utils/getChain";
import * as styles from "../layouts/styles";

interface NFTHeroCardProps {
  tokenId: number;
  title?: string;
  description?: string;
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
}

export function NFTHeroCard({ tokenId, title: _title, description: _description }: NFTHeroCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [nftTitle, setNftTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    console.log("NFTHeroCard loading tokenId:", tokenId);
    
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
        console.log("Fetched tokenURI:", tokenURI);

        // Fetch metadata
        const metadata = await fetchNFTMetadata(tokenURI);
        console.log("Fetched metadata:", metadata);

        if (metadata) {
          setImageUrl(metadata.image || null);
          setNftTitle(metadata.name || null);
        }

        setIsLoading(false);
      } catch (error) {
        console.error(`Error loading NFT ${tokenId}:`, error);
        setError(`Failed to load NFT #${tokenId}`);
        setIsLoading(false);
      }
    };

    loadNFTData();
  }, [tokenId, publicClient, genAiNFTContractConfig]);

  if (isLoading) {
    return (
      <div className={styles.heroCard.container}>
        <div className={styles.heroCard.loading}>
          <div className={styles.spinner}></div>
          <p>Loading NFT...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.heroCard.container}>
        <div className={styles.heroCard.error}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.heroCard.container}>
      <div className={styles.heroCard.nftContainer}>
        {imageUrl ? (
          <div className={styles.heroCard.imageContainer}>
            <img src={imageUrl} alt={nftTitle || `NFT #${tokenId}`} className={styles.heroCard.image} />
            {nftTitle && <p className={styles.heroCard.nftTitle}>{nftTitle}</p>}
          </div>
        ) : (
          <div className={styles.heroCard.placeholder}>
            <p>NFT #{tokenId} - Image not available</p>
          </div>
        )}
      </div>
    </div>
  );
}
