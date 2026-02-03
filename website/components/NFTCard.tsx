import React, { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { useNFTListedStatus } from "../hooks/useNFTListedStatus";
import { getGenAiNFTAddress, GenImNFTv4ABI, isMainnet, fromCAIP2 } from "@fretchen/chain-utils";
import { useConfiguredPublicClient } from "../hooks/useConfiguredPublicClient";
import { NFTCardProps, NFT, NFTMetadata } from "../types/components";
import { useToast } from "./Toast";
import { SimpleCollectButton } from "./SimpleCollectButton";
import { ChainBadge } from "./ChainBadge";
import * as styles from "../layouts/styles";
import { useLocale } from "../hooks/useLocale";
// NFT Card Component
export function NFTCard({
  tokenId,
  network,
  onImageClick,
  onNftBurned,
  onListedStatusChanged,
  isHighlighted = false,
  isPublicView = false,
  preloadedImageUrl,
  preloadedMetadata,
}: NFTCardProps) {
  const { writeContract, isPending: isBurning, data: hash } = useWriteContract();
  const { writeContract: writeListingContract, isPending: isToggling, data: listingHash } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // NFT state - initialize with preloaded data if available
  const [nft, setNft] = useState<NFT>({
    tokenId,
    tokenURI: "",
    imageUrl: preloadedImageUrl,
    metadata: preloadedMetadata,
    isLoading: !preloadedImageUrl, // Not loading if we have preloaded data
  });
  const [owner, setOwner] = useState<string>("");

  // Use the new toast hook
  const { showToast, ToastComponent } = useToast();

  // Locale labels - moved to component level to fix hook order
  const listedLabel = useLocale({ label: "imagegen.listed" });
  const downloadLabel = useLocale({ label: "imagegen.download" });

  const deleteLabel = useLocale({ label: "imagegen.delete" });

  // Get contract address from the network prop
  const contractAddress = getGenAiNFTAddress(network);
  const chainId = fromCAIP2(network);

  // Helper to switch to the correct chain before transactions
  const switchToCorrectChain = async (): Promise<boolean> => {
    try {
      await switchChainAsync({ chainId });
      return true;
    } catch (err) {
      console.error("Failed to switch chain:", err);
      return false;
    }
  };

  // Use the extracted hook for listing status
  // Only enabled when:
  // 1. Not public view (owners can toggle listing)
  // 2. Token data loaded successfully (no error, not loading)
  // This prevents contract calls for non-existent/burned tokens
  const tokenDataLoaded = !nft.isLoading && !nft.error;
  const { isListed, setOptimisticListed } = useNFTListedStatus({
    tokenId,
    network,
    enabled: !isPublicView && tokenDataLoaded,
  });

  // Use the custom hook for a stable public client reference
  const publicClient = useConfiguredPublicClient(network);

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

  // Load NFT data from blockchain
  useEffect(() => {
    const loadNFTData = async () => {
      try {
        setNft((prev) => ({ ...prev, isLoading: true, error: undefined }));

        // Get token URI using public client
        const tokenURIResult = await publicClient.readContract({
          address: contractAddress,
          abi: GenImNFTv4ABI,
          functionName: "tokenURI",
          args: [tokenId],
        });

        const tokenURI = tokenURIResult as string;

        // Skip fetching if tokenURI is empty and we have preloaded data
        if (!tokenURI && (preloadedImageUrl || preloadedMetadata)) {
          setNft((prev) => ({
            ...prev,
            tokenURI: "",
            isLoading: false,
          }));
          return;
        }

        // Get owner if in public view
        let nftOwner = "";
        if (isPublicView) {
          const ownerResult = await publicClient.readContract({
            address: contractAddress,
            abi: GenImNFTv4ABI,
            functionName: "ownerOf",
            args: [tokenId],
          });
          nftOwner = ownerResult as string;
          setOwner(nftOwner);
        }

        // Note: isListed is now handled by useNFTListedStatus hook

        // Fetch metadata only if tokenURI is available
        let metadata = preloadedMetadata; // Keep preloaded metadata as fallback
        let finalImageUrl = preloadedImageUrl; // Keep preloaded image as fallback

        if (tokenURI) {
          const contractMetadata = await fetchNFTMetadata(tokenURI);
          if (contractMetadata) {
            metadata = contractMetadata;
            finalImageUrl = contractMetadata.image;
          }
        }

        setNft({
          tokenId,
          tokenURI,
          metadata,
          imageUrl: finalImageUrl,
          isLoading: false,
        });
      } catch (error) {
        console.error(`Error loading NFT ${tokenId}:`, error);
        setNft({
          tokenId,
          tokenURI: "",
          imageUrl: preloadedImageUrl, // Keep preloaded image on error
          metadata: preloadedMetadata, // Keep preloaded metadata on error
          isLoading: false,
          error: `Failed to load NFT #${tokenId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    };

    loadNFTData();
  }, [tokenId, isPublicView, preloadedImageUrl, preloadedMetadata, publicClient]);

  // Warte auf Transaktionsbestätigung für Burn
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Warte auf Transaktionsbestätigung für Listing-Toggle
  const { isLoading: isListingConfirming, isSuccess: isListingConfirmed } = useWaitForTransactionReceipt({
    hash: listingHash,
  });

  // Aktualisiere die NFT-Liste nach erfolgreicher Burn-Bestätigung
  useEffect(() => {
    if (isConfirmed) {
      // Add a small delay to ensure blockchain state is consistent
      setTimeout(() => {
        onNftBurned();
      }, 1000);
    }
  }, [isConfirmed, onNftBurned]);

  // Handle successful listing status change
  useEffect(() => {
    if (isListingConfirmed && onListedStatusChanged) {
      // The UI is already updated optimistically, just show success toast
      showToast("Listing status updated successfully!", "success");
    }
  }, [isListingConfirmed, onListedStatusChanged, showToast]);

  const handleImageClick = () => {
    if (nft.imageUrl) {
      onImageClick({
        src: nft.imageUrl,
        alt: nft.metadata?.name || `Artwork #${nft.tokenId}`,
        title: nft.metadata?.name,
        description: nft.metadata?.description,
        network,
        tokenId: nft.tokenId,
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
      link.download = `${nft.metadata?.name || `Artwork-${nft.tokenId}`}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      showToast("Download failed. Please try again.", "error");
    }
  };

  /**
   * Copies the OpenSea marketplace URL to clipboard for easy sharing
   * Supports Optimism and Base networks
   */
  const handleShare = async () => {
    // Determine OpenSea network based on chain
    let openSeaNetwork: string;
    if (network === "eip155:10") {
      openSeaNetwork = "optimism";
    } else if (network === "eip155:8453") {
      openSeaNetwork = "base";
    } else if (network === "eip155:11155420") {
      openSeaNetwork = "optimism-sepolia";
    } else {
      openSeaNetwork = "base-sepolia";
    }
    const openSeaUrl = `https://opensea.io/item/${openSeaNetwork}/${contractAddress}/${nft.tokenId}`;

    try {
      await navigator.clipboard.writeText(openSeaUrl);
      // Show modern toast notification
      showToast("OpenSea URL copied to clipboard!", "success");
    } catch (error) {
      console.error("Failed to copy URL:", error);
      // Fallback: open in new tab if clipboard fails
      window.open(openSeaUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleBurn = async () => {
    if (!showDeleteConfirmation) {
      // First click: Show warning and ask for confirmation
      setShowDeleteConfirmation(true);
      showToast(
        `⚠️ Click Delete again to permanently remove "${nft.metadata?.name || `Artwork #${nft.tokenId}`}"`,
        "warning",
      );

      // Reset confirmation state after 5 seconds
      setTimeout(() => {
        setShowDeleteConfirmation(false);
      }, 5000);

      return;
    }

    // Second click: Proceed with deletion
    setShowDeleteConfirmation(false);

    try {
      // Switch chain if needed before transaction
      const switched = await switchToCorrectChain();
      if (!switched) {
        showToast("Please switch to the correct network.", "error");
        return;
      }

      await writeContract({
        address: contractAddress,
        abi: GenImNFTv4ABI,
        functionName: "burn",
        args: [nft.tokenId],
      });
    } catch (error) {
      console.error("Delete failed:", error);
      showToast("Failed to delete artwork. Please try again.", "error");
    }
  };

  const handleToggleListing = async () => {
    if (!onListedStatusChanged) return;

    const newListedStatus = !isListed;
    const statusText = newListedStatus ? "public" : "private";

    try {
      // Switch chain if needed before transaction
      const switched = await switchToCorrectChain();
      if (!switched) {
        showToast("Please switch to the correct network.", "error");
        return;
      }

      // Update UI optimistically (both local state and parent)
      setOptimisticListed(newListedStatus);
      onListedStatusChanged(nft.tokenId, newListedStatus);

      // Call contract
      await writeListingContract({
        address: contractAddress,
        abi: GenImNFTv4ABI,
        functionName: "setTokenListed",
        args: [nft.tokenId, newListedStatus],
      });
    } catch (error) {
      console.error("Failed to update listing status:", error);
      // Revert optimistic update on error
      setOptimisticListed(!newListedStatus);
      onListedStatusChanged(nft.tokenId, !newListedStatus);
      showToast(`Failed to set artwork as ${statusText}. Please try again.`, "error");
    }
  };

  return (
    <div
      className={`${styles.nftCard.container} ${isHighlighted ? styles.nftCard.highlighted : ""} group`}
      onClick={handleImageClick}
    >
      {nft.isLoading ? (
        <div className={styles.nftCard.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.nftCard.loadingText}>Loading artwork...</p>
        </div>
      ) : nft.error ? (
        <div className={styles.nftCard.errorContainer}>
          <div className={styles.nftCard.errorBox}>
            <p className={styles.nftCard.errorText}>{nft.error}</p>
          </div>
          <p className={styles.nftCard.tokenIdText}>ID: {nft.tokenId.toString()}</p>
        </div>
      ) : (
        <>
          {/* Vollbild Image/Placeholder */}
          {nft.imageUrl ? (
            <div className={styles.nftCard.imageContainer}>
              <img
                src={nft.imageUrl}
                alt={nft.metadata?.name || `Artwork #${nft.tokenId}`}
                className={styles.nftCard.image}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling!.classList.remove("hidden");
                }}
              />
              <div className={styles.nftCard.imageError} style={{ display: "none" }}>
                📷 Image not available
              </div>
            </div>
          ) : (
            <div className={styles.nftCard.imagePlaceholder}>📷 No image available</div>
          )}

          {/* Corner Badge - Token ID */}
          <div className={styles.nftCard.cornerBadge}>#{nft.tokenId.toString()}</div>

          {/* Chain Badge - shows which network this NFT is on */}
          <ChainBadge network={network} size="sm" position="bottom-right" />

          {/* Listed Badge (nur wenn listed) */}
          {!isPublicView && isListed && <div className={styles.nftCard.listedBadge}>✓ {listedLabel}</div>}

          {/* Owner Badge (nur in Public View) */}
          {isPublicView && owner && (
            <div className={styles.nftCard.ownerBadge}>
              👤 {owner.slice(0, 6)}...{owner.slice(-4)}
            </div>
          )}

          {/* Actions Overlay (nur bei Hover sichtbar) */}
          <div className={styles.nftCard.actionsOverlay}>
            {/* Alle Actions als einheitliche Icon-Buttons in einer Zeile */}
            <div className={styles.nftCard.actions}>
              {/* Download */}
              {nft.imageUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className={styles.nftCard.compactSecondaryButton}
                  title={`${downloadLabel} image`}
                >
                  ⬇️
                </button>
              )}

              {/* Zoom */}
              {nft.imageUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick();
                  }}
                  className={styles.nftCard.compactSecondaryButton}
                  title="View full size"
                >
                  🔍
                </button>
              )}

              {/* Share */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className={styles.nftCard.compactSecondaryButton}
                title="Share artwork"
              >
                📤
              </button>

              {/* Listed Toggle (nur private view) */}
              {!isPublicView && onListedStatusChanged && isListed !== undefined && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleListing();
                  }}
                  disabled={isToggling || isListingConfirming}
                  className={styles.nftCard.compactSecondaryButton}
                  title={`${isListed ? "Make private" : "Make public"}`}
                >
                  {isListed ? "🔓" : "🔒"}
                </button>
              )}

              {/* Collect Button (nur public view) */}
              {isPublicView && <SimpleCollectButton genImTokenId={nft.tokenId} />}

              {/* Delete (nur private view) */}
              {!isPublicView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBurn();
                  }}
                  disabled={isBurning || isConfirming}
                  className={styles.nftCard.compactSecondaryButton}
                  title={`${deleteLabel} artwork (permanent)`}
                  style={{
                    backgroundColor: isBurning || isConfirming ? "rgba(0,0,0,0.3)" : "rgba(220, 38, 38, 0.8)",
                    opacity: isBurning || isConfirming ? 0.6 : 1,
                  }}
                >
                  {isBurning ? "⏳" : isConfirming ? "⏳" : "🗑️"}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Toast Component */}
      {ToastComponent}
    </div>
  );
}
