import { defineConfig, configVariable } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatUpgrades from "@openzeppelin/hardhat-upgrades";
import hardhatAbiExporter from "@solidstate/hardhat-abi-exporter";
import hardhatKeystore from "@nomicfoundation/hardhat-keystore";

export default defineConfig({
  // Sets the default for `npx hardhat run` CLI tasks.
  // Note: hre.network.getOrCreate() does NOT use this — it falls back to
  // Hardhat 3's hardcoded DEFAULT_NETWORK_NAME ("default") when no --network
  // flag is provided, regardless of this setting.
  defaultNetwork: "hardhat",
  plugins: [hardhatKeystore, hardhatToolboxViem, hardhatUpgrades, hardhatAbiExporter],
  solidity: {
    compilers: [
      {
        version: "0.8.27",
      },
      {
        version: "0.8.33",
      },
    ],
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
    },
    sepolia: {
      type: "http",
      url: configVariable("ALCHEMY_API_KEY", "https://eth-sepolia.g.alchemy.com/v2/{variable}"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    optsepolia: {
      type: "http",
      url: configVariable("ALCHEMY_API_KEY", "https://opt-sepolia.g.alchemy.com/v2/{variable}"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY"), configVariable("CONTRACT_OWNER_PRIVATE_KEY")],
    },

    optimisticEthereum: {
      type: "http",
      url: configVariable("ALCHEMY_API_KEY", "https://opt-mainnet.g.alchemy.com/v2/{variable}"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY"), configVariable("CONTRACT_OWNER_PRIVATE_KEY")],
    },
    baseSepolia: {
      type: "http",
      url: configVariable("ALCHEMY_API_KEY", "https://base-sepolia.g.alchemy.com/v2/{variable}"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY"), configVariable("CONTRACT_OWNER_PRIVATE_KEY")],
    },
    base: {
      type: "http",
      url: "https://mainnet.base.org",
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY"), configVariable("CONTRACT_OWNER_PRIVATE_KEY")],
    },
  },
  etherscan: {
    // V2 API uses single Etherscan key for all chains (including Optimism, Base, Polygon, etc.)
    apiKey: configVariable("ETHERSCAN_API_KEY"),
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
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=84532",
          browserURL: "https://sepolia.basescan.org/",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=8453",
          browserURL: "https://basescan.org/",
        },
      },
    ],
  },
});
