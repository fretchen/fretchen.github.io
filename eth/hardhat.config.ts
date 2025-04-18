import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import "hardhat-abi-exporter";
import "hardhat-gas-reporter";
import { vars } from "hardhat/config";

const ALCHEMY_API_KEY = vars.get("ALCHEMY_API_KEY");
const SEPOLIA_PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY");
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");
const OPTIMISTIC_ETHERSCAN_API_KEY = vars.get("OPTIMISTIC_ETHERSCAN_API_KEY");
const COINMARKETCAP_API_KEY = vars.get("COINMARKETCAP_API_KEY");
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  gasReporter: {
    currency: "EUR",
    L1: "ethereum",
    L2: "optimism",
    L2Etherscan: OPTIMISTIC_ETHERSCAN_API_KEY,
    L1Etherscan: ETHERSCAN_API_KEY,
    coinmarketcap: COINMARKETCAP_API_KEY,
  },
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
    optsepolia: {
      url: `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
    optimisticEthereum: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      optsepolia: OPTIMISTIC_ETHERSCAN_API_KEY,
      optimisticEthereum: OPTIMISTIC_ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "optsepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io/",
        },
      },
    ],
  },
};

export default config;
