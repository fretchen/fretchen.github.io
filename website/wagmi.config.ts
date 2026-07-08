import { http, createConfig } from "wagmi";
import { mainnet, optimism, sepolia, optimismSepolia, base, baseSepolia } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";

const projectId = "dc4827db33b6cb0234280a0ca3521e5c";

// Browser-extension wallets are supplied automatically via wagmi's EIP-6963
// auto-discovery (multiInjectedProviderDiscovery, on by default), each shown by its
// own name. WalletConnect is the only explicit connector — it covers mobile and
// desktop-without-extension. See wagmi.config's plan notes for why the dedicated
// metaMask() SDK connector was removed.
export const config = createConfig({
  chains: [mainnet, sepolia, optimism, optimismSepolia, base, baseSepolia],
  connectors: [walletConnect({ projectId })],
  batch: { multicall: { wait: 16 } },
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [optimism.id]: http(),
    [optimismSepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
