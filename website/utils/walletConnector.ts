import type { Connector } from "wagmi";

/**
 * Picks the connector a "quick connect" button should use.
 *
 * With EIP-6963 auto-discovery, the connector list is [walletConnect, ...discovered
 * browser wallets]. A quick-connect button wants the user's installed browser wallet,
 * so prefer an injected (extension) connector; fall back to the first available
 * connector (e.g. WalletConnect) when no extension is installed.
 */
export function pickWalletConnector(connectors: readonly Connector[]): Connector | undefined {
  return connectors.find((c) => c.type === "injected") ?? connectors[0];
}
