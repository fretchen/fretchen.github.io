import React from "react";

interface WalletConnectIconProps {
  className?: string;
}

/**
 * Generic "connect via mobile/QR" glyph shown for connectors that don't supply their
 * own icon (currently only the WalletConnect connector — auto-discovered browser
 * wallets carry their own icon via EIP-6963). Deliberately not the WalletConnect brand
 * mark itself.
 */
export default function WalletConnectIcon({ className }: WalletConnectIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" role="img" aria-label="WalletConnect">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 17.5h7M17.5 14v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
