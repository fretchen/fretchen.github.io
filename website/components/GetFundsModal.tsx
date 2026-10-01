import React from "react";
import * as styles from "../layouts/shared";
import { useLocale } from "../hooks/useLocale";
import { Modal } from "./Modal";
import { button } from "../styled-system/recipes";
import type { PaymentCurrency } from "../hooks/x402Currency";

/** Where to get each token. EURC: Coinbase sells it directly on Base, which suits people with no crypto yet. */
export const GET_FUNDS_URL: Record<PaymentCurrency, string> = {
  EURC: "https://www.coinbase.com/de/how-to-buy/euro-coin-2",
  USDC: "https://app.optimism.io/bridge",
};

/**
 * Shown when the wallet holds too little of the token to open the chat's payment channel. The
 * chat's counterpart to SupportChainModal's "Get USDC" state; no network step, since the chat
 * switches networks by itself. Orange primary action, because money moves (README → colour).
 */
export function GetFundsModal({ currency, onClose }: { currency: PaymentCurrency; onClose: () => void }) {
  const fill = (text: string) => text.replaceAll("{currency}", currency);
  const title = useLocale({ label: "assistent.fundsTitle" });
  const body = fill(useLocale({ label: "assistent.fundsBody" }));
  const buttonLabel = fill(useLocale({ label: "assistent.fundsButton" }));
  const note = useLocale({ label: "assistent.fundsNote" });
  const closeAria = useLocale({ label: "metadataLine.modalCloseAria" });

  return (
    <Modal onClose={onClose} title={title} closeLabel={closeAria} lightClose>
      <p className={styles.modal.text}>{body}</p>
      <div className={styles.modal.primaryAction}>
        <a
          className={button({ visual: "support" })}
          href={GET_FUNDS_URL[currency]}
          target="_blank"
          rel="noopener noreferrer"
        >
          {buttonLabel}
        </a>
      </div>
      <p className={styles.modal.note}>{note}</p>
    </Modal>
  );
}
