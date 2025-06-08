import React, { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { optimism } from "viem/chains";
import { getGenAiNFTContractConfig } from "../utils/getChain";
import { PublicNFT, NFTMetadata, ModalImageData } from "../types/components";
import * as styles from "../layouts/styles";
import { NFTCard } from "./NFTCard";
import { ImageModal } from "./ImageModal";

export function PublicNFTList() {
  const genAiNFTContractConfig = getGenAiNFTContractConfig();

  // Public NFTs state
  const [publicNfts, setPublicNfts] = useState<PublicNFT[]>([]);
  const [isLoadingPublicNfts, setIsLoadingPublicNfts] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ModalImageData | null>(null);

  // Create a public client for reading contract data without wallet connection
  const publicClient = createPublicClient({
    chain: optimism,
    transport: http(),
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

  // Load all public NFTs using getAllPublicTokens
  const loadPublicNFTs = async () => {
    setIsLoadingPublicNfts(true);

    try {
      // Get all public token IDs using the public client
      const publicTokenIds = await publicClient.readContract({
        address: genAiNFTContractConfig.address,
        abi: genAiNFTContractConfig.abi,
        functionName: "getAllPublicTokens",
      }) as bigint[];

      if (!publicTokenIds || publicTokenIds.length === 0) {
        setPublicNfts([]);
        return;
      }

      // Show loading placeholders initially
      const placeholderNFTs = publicTokenIds.map((tokenId) => ({
        tokenId,
        tokenURI: "",
        isLoading: true,
        owner: "",
      }));

      setPublicNfts(placeholderNFTs as PublicNFT[]);

      // Load all NFT data
      const nftPromises: Promise<PublicNFT>[] = publicTokenIds.map(async (tokenId) => {
        try {
          // Get token owner using public client
          const ownerResult = await publicClient.readContract({
            address: genAiNFTContractConfig.address,
            abi: genAiNFTContractConfig.abi,
            functionName: "ownerOf",
            args: [tokenId],
          });

          // Get token URI using public client
          const tokenURIResult = await publicClient.readContract({
            address: genAiNFTContractConfig.address,
            abi: genAiNFTContractConfig.abi,
            functionName: "tokenURI",
            args: [tokenId],
          });

          const tokenURI = tokenURIResult as string;
          const owner = ownerResult as string;

          // Fetch metadata
          const metadata = await fetchNFTMetadata(tokenURI);

          return {
            tokenId,
            tokenURI,
            metadata: metadata || undefined,
            imageUrl: metadata?.image,
            isLoading: false,
            owner,
          };
        } catch (error) {
          console.error(`Error loading public NFT ${tokenId}:`, error);
          return {
            tokenId,
            tokenURI: "",
            isLoading: false,
            error: `Failed to load NFT #${tokenId}: ${error instanceof Error ? error.message : "Unknown error"}`,
            owner: "",
          };
        }
      });

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

      setPublicNfts(sortedNFTs);
    } catch (error) {
      console.error("Error loading public NFTs:", error);
      setPublicNfts([]);
    } finally {
      setIsLoadingPublicNfts(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadPublicNFTs();
  }, []);

  if (isLoadingPublicNfts && publicNfts.length === 0) {
    return (
      <div className={styles.nftList.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading public artworks...</p>
      </div>
    );
  }

  if (publicNfts.length === 0) {
    return (
      <div className={styles.nftList.emptyStateContainer}>
        <p className={styles.nftList.emptyStateText}>No public artworks available yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.nftList.grid}>
        {publicNfts.map((nft, index) => (
          <NFTCard
            key={`public-${nft.tokenId}-${index}`}
            nft={nft}
            onImageClick={setSelectedImage}
            onNftBurned={() => {}} // No burn functionality for public view
            isHighlighted={false}
            isPublicView={true}
            owner={nft.owner}
          />
        ))}
      </div>

      {/* Bildvergrößerungs-Modal */}
      {selectedImage && <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
    </>
  );
}
