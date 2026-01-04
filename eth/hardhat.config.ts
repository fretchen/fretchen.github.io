import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import "hardhat-abi-exporter";
import "@openzeppelin/hardhat-upgrades";
import { vars } from "hardhat/config";

// Use default values for CI/testing if environment variables are not set
const ALCHEMY_API_KEY: string = vars.get("ALCHEMY_API_KEY", "dummy-key-for-testing");
const SEPOLIA_PRIVATE_KEY: string = vars.get(
  "SEPOLIA_PRIVATE_KEY",
  "0x1234567890123456789012345678901234567890123456789012345678901234",
);
// V2 API uses single Etherscan key for all chains (including Optimism, Base, Polygon, etc.)
const ETHERSCAN_API_KEY: string = vars.get("ETHERSCAN_API_KEY", "dummy-etherscan-key");

const config = {
  solidity: "0.8.33",
  gasReporter: {
    enabled: false,
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
    apiKey: ETHERSCAN_API_KEY, // V2 API uses single Etherscan key for all chains
    customChains: [
      {
        network: "optsepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=11155420",
          browserURL: "https://sepolia-optimism.etherscan.io/",
        },
      },
      {
        network: "optimisticEthereum",
        chainId: 10,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=10",
          browserURL: "https://optimistic.etherscan.io/",
        },
      },
    ],
  },
};

export default config;
