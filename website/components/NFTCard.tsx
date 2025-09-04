import React, { useState, useEffect, useMemo } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { readContract } from "wagmi/actions";
import { createPublicClient, http } from "viem";
import { optimism } from "viem/chains";
import { config } from "../wagmi.config";
import { getGenAiNFTContractConfig } from "../utils/getChain";
import { NFTCardProps, NFT, NFTMetadata } from "../types/components";
import { useToast } from "./Toast";
import { SimpleCollectButton } from "./SimpleCollectButton";
import * as styles from "../layouts/styles";
import { useLocale } from "../hooks/useLocale";
// NFT Card Component
export function NFTCard({
  tokenId,
  onImageClick,
  onNftBurned,
  onListedStatusChanged,
  isHighlighted = false,
  isPublicView = false,
}: NFTCardProps) {
  const { writeContract, isPending: isBurning, data: hash } = useWriteContract();
  const { writeContract: writeListingContract, isPending: isToggling, data: listingHash } = useWriteContract();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // NFT state - always load from blockchain
  const [nft, setNft] = useState<NFT>({
    tokenId,
    tokenURI: "",
    isLoading: true,
  });
  const [owner, setOwner] = useState<string>("");

  // Use the new toast hook
  const { showToast, ToastComponent } = useToast();

  // Memoize the public client to prevent recreation on every render
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
          address: genAiNFTContractConfig.address,
          abi: genAiNFTContractConfig.abi,
          functionName: "tokenURI",
          args: [tokenId],
        });

        const tokenURI = tokenURIResult as string;

        // Get owner if in public view
        let nftOwner = "";
        if (isPublicView) {
          const ownerResult = await publicClient.readContract({
            address: genAiNFTContractConfig.address,
            abi: genAiNFTContractConfig.abi,
            functionName: "ownerOf",
            args: [tokenId],
          });
          nftOwner = ownerResult as string;
          setOwner(nftOwner);
        }

        // Get listing status if not public view
        let isListed: boolean | undefined;
        if (!isPublicView) {
          try {
            const isListedResult = await readContract(config, {
              ...genAiNFTContractConfig,
              functionName: "isTokenListed",
              args: [tokenId],
            });
            isListed = isListedResult as boolean;
          } catch (error) {
            console.warn("Could not load listing status:", error);
          }
        }

        // Fetch metadata
        const metadata = await fetchNFTMetadata(tokenURI);

        setNft({
          tokenId,
          tokenURI,
          metadata: metadata || undefined,
          imageUrl: metadata?.image,
          isLoading: false,
          isListed,
        });
      } catch (error) {
        console.error(`Error loading NFT ${tokenId}:`, error);
        setNft({
          tokenId,
          tokenURI: "",
          isLoading: false,
          error: `Failed to load NFT #${tokenId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    };

    loadNFTData();
  }, [tokenId, isPublicView]);

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
  }, [isConfirmed]); // Entfernt: onNftBurned aus Dependencies

  // Handle successful listing status change
  useEffect(() => {
    if (isListingConfirmed && onListedStatusChanged) {
      // The UI is already updated optimistically, just show success toast
      showToast("Listing status updated successfully!", "success");
    }
  }, [isListingConfirmed]); // Entfernt: onListedStatusChanged, showToast aus Dependencies

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
                alt={nft.metadata?.name || `${useLocale({ label: "imagegen.artwork" })} #${nft.tokenId}`}
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
                {useLocale({ label: "imagegen.listed" })}
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
                ⬇️ {useLocale({ label: "imagegen.download" })}
              </button>
            )}
            <button
              onClick={handleShare}
              className={`${styles.nftCard.actionButton} ${styles.secondaryButton}`}
              title="Share your artwork on the marketplace"
            >
              📤 {useLocale({ label: "imagegen.share" })}
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
                {isBurning
                  ? "🗑️ Deleting..."
                  : isConfirming
                    ? "⏳ Confirming..."
                    : `🗑️ ${useLocale({ label: "imagegen.delete" })}`}
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
