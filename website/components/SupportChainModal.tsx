import React from "react";
import * as styles from "../layouts/styles";
import { useLocale } from "../hooks/useLocale";
import { Modal } from "./Modal";

interface SupportChainModalProps {
  onClose: () => void;
  onSwitchNetwork: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
  isBusy: boolean;
  /**
   * true once the wallet is on a supported chain but the donation still failed
   * (e.g. no USDC) — switches the modal from "needs switch" (State A) to
   * "on-chain, needs USDC" (State B).
   */
  showGetUsdc?: boolean;
  errorMessage?: string | null;
}

/**
 * Guided overlay for the support flow, with two states keyed off `showGetUsdc`:
 *
 *  State A — wallet on the wrong network: explains the constraint and offers one primary
 *  action, "Switch & donate", which triggers the wallet's own switch + payment prompts.
 *
 *  State B — wallet on a supported network but the donation couldn't complete (no USDC):
 *  drops the now-false "wrong network" copy, makes "Get USDC" the primary action, and offers
 *  a quiet "Try again" — no switch button, since the network is already correct.
 *
 * The primary action is orange throughout, matching the support pill that opened it.
 */
export function SupportChainModal({
  onClose,
  onSwitchNetwork,
  onRetry,
  isBusy,
  showGetUsdc = false,
  errorMessage,
}: SupportChainModalProps) {
  const title = useLocale({ label: "metadataLine.modalTitle" });
  const why = useLocale({ label: "metadataLine.modalWhy" });
  const optimismLabel = useLocale({ label: "metadataLine.modalLearnMoreOptimism" });
  const baseLabel = useLocale({ label: "metadataLine.modalLearnMoreBase" });
  const closeAria = useLocale({ label: "metadataLine.modalCloseAria" });
  // State A
  const bodyA = useLocale({ label: "metadataLine.modalBody" });
  const switchButtonLabel = useLocale({ label: "metadataLine.modalSwitchButton" });
  const switchNote = useLocale({ label: "metadataLine.modalSwitchNote" });
  // State B
  const bodyB = useLocale({ label: "metadataLine.modalOnChainBody" });
  const getUsdcButton = useLocale({ label: "metadataLine.modalGetUsdcButton" });
  const retryLabel = useLocale({ label: "metadataLine.modalRetry" });

  const whyLine = (
    <p className={styles.modal.why}>
      {why}{" "}
      <a className={styles.modal.link} href="https://optimism.io" target="_blank" rel="noopener noreferrer">
        {optimismLabel}
      </a>{" "}
      ·{" "}
      <a className={styles.modal.link} href="https://base.org" target="_blank" rel="noopener noreferrer">
        {baseLabel}
      </a>
    </p>
  );

  return (
    <Modal onClose={onClose} title={title} closeLabel={closeAria} lightClose>
      {showGetUsdc ? (
        // State B — on a supported chain, just needs USDC
        <>
          <p className={styles.modal.text}>{bodyB}</p>
          {whyLine}
          {errorMessage && <p className={styles.modal.error}>{errorMessage}</p>}
          <div className={styles.modal.primaryAction}>
            <a
              className={styles.modal.supportPrimary}
              href="https://app.optimism.io/bridge"
              target="_blank"
              rel="noopener noreferrer"
            >
              {getUsdcButton}
            </a>
          </div>
          <button
            className={styles.modal.secondaryAction}
            onClick={() => void onRetry()}
            disabled={isBusy}
            type="button"
          >
            {retryLabel}
          </button>
        </>
      ) : (
        // State A — wallet on the wrong network
        <>
          <p className={styles.modal.text}>{bodyA}</p>
          {whyLine}
          <div className={styles.modal.primaryAction}>
            <button
              className={styles.modal.supportPrimary}
              onClick={() => void onSwitchNetwork()}
              disabled={isBusy}
              type="button"
            >
              {switchButtonLabel}
            </button>
          </div>
          <p className={styles.modal.note}>{switchNote}</p>
        </>
      )}
    </Modal>
  );
}
