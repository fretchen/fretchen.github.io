import React from "react";
import * as styles from "../layouts/shared";
import { useLocale } from "../hooks/useLocale";
import { Modal } from "./Modal";
import { button } from "../styled-system/recipes";
import type { PaymentCurrency } from "../hooks/x402Currency";

/** One way to acquire a currency. `labelKey` may contain `{currency}`, filled at render. */
export interface FundsRoute {
  labelKey: string;
  url: string;
}

/**
 * Where to get each token. The FIRST route renders as the modal's primary action; any further
 * routes render as secondary links below it. EURC is Coinbase's direct Base offering, which
 * suits people with no crypto yet; USDC is the Optimism bridge. EURe gets two routes: Monerium's
 * bank-transfer signup (euro-native, KYC) and Uniswap's EURe token page for anyone who would
 * rather stay out of KYC and SEPA — that route needs ETH for gas, and the swap note says so.
 */
export const GET_FUNDS_ROUTES: Record<PaymentCurrency, FundsRoute[]> = {
  EURe: [
    { labelKey: "assistent.fundsRouteBank", url: "https://monerium.app/signup" },
    {
      labelKey: "assistent.fundsRouteSwap",
      url: "https://app.uniswap.org/explore/tokens/base/0xbf6e2966A9C3D99C9E4D069E04f7Bdb9C8aa762C",
    },
  ],
  EURC: [
    {
      labelKey: "assistent.fundsButton",
      url: "https://www.coinbase.com/de/how-to-buy/euro-coin-2",
    },
  ],
  USDC: [{ labelKey: "assistent.fundsButton", url: "https://app.optimism.io/bridge" }],
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
  const bankLabel = fill(useLocale({ label: "assistent.fundsRouteBank" }));
  const swapLabel = fill(useLocale({ label: "assistent.fundsRouteSwap" }));
  const swapNote = useLocale({ label: "assistent.fundsSwapNote" });
  const note = useLocale({ label: "assistent.fundsNote" });
  const closeAria = useLocale({ label: "metadataLine.modalCloseAria" });

  const labels: Record<string, string> = {
    "assistent.fundsButton": buttonLabel,
    "assistent.fundsRouteBank": bankLabel,
    "assistent.fundsRouteSwap": swapLabel,
  };
  const routes = GET_FUNDS_ROUTES[currency];
  const [primary, ...secondary] = routes;
  // The swap caveat only exists for currencies that offer a swap route (EURe).
  const hasSwap = routes.some((route) => route.labelKey === "assistent.fundsRouteSwap");

  return (
    <Modal onClose={onClose} title={title} closeLabel={closeAria} lightClose>
      <p className={styles.modal.text}>{body}</p>
      <div className={styles.modal.primaryAction}>
        <a className={button({ visual: "support" })} href={primary.url} target="_blank" rel="noopener noreferrer">
          {labels[primary.labelKey]}
        </a>
      </div>
      {secondary.map((route) => (
        <div className={styles.modal.primaryAction} key={route.labelKey}>
          <a className={button({ visual: "secondary" })} href={route.url} target="_blank" rel="noopener noreferrer">
            {labels[route.labelKey]}
          </a>
        </div>
      ))}
      {hasSwap && <p className={styles.modal.note}>{swapNote}</p>}
      <p className={styles.modal.note}>{note}</p>
    </Modal>
  );
}
