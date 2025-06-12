import React, { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { getGenAiNFTContractConfig } from "../utils/getChain";
import { NFTCardProps } from "../types/components";
import { useToast } from "./Toast";
import { SimpleCollectButton } from "./SimpleCollectButton";
import * as styles from "../layouts/styles";

// NFT Card Component
export function NFTCard({
  nft,
  onImageClick,
  onNftBurned,
  onListedStatusChanged,
  isHighlighted = false,
  isPublicView = false,
  owner,
}: NFTCardProps) {
  const { writeContract, isPending: isBurning, data: hash } = useWriteContract();
  const { writeContract: writeListingContract, isPending: isToggling, data: listingHash } = useWriteContract();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Use the new toast hook
  const { showToast, ToastComponent } = useToast();

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
   * Uses the Optimism network OpenSea URL format
   */
  const handleShare = async () => {
    const contractAddress = genAiNFTContractConfig.address;
    const openSeaUrl = `https://opensea.io/item/optimism/${contractAddress}/${nft.tokenId}`;

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
      await writeContract({
        ...genAiNFTContractConfig,
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

    const newListedStatus = !nft.isListed;
    const statusText = newListedStatus ? "public" : "private";

    try {
      // Update UI optimistically
      onListedStatusChanged(nft.tokenId, newListedStatus);

      // Call contract
      await writeListingContract({
        ...genAiNFTContractConfig,
        functionName: "setTokenListed",
        args: [nft.tokenId, newListedStatus],
      });
    } catch (error) {
      console.error("Failed to update listing status:", error);
      // Revert optimistic update on error
      onListedStatusChanged(nft.tokenId, !newListedStatus);
      showToast(`Failed to set artwork as ${statusText}. Please try again.`, "error");
    }
  };

  return (
    <div className={`${styles.nftCard.container} ${isHighlighted ? styles.nftCard.highlighted : ""}`}>
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
          {nft.imageUrl ? (
            <div className={styles.nftCard.imageContainer}>
              <img
                src={nft.imageUrl}
                alt={nft.metadata?.name || `Artwork #${nft.tokenId}`}
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

          <h3 className={styles.nftCard.title}>{nft.metadata?.name || `Artwork #${nft.tokenId}`}</h3>

          {nft.metadata?.description && <p className={styles.nftCard.description}>{nft.metadata.description}</p>}

          <div className={styles.nftCard.footer}>
            <span>ID: {nft.tokenId.toString()}</span>
            {!isPublicView && onListedStatusChanged && nft.isListed !== undefined && (
              <label
                className={styles.nftCard.checkboxLabel}
                title={`${nft.isListed ? "NFT is publicly listed" : "NFT is private"}`}
              >
                <input
                  type="checkbox"
                  checked={nft.isListed}
                  onChange={handleToggleListing}
                  disabled={isToggling || isListingConfirming}
                  className={styles.nftCard.checkbox}
                />
                Listed
              </label>
            )}
            {isPublicView && owner && (
              <span title={`Owned by ${owner}`}>
                Owner: {owner.slice(0, 6)}...{owner.slice(-4)}
              </span>
            )}
          </div>

          {/* Aktions-Buttons */}
          <div className={styles.nftCard.actions}>
            {nft.imageUrl && (
              <button
                onClick={handleImageClick}
                className={`${styles.nftCard.actionButton} ${styles.secondaryButton}`}
                title="View full size"
              >
                🔍 Zoom
              </button>
            )}
            {nft.imageUrl && (
              <button
                onClick={handleDownload}
                className={`${styles.nftCard.actionButton} ${styles.primaryButton}`}
                title="Download image"
              >
                ⬇️ Download
              </button>
            )}
            <button
              onClick={handleShare}
              className={`${styles.nftCard.actionButton} ${styles.secondaryButton}`}
              title="Share your artwork on the marketplace"
            >
              📤 Share
            </button>
            {isPublicView && <SimpleCollectButton genImTokenId={nft.tokenId} />}
            {!isPublicView && (
              <button
                onClick={handleBurn}
                disabled={isBurning || isConfirming}
                className={`${styles.nftCard.actionButton} ${isBurning || isConfirming ? styles.secondaryButton : styles.errorStatus}`}
                title="Delete artwork (permanent)"
                style={{ opacity: isBurning || isConfirming ? 0.6 : 1 }}
              >
                {isBurning ? "🗑️ Deleting..." : isConfirming ? "⏳ Confirming..." : "🗑️ Delete"}
              </button>
            )}
          </div>
        </>
      )}

      {/* Toast Component */}
      {ToastComponent}
    </div>
  );
}
