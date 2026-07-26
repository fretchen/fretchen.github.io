import React from "react";
import * as styles from "../layouts/styles";
import { useLocale } from "../hooks/useLocale";
import { Modal } from "./Modal";

interface SupportChainModalProps {
  onClose: () => void;
  onSwitchNetwork: () => void | Promise<void>;
  isSwitching: boolean;
  /** Set once a donation attempt after switching still fails (e.g. insufficient USDC balance) */
  showGetUsdc?: boolean;
  errorMessage?: string | null;
}

/**
 * Guided overlay shown when a reader tries to donate while their wallet is on an
 * unsupported chain (e.g. Ethereum mainnet). One single, KISS view: a plain-language
 * explanation, one primary "Switch to Optimism" action (which triggers the wallet's own
 * confirmation — we can't switch silently), and — once a donation after switching still
 * fails from insufficient balance — a link to get USDC. Uses the shared Modal shell so it
 * matches the rest of the site's dialogs.
 */
export function SupportChainModal({
  onClose,
  onSwitchNetwork,
  isSwitching,
  showGetUsdc = false,
  errorMessage,
}: SupportChainModalProps) {
  const title = useLocale({ label: "metadataLine.modalTitle" });
  const body = useLocale({ label: "metadataLine.modalBody" });
  const switchButtonLabel = useLocale({ label: "metadataLine.modalSwitchButton" });
  const switchNote = useLocale({ label: "metadataLine.modalSwitchNote" });
  const getUsdcPrompt = useLocale({ label: "metadataLine.modalGetUsdcPrompt" });
  const getUsdcLink = useLocale({ label: "metadataLine.modalGetUsdcLink" });
  const closeAria = useLocale({ label: "metadataLine.modalCloseAria" });

  return (
    <Modal onClose={onClose} title={title} closeLabel={closeAria}>
      <p className={styles.modal.text}>{body}</p>

      {errorMessage && (
        <p className={styles.modal.error}>{errorMessage}</p>
      )}

      {showGetUsdc && (
        <p className={styles.modal.text}>
          {getUsdcPrompt}{" "}
          <a href="https://app.optimism.io/bridge" target="_blank" rel="noopener noreferrer">
            {getUsdcLink}
          </a>
        </p>
      )}

      <div className={styles.modal.actions}>
        <button
          className={styles.primaryButton}
          onClick={() => void onSwitchNetwork()}
          disabled={isSwitching}
          type="button"
        >
          {switchButtonLabel}
        </button>
      </div>
      <p className={styles.modal.note}>{switchNote}</p>
    </Modal>
  );
}
