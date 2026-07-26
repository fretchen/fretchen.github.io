import React, { useEffect } from "react";
import { modal } from "../layouts/styles";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Shown as the dialog heading and used for the accessible label. */
  title?: string;
  /** Accessible label for the close button (localized by the caller). Defaults to "Close". */
  closeLabel?: string;
  /**
   * Wrap children in a padded body. True for text/content dialogs (the default);
   * set false for edge-to-edge content like a full-bleed image that manages its own padding.
   */
  padded?: boolean;
}

/**
 * Shared modal shell for the whole site — one consistent dialog look (overlay, white rounded
 * card, circular ✕ top-right, click-outside + Escape to close). Presentational only; callers
 * provide the body. Used by ImageModal (NFT zoom) and SupportChainModal (donation guide).
 */
export function Modal({ onClose, children, title, closeLabel = "Close", padded = true }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className={modal.overlay} onClick={onClose}>
      <div
        className={modal.content}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button className={modal.close} onClick={onClose} aria-label={closeLabel} type="button">
          ✕
        </button>
        {padded ? (
          <div className={modal.body}>
            {title && <h3 className={modal.title}>{title}</h3>}
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
