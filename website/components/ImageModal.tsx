import React, { useState, useEffect } from "react";
import { ImageModalProps } from "../types/components";
import * as styles from "../layouts/styles";

// Bildvergrößerungs-Modal Komponente
export function ImageModal({ image, onClose }: ImageModalProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const toastTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to show toast notifications
  const showToastNotification = (message: string, type: "success" | "error" = "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    // Set new timeout and store reference
    const duration = type === "error" ? 4000 : 3000; // Longer duration for errors
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
      toastTimeoutRef.current = null;
    }, duration);
  };

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
      showToastNotification("Download failed. Please try again.");
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
              <button onClick={handleDownload} className={`${styles.nftCard.actionButton} ${styles.primaryButton}`}>
                ⬇️ Download Full Size
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {showToast && (
        <div className={styles.toast.container}>
          <div className={styles.toast.content}>
            <span className={styles.toast.icon}>{toastType === "success" ? "✅" : "❌"}</span>
            <span className={styles.toast.message}>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
