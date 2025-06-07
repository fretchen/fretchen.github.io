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
  createMetadataFile, 
  getAllNFTsForWallet,
  cleanupTestFiles,
  ContractFixture
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

  describe("Wallet NFT Enumeration Helper", function () {
    it("Should get all NFTs with metadata for a wallet", async function () {
      const { contract, owner, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await contract.read.mintPrice();

      // Mint tokens with metadata
      const prompts = [
        "A beautiful sunset over mountains",
        "A futuristic city at night",
        "An abstract digital artwork"
      ];

      for (let i = 0; i < prompts.length; i++) {
        const tokenURI = createMetadataFile(i, prompts[i]);
        if (i === 1) {
          // Mint one token to otherAccount
          const otherClient = await hre.viem.getContractAt("GenImNFTv2", contract.address, {
            client: { wallet: otherAccount },
          });
          await otherClient.write.safeMint([tokenURI], { value: mintPrice });
        } else {
          await contract.write.safeMint([tokenURI], { value: mintPrice });
        }
      }

      // Get all NFTs for owner
      const ownerNFTs = await getAllNFTsForWallet(contract, owner.account.address);
      expect(ownerNFTs).to.have.length(2);
      expect(ownerNFTs[0].tokenId).to.equal(0);
      expect(ownerNFTs[1].tokenId).to.equal(2);

      // Get all NFTs for otherAccount
      const otherNFTs = await getAllNFTsForWallet(contract, otherAccount.account.address);
      expect(otherNFTs).to.have.length(1);
      expect(otherNFTs[0].tokenId).to.equal(1);
      expect(otherNFTs[0].tokenURI).to.include("token_1.json");
    });
  });

  // Aufräumen nach jedem Test
  afterEach(function () {
    cleanupTestFiles();
  });
});
