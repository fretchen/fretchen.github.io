import React, { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { config } from "../wagmi.config";
import { getChain, getGenAiNFTContractConfig } from "../utils/getChain";
import * as styles from "../layouts/styles";

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

interface NFT {
  tokenId: bigint;
  tokenURI: string;
  metadata?: NFTMetadata;
  imageUrl?: string;
  isLoading?: boolean;
  error?: string;
}

export function NFTList() {
  const { address, isConnected } = useAccount();
  const chain = getChain();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

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

  // Load user's NFTs using enumerable functions
  const loadUserNFTs = async () => {
    if (!isConnected || !address || !userBalance || userBalance === 0n) {
      setNfts([]);
      return;
    }

    setIsLoadingMetadata(true);

    try {
      const nftList: NFT[] = [];

      // Create placeholder NFTs first
      for (let i = 0; i < Number(userBalance); i++) {
        nftList.push({
          tokenId: 0n,
          tokenURI: "",
          isLoading: true,
        });
      }
      setNfts([...nftList]);

      // Load each NFT's data sequentially
      for (let i = 0; i < Number(userBalance); i++) {
        try {
          // Get token ID at index using wagmi's readContract
          const tokenIdResult = await readContract(config, {
            ...genAiNFTContractConfig,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(i)],
          });

          const tokenId = tokenIdResult as bigint;

          // Get token URI
          const tokenURIResult = await readContract(config, {
            ...genAiNFTContractConfig,
            functionName: "tokenURI",
            args: [tokenId],
          });

          const tokenURI = tokenURIResult as string;

          // Fetch metadata
          const metadata = await fetchNFTMetadata(tokenURI);

          // Update NFT in list
          nftList[i] = {
            tokenId,
            tokenURI,
            metadata: metadata || undefined,
            imageUrl: metadata?.image,
            isLoading: false,
          };

          setNfts([...nftList]);
        } catch (error) {
          console.error(`Error loading NFT at index ${i}:`, error);
          nftList[i] = {
            tokenId: 0n,
            tokenURI: "",
            isLoading: false,
            error: `Failed to load NFT #${i}: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
          setNfts([...nftList]);
        }
      }
    } catch (error) {
      console.error("Error loading NFTs:", error);
      setNfts([]);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  useEffect(() => {
    loadUserNFTs();
  }, [address, isConnected, userBalance]);

  if (!isConnected) {
    return (
      <div className={styles.nftList.walletPrompt}>
        <p>Connect your wallet to view your NFTs</p>
      </div>
    );
  }

  const isLoading = isLoadingBalance || isLoadingMetadata;

  return (
    <div className={styles.nftList.container}>
      <div className={styles.nftList.heading}>
        <h2 className={styles.imageGen.columnHeading}>Your Generated NFTs ({userBalance?.toString() || "0"})</h2>
      </div>

      {isLoading && nfts.length === 0 ? (
        <div className={styles.nftList.loadingContainer}>
          <div className={styles.imageGen.spinner}></div>
          <p>Loading your NFTs...</p>
        </div>
      ) : userBalance === 0n || !userBalance ? (
        <div className={styles.nftList.emptyStateContainer}>
          <p className={styles.nftList.emptyStateText}>
            You haven&apos;t created any NFTs yet. Use the generator above to create your first one!
          </p>
        </div>
      ) : (
        <div className={styles.nftList.grid}>
          {nfts.map((nft, index) => (
            <NFTCard key={`${nft.tokenId}-${index}`} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
}

// NFT Card Component
function NFTCard({ nft }: { nft: NFT }) {
  return (
    <div className={styles.nftCard.container}>
      {nft.isLoading ? (
        <div className={styles.nftCard.loadingContainer}>
          <div className={styles.imageGen.spinner}></div>
          <p className={styles.nftCard.loadingText}>Loading NFT...</p>
        </div>
      ) : nft.error ? (
        <div className={styles.nftCard.errorContainer}>
          <div className={styles.nftCard.errorBox}>
            <p className={styles.nftCard.errorText}>{nft.error}</p>
          </div>
          <p className={styles.nftCard.tokenIdText}>Token ID: {nft.tokenId.toString()}</p>
        </div>
      ) : (
        <>
          {nft.imageUrl ? (
            <div className={styles.nftCard.imageContainer}>
              <img
                src={nft.imageUrl}
                alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                className={styles.nftCard.image}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling!.classList.remove("hidden");
                }}
              />
              <div className={styles.nftCard.imageError} style={{ display: "none" }}>
                Image not available
              </div>
            </div>
          ) : (
            <div className={styles.nftCard.imagePlaceholder}>No image available</div>
          )}

          <h3 className={styles.nftCard.title}>{nft.metadata?.name || `NFT #${nft.tokenId}`}</h3>

          {nft.metadata?.description && <p className={styles.nftCard.description}>{nft.metadata.description}</p>}

          <div className={styles.nftCard.footer}>
            <span>Token ID: {nft.tokenId.toString()}</span>
            {nft.tokenURI && (
              <a href={nft.tokenURI} target="_blank" rel="noopener noreferrer" className={styles.nftCard.metadataLink}>
                Metadata
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NFTList;
