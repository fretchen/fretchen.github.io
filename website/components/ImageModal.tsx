import React, { useEffect } from "react";
import { ImageModalProps } from "../types/components";
import { useToast } from "./Toast";
import { ChainInfoDisplay } from "./ChainBadge";
import * as styles from "../layouts/styles";

// Bildvergrößerungs-Modal Komponente
export function ImageModal({ image, onClose }: ImageModalProps) {
  // Use the new toast hook
  const { showToast, ToastComponent } = useToast();

  // Cleanup timeout on unmount (removed as useToast handles cleanup)

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
      showToast("Download failed. Please try again.", "error");
    }
  };

  return (
    <div className={styles.nftCard.modalOverlay} onClick={onClose}>
      <div className={styles.nftCard.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.nftCard.modalClose} onClick={onClose}>
          ✕
        </button>
        <img src={image.src} alt={image.alt} className={styles.nftCard.modalImage} />
        {(image.title || image.description || image.network) && (
          <div className={styles.nftCard.modalInfo}>
            {image.title && <h3 className={styles.nftCard.modalTitle}>{image.title}</h3>}
            {image.description && <p className={styles.nftCard.modalDescription}>{image.description}</p>}
            {image.network && <ChainInfoDisplay network={image.network} tokenId={image.tokenId} />}
            <div className={styles.nftCard.actions} style={{ justifyContent: "center", marginTop: "12px" }}>
              <button onClick={handleDownload} className={`${styles.nftCard.actionButton} ${styles.primaryButton}`}>
                ⬇️ Download Full Size
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Component */}
      {ToastComponent}
    </div>
  );
}
