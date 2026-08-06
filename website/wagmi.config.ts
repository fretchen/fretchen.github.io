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
    // GenImNFT mainnet lives here: every blog-post NFT image does a tokenURI read
    // against Optimism on page load. viem's bare-http() default is mainnet.optimism.io,
    // which is aggressively rate-limited/CORS-restricted — it works from a single local
    // machine but throttles under production traffic from fretchen.eu, dropping every
    // image to "Image unavailable". Same fix as base.id below: use CORS-clean public
    // infra with no key to manage.
    [optimism.id]: http("https://optimism-rpc.publicnode.com"),
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

/** The literal chain-id union wagmi derives from `config.chains` above. */
export type ConfiguredChainId = (typeof config)["chains"][number]["id"];

/**
 * `fromCAIP2` (in @fretchen/chain-utils) is chain-agnostic shared code, so it can only return a
 * plain `number` — it has no way to know which chains this app configured. Cast at this single,
 * reviewed point rather than scattering the same cast at every call site.
 */
export function asConfiguredChainId(chainId: number): ConfiguredChainId {
  return chainId as ConfiguredChainId;
}
