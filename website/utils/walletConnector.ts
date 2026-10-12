import type { Connector } from "wagmi";

export interface PickWalletConnectorOptions {
  /**
   * Whether EIP-6963 auto-discovery has had its chance to append the installed
   * browser wallets to the connector list. With `ssr: true` (see wagmi.config.ts)
   * they arrive one commit after mount, so before this is set, an empty injected
   * slot means "not discovered yet", not "not installed".
   */
  discoverySettled: boolean;
}

/**
 * Picks the connector a "quick connect" button should use.
 *
 * With EIP-6963 auto-discovery, the connector list is [walletConnect, ...discovered
 * browser wallets]. A quick-connect button wants the user's installed browser wallet,
 * so prefer an injected (extension) connector. The WalletConnect fallback (the first
 * available connector — covers mobile and desktop-without-extension) is only taken
 * once discovery has settled: on the first render the list is still [walletConnect]
 * alone, and treating that as "no extension installed" opened the WalletConnect modal
 * instead of the installed wallet for a click in that window.
 */
export function pickWalletConnector(
  connectors: readonly Connector[],
  { discoverySettled }: PickWalletConnectorOptions,
): Connector | undefined {
  const injected = connectors.find((c) => c.type === "injected");
  if (injected) return injected;
  return discoverySettled ? connectors[0] : undefined;
}
