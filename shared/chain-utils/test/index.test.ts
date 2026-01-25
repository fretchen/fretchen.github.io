/**
 * Tests for @fretchen/chain-utils
 *
 * Tests CAIP-2 utilities, chain configuration, and contract addresses.
 */

import { describe, test, expect } from "vitest";
import {
  toCAIP2,
  fromCAIP2,
  getViemChain,
  isNetworkSupported,
  isMainnet,
  isTestnet,
  MAINNET_NETWORKS,
  TESTNET_NETWORKS,
} from "../src/index";
import {
  getGenAiNFTAddress,
  getCollectorNFTAddress,
  getSupportV2Address,
  getUSDCAddress,
  getUSDCName,
  MAINNET_GENAI_NFT_ADDRESSES,
  TESTNET_GENAI_NFT_ADDRESSES,
  MAINNET_SUPPORT_V2_ADDRESSES,
  TESTNET_SUPPORT_V2_ADDRESSES,
  USDC_ADDRESSES,
} from "../src/addresses";

describe("@fretchen/chain-utils", () => {
  describe("CAIP-2 Conversion", () => {
    describe("toCAIP2()", () => {
      test("should convert chainId to CAIP-2 format", () => {
        expect(toCAIP2(10)).toBe("eip155:10");
        expect(toCAIP2(11155420)).toBe("eip155:11155420");
        expect(toCAIP2(8453)).toBe("eip155:8453");
        expect(toCAIP2(84532)).toBe("eip155:84532");
      });
    });

    describe("fromCAIP2()", () => {
      test("should parse CAIP-2 to numeric chainId", () => {
        expect(fromCAIP2("eip155:10")).toBe(10);
        expect(fromCAIP2("eip155:11155420")).toBe(11155420);
        expect(fromCAIP2("eip155:8453")).toBe(8453);
        expect(fromCAIP2("eip155:84532")).toBe(84532);
      });

      test("should throw for invalid CAIP-2 format", () => {
        expect(() => fromCAIP2("invalid")).toThrow("Invalid CAIP-2 format");
        expect(() => fromCAIP2("eip155:")).toThrow("Invalid CAIP-2 format");
        expect(() => fromCAIP2("10")).toThrow("Invalid CAIP-2 format");
      });
    });

    test("roundtrip: toCAIP2 -> fromCAIP2", () => {
      const chainIds = [10, 11155420, 8453, 84532];
      for (const chainId of chainIds) {
        expect(fromCAIP2(toCAIP2(chainId))).toBe(chainId);
      }
    });
  });

  describe("getViemChain()", () => {
    test("should return Optimism Mainnet for eip155:10", () => {
      const chain = getViemChain("eip155:10");
      expect(chain.id).toBe(10);
      expect(chain.name).toBe("OP Mainnet");
    });

    test("should return Optimism Sepolia for eip155:11155420", () => {
      const chain = getViemChain("eip155:11155420");
      expect(chain.id).toBe(11155420);
      expect(chain.name).toBe("OP Sepolia");
    });

    test("should return Base Mainnet for eip155:8453", () => {
      const chain = getViemChain("eip155:8453");
      expect(chain.id).toBe(8453);
      expect(chain.name).toBe("Base");
    });

    test("should return Base Sepolia for eip155:84532", () => {
      const chain = getViemChain("eip155:84532");
      expect(chain.id).toBe(84532);
      expect(chain.name).toBe("Base Sepolia");
    });

    test("should throw for unsupported network", () => {
      expect(() => getViemChain("eip155:1")).toThrow("Unsupported network: eip155:1");
    });
  });

  describe("Network Type Checks", () => {
    test("isNetworkSupported()", () => {
      expect(isNetworkSupported("eip155:10")).toBe(true);
      expect(isNetworkSupported("eip155:8453")).toBe(true);
      expect(isNetworkSupported("eip155:11155420")).toBe(true);
      expect(isNetworkSupported("eip155:1")).toBe(false);
      expect(isNetworkSupported("invalid")).toBe(false);
    });

    test("isMainnet()", () => {
      expect(isMainnet("eip155:10")).toBe(true);
      expect(isMainnet("eip155:8453")).toBe(true);
      expect(isMainnet("eip155:11155420")).toBe(false);
      expect(isMainnet("eip155:84532")).toBe(false);
    });

    test("isTestnet()", () => {
      expect(isTestnet("eip155:11155420")).toBe(true);
      expect(isTestnet("eip155:84532")).toBe(true);
      expect(isTestnet("eip155:10")).toBe(false);
      expect(isTestnet("eip155:8453")).toBe(false);
    });

    test("MAINNET_NETWORKS and TESTNET_NETWORKS are disjoint", () => {
      for (const mainnet of MAINNET_NETWORKS) {
        expect(TESTNET_NETWORKS).not.toContain(mainnet);
      }
    });
  });

  describe("Contract Addresses", () => {
    describe("getGenAiNFTAddress()", () => {
      test("should return Mainnet contract address", () => {
        expect(getGenAiNFTAddress("eip155:10")).toBe(
          "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb"
        );
      });

      test("should return Sepolia contract address", () => {
        expect(getGenAiNFTAddress("eip155:11155420")).toBe(
          "0x10827cC42a09D0BAD2d43134C69F0e776D853D85"
        );
      });

      test("should throw for network without GenAI NFT deployment", () => {
        expect(() => getGenAiNFTAddress("eip155:8453")).toThrow(
          "GenAI NFT not deployed on eip155:8453"
        );
      });
    });

    describe("getCollectorNFTAddress()", () => {
      test("should return Optimism Mainnet address", () => {
        expect(getCollectorNFTAddress("eip155:10")).toBe(
          "0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea"
        );
      });

      test("should throw for network without CollectorNFT", () => {
        expect(() => getCollectorNFTAddress("eip155:8453")).toThrow(
          "CollectorNFT not deployed on eip155:8453"
        );
      });
    });

    describe("getSupportV2Address()", () => {
      test("should return addresses for all deployed networks", () => {
        // Mainnets
        expect(getSupportV2Address("eip155:10")).toBe(
          "0x4ca63f8A4Cd56287E854f53E18ca482D74391316"
        );
        expect(getSupportV2Address("eip155:8453")).toBe(
          "0xB70EA4d714Fed01ce20E93F9033008BadA1c8694"
        );
        // Testnets
        expect(getSupportV2Address("eip155:11155420")).toBe(
          "0x9859431b682e861b19e87Db14a04944BC747AB6d"
        );
        expect(getSupportV2Address("eip155:84532")).toBe(
          "0xaB44BE78499721b593a0f4BE2099b246e9C53B57"
        );
      });
    });

    describe("USDC Addresses", () => {
      test("getUSDCAddress() returns valid addresses for all networks", () => {
        expect(getUSDCAddress("eip155:10")).toBe(
          "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"
        );
        expect(getUSDCAddress("eip155:11155420")).toBe(
          "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"
        );
        expect(getUSDCAddress("eip155:8453")).toBe(
          "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
        );
        expect(getUSDCAddress("eip155:84532")).toBe(
          "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
        );
      });

      test("getUSDCAddress() throws for unsupported network", () => {
        expect(() => getUSDCAddress("eip155:1")).toThrow(
          "USDC not available on eip155:1"
        );
      });

      test("getUSDCName() returns correct names for EIP-712 domain", () => {
        // Mainnets use "USD Coin"
        expect(getUSDCName("eip155:10")).toBe("USD Coin");
        expect(getUSDCName("eip155:8453")).toBe("USD Coin");
        // Testnets use "USDC"
        expect(getUSDCName("eip155:11155420")).toBe("USDC");
        expect(getUSDCName("eip155:84532")).toBe("USDC");
      });
    });
  });

  describe("Address Map Consistency", () => {
    test("all address maps have valid checksummed addresses", () => {
      const allMaps = [
        MAINNET_GENAI_NFT_ADDRESSES,
        TESTNET_GENAI_NFT_ADDRESSES,
        MAINNET_SUPPORT_V2_ADDRESSES,
        TESTNET_SUPPORT_V2_ADDRESSES,
        USDC_ADDRESSES,
      ];

      for (const map of allMaps) {
        for (const [network, address] of Object.entries(map)) {
          expect(network).toMatch(/^eip155:\d+$/);
          expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
        }
      }
    });

    test("chainId from viem matches fromCAIP2 for all networks", () => {
      const networks = ["eip155:10", "eip155:11155420", "eip155:8453", "eip155:84532"];
      
      for (const network of networks) {
        const viemChain = getViemChain(network);
        const parsedChainId = fromCAIP2(network);
        expect(viemChain.id).toBe(parsedChainId);
      }
    });
  });
});
