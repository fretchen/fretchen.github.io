import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { formatEther, getAddress } from "viem";

// Import shared test utilities
import {
  createBasicNFTTests,
  createImageUpdateTests,
  createAdvancedImageUpdateTests,
  createEnumerationTests,
  createWalletEnumerationTests,
  cleanupTestFiles,
  ContractFixture,
} from "./shared/GenImNFTSharedTests";

describe("GenImNFTv2", function () {
  // We define a fixture to reuse the same contract instance in every test
  async function deployGenImNFTv2Fixture(): Promise<ContractFixture> {
    // Get accounts
    const [owner, otherAccount, recipient] = await hre.viem.getWalletClients();

    // Deploy the contract (ohne initialize aufzurufen)
    const genImNFT = await hre.viem.deployContract("GenImNFTv2", []);

    // Manuelle Initialisierung nach dem Deployment
    await genImNFT.write.initialize();

    const genImNFTPublic = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address);

    return {
      contract: genImNFT,
      genImNFTPublic,
      owner,
      otherAccount,
      recipient,
    };
  }

  describe("Deployment", function () {
    it("Should not allow re-initialization", async function () {
      const { contract } = await loadFixture(deployGenImNFTv2Fixture);

      // Versuche, initialize() erneut aufzurufen
      await expect(contract.write.initialize()).to.be.rejected; // Sollte mit einem "bereits initialisiert"-Fehler fehlschlagen
    });

    it("Should have the correct name and symbol for v2", async function () {
      const { contract } = await loadFixture(deployGenImNFTv2Fixture);
      expect(await contract.read.name()).to.equal("GenImNFTv2");
      expect(await contract.read.symbol()).to.equal("GENIMGv2");
    });
  });

  // Use shared basic NFT tests
  describe("Basic NFT Functionality", createBasicNFTTests(deployGenImNFTv2Fixture, "GenImNFTv2"));

  // Use shared image update tests
  describe("Image Updates", createImageUpdateTests(deployGenImNFTv2Fixture, "GenImNFTv2"));

  // Use shared advanced image update tests (includes the complex wallet balance test)
  describe("Advanced Image Updates", createAdvancedImageUpdateTests(deployGenImNFTv2Fixture, "GenImNFTv2"));

  // Use shared enumeration tests
  describe("Token Transfers and Burns", createEnumerationTests(deployGenImNFTv2Fixture, "GenImNFTv2"));

  // Use shared wallet enumeration tests
  describe("Wallet NFT Enumeration Helper", createWalletEnumerationTests(deployGenImNFTv2Fixture, "GenImNFTv2"));

  // Aufräumen nach jedem Test
  afterEach(function () {
    cleanupTestFiles();
  });
});
