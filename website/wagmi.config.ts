import { http, createConfig } from "wagmi";
import { mainnet, optimism } from "wagmi/chains";
import { injected, metaMask, safe, walletConnect } from "wagmi/connectors";

const projectId = "dc4827db33b6cb0234280a0ca3521e5c";

export const config = createConfig({
  chains: [mainnet, optimism],
  connectors: [injected(), walletConnect({ projectId }), metaMask(), safe()],
  transports: {
    [mainnet.id]: http(),
    [optimism.id]: http(),
  },
});
