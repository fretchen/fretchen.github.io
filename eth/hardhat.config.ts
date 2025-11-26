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
const ETHERSCAN_API_KEY: string = vars.get("ETHERSCAN_API_KEY", "dummy-etherscan-key");
const OPTIMISTIC_ETHERSCAN_API_KEY: string = vars.get("OPTIMISTIC_ETHERSCAN_API_KEY", "dummy-optimistic-key");

const config = {
  solidity: "0.8.28",
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
