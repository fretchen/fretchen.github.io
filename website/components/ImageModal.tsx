import React from "react";
import { ImageModalProps } from "../types/components";
import { useToast } from "./Toast";
import { ChainInfoDisplay } from "./ChainBadge";
import { Modal } from "./Modal";
import * as styles from "../layouts/styles";
import { button } from "../styled-system/recipes";

// Bildvergrößerungs-Modal Komponente
export function ImageModal({ image, onClose }: ImageModalProps) {
  // Use the new toast hook
  const { showToast, ToastComponent } = useToast();

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
    <>
      {/* padded={false}: the image is full-bleed; modalInfo provides its own padding */}
      <Modal onClose={onClose} title={image.title} padded={false}>
        <img src={image.src} alt={image.alt} className={styles.nftCard.modalImage} decoding="async" />
        {(image.title || image.description || image.network) && (
          <div className={styles.nftCard.modalInfo}>
            {image.title && <h3 className={styles.nftCard.modalTitle}>{image.title}</h3>}
            {image.description && <p className={styles.nftCard.modalDescription}>{image.description}</p>}
            {image.network && <ChainInfoDisplay network={image.network} tokenId={image.tokenId} />}
            <div className={styles.nftCard.actions} style={{ justifyContent: "center", marginTop: "12px" }}>
              <button onClick={handleDownload} className={button()}>
                ⬇️ Download Full Size
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Component */}
      {ToastComponent}
    </>
  );
}
