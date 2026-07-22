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
    // assistent's x402 batch-settlement channel reads (channel-open, corrective-402
    // recovery) hit this on every real chat session. viem's default (mainnet.base.org)
    // is explicitly documented by Base as not for production traffic, and has already
    // rate-limited a Multicall3-bundled read batch in this exact repo (see getRpcUrl's
    // doc comment in shared/chain-utils). publicnode is browser-CORS-clean (verified)
    // and general-purpose public infra rather than a convenience default — no key to
    // manage, so nothing to lose by using it instead.
    [base.id]: http("https://base-rpc.publicnode.com"),
    [baseSepolia.id]: http(),
  },
});
