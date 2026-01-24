import { http, createConfig } from "wagmi";
import { mainnet, optimism, sepolia, optimismSepolia, base, baseSepolia } from "wagmi/chains";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

const projectId = "dc4827db33b6cb0234280a0ca3521e5c";

export const config = createConfig({
  chains: [mainnet, sepolia, optimism, optimismSepolia, base, baseSepolia],
  connectors: [injected(), walletConnect({ projectId }), metaMask()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [optimism.id]: http(),
    [optimismSepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
