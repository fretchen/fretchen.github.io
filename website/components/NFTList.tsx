import React, { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
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

export interface NFTListProps {
  newlyCreatedNFT?: { tokenId: bigint; imageUrl: string };
  onNewNFTDisplayed?: () => void;
}

export function NFTList({ newlyCreatedNFT, onNewNFTDisplayed }: NFTListProps = {}) {
  const { address, isConnected } = useAccount();
  const chain = getChain();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [highlightedNFT, setHighlightedNFT] = useState<bigint | null>(null);
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    alt: string;
    title?: string;
    description?: string;
  } | null>(null);

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
    if (!isConnected || !address) {
      setNfts([]);
      return;
    }

    setIsLoadingMetadata(true);

    try {
      // Get fresh balance directly from contract to avoid stale state
      const freshBalance = await readContract(config, {
        ...genAiNFTContractConfig,
        functionName: "balanceOf",
        args: [address],
      });

      if (!freshBalance || freshBalance === 0n) {
        setNfts([]);
        return;
      }

      // Show loading placeholders initially
      const placeholderNFTs = Array.from({ length: Number(freshBalance) }, () => ({
        tokenId: 0n,
        tokenURI: "",
        isLoading: true,
      }));

      setNfts(placeholderNFTs);

      // Load all NFT data first, then sort by tokenId
      const nftPromises: Promise<NFT>[] = [];

      for (let i = 0; i < Number(freshBalance); i++) {
        const nftPromise = (async () => {
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

            return {
              tokenId,
              tokenURI,
              metadata: metadata || undefined,
              imageUrl: metadata?.image,
              isLoading: false,
            };
          } catch (error) {
            console.error(`Error loading NFT at index ${i}:`, error);
            return {
              tokenId: 0n,
              tokenURI: "",
              isLoading: false,
              error: `Failed to load NFT #${i}: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
          }
        })();

        nftPromises.push(nftPromise);
      }

      // Wait for all NFTs to load
      const loadedNFTs = await Promise.all(nftPromises);

      // Sort by tokenId in descending order (newest first)
      const sortedNFTs = loadedNFTs.sort((a, b) => {
        // Handle error cases - put them at the end
        if (a.error && !b.error) return 1;
        if (!a.error && b.error) return -1;
        if (a.error && b.error) return 0;

        // Sort by tokenId (descending - newest first)
        return Number(b.tokenId - a.tokenId);
      });

      // Update state with sorted NFTs
      setNfts(sortedNFTs);
    } catch (error) {
      console.error("Error loading NFTs:", error);
      setNfts([]);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      loadUserNFTs();
    }
  }, [address, isConnected, userBalance]); // Keep userBalance for automatic updates

  // Handle newly created NFT
  useEffect(() => {
    if (newlyCreatedNFT) {
      // Set highlighting for the new NFT
      setHighlightedNFT(newlyCreatedNFT.tokenId);

      // Create temporary NFT for immediate display
      const tempNFT: NFT = {
        tokenId: newlyCreatedNFT.tokenId,
        tokenURI: "",
        imageUrl: newlyCreatedNFT.imageUrl,
        isLoading: false,
      };

      // Add to top of list, but ensure we don't duplicate if it already exists
      setNfts((prevNfts) => {
        const existingIndex = prevNfts.findIndex((nft) => nft.tokenId === newlyCreatedNFT.tokenId);
        if (existingIndex !== -1) {
          // Update existing NFT with image
          const updatedNfts = [...prevNfts];
          updatedNfts[existingIndex] = { ...updatedNfts[existingIndex], imageUrl: newlyCreatedNFT.imageUrl };
          return updatedNfts;
        } else {
          // Add new NFT at the top
          return [tempNFT, ...prevNfts];
        }
      });

      // Remove highlighting after 5 seconds - no automatic reload needed
      setTimeout(() => {
        setHighlightedNFT(null);
        onNewNFTDisplayed?.();
      }, 5000);
    }
  }, [newlyCreatedNFT, onNewNFTDisplayed]);

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
            <NFTCard
              key={`${nft.tokenId}-${index}`}
              nft={nft}
              onImageClick={setSelectedImage}
              onNftBurned={() => loadUserNFTs()}
              isHighlighted={highlightedNFT === nft.tokenId}
            />
          ))}
        </div>
      )}

      {/* Bildvergrößerungs-Modal */}
      {selectedImage && <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  );
}

// NFT Card Component
interface NFTCardProps {
  nft: NFT;
  onImageClick: (image: { src: string; alt: string; title?: string; description?: string }) => void;
  onNftBurned: () => void;
  isHighlighted?: boolean;
}

function NFTCard({ nft, onImageClick, onNftBurned, isHighlighted = false }: NFTCardProps) {
  const { writeContract, isPending: isBurning, data: hash } = useWriteContract();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();

  // Warte auf Transaktionsbestätigung
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Aktualisiere die NFT-Liste nach erfolgreicher Bestätigung
  useEffect(() => {
    if (isConfirmed) {
      // Add a small delay to ensure blockchain state is consistent
      setTimeout(() => {
        onNftBurned();
      }, 1000);
    }
  }, [isConfirmed, onNftBurned]);

  const handleImageClick = () => {
    if (nft.imageUrl) {
      onImageClick({
        src: nft.imageUrl,
        alt: nft.metadata?.name || `NFT #${nft.tokenId}`,
        title: nft.metadata?.name,
        description: nft.metadata?.description,
      });
    }
  };

  const handleDownload = async () => {
    if (!nft.imageUrl) return;

    try {
      const response = await fetch(nft.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${nft.metadata?.name || `NFT-${nft.tokenId}`}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    }
  };

  const handleBurn = async () => {
    if (
      !confirm(
        `Are you sure you want to burn NFT "${nft.metadata?.name || `#${nft.tokenId}`}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await writeContract({
        ...genAiNFTContractConfig,
        functionName: "burn",
        args: [nft.tokenId],
      });
    } catch (error) {
      console.error("Burn failed:", error);
      alert("Failed to burn NFT. Please try again.");
    }
  };

  return (
    <div className={`${styles.nftCard.container} ${isHighlighted ? styles.nftCard.highlighted : ""}`}>
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
                onClick={handleImageClick}
                style={{ cursor: "pointer" }}
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
          </div>

          {/* Aktions-Buttons */}
          <div className={styles.nftCard.actions}>
            {nft.imageUrl && (
              <button
                onClick={handleImageClick}
                className={`${styles.nftCard.actionButton} ${styles.nftCard.zoomButton}`}
                title="View full size"
              >
                🔍 Zoom
              </button>
            )}
            {nft.imageUrl && (
              <button
                onClick={handleDownload}
                className={`${styles.nftCard.actionButton} ${styles.nftCard.downloadButton}`}
                title="Download image"
              >
                ⬇️ Download
              </button>
            )}
            <button
              onClick={handleBurn}
              disabled={isBurning || isConfirming}
              className={`${styles.nftCard.actionButton} ${isBurning || isConfirming ? styles.nftCard.disabledButton : styles.nftCard.burnButton}`}
              title="Burn NFT (permanent)"
            >
              {isBurning ? "🔥 Burning..." : isConfirming ? "⏳ Confirming..." : "🔥 Burn"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Bildvergrößerungs-Modal Komponente
interface ImageModalProps {
  image: {
    src: string;
    alt: string;
    title?: string;
    description?: string;
  };
  onClose: () => void;
}

function ImageModal({ image, onClose }: ImageModalProps) {
  // Schließen bei Escape-Taste
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const response = await fetch(image.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${image.title || "NFT-image"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    }
  };

  return (
    <div className={styles.nftCard.modalOverlay} onClick={onClose}>
      <div className={styles.nftCard.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.nftCard.modalClose} onClick={onClose}>
          ✕
        </button>
        <img src={image.src} alt={image.alt} className={styles.nftCard.modalImage} />
        {(image.title || image.description) && (
          <div className={styles.nftCard.modalInfo}>
            {image.title && <h3 className={styles.nftCard.modalTitle}>{image.title}</h3>}
            {image.description && <p className={styles.nftCard.modalDescription}>{image.description}</p>}
            <div className={styles.nftCard.actions} style={{ justifyContent: "center", marginTop: "12px" }}>
              <button
                onClick={handleDownload}
                className={`${styles.nftCard.actionButton} ${styles.nftCard.downloadButton}`}
              >
                ⬇️ Download Full Size
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NFTList;
