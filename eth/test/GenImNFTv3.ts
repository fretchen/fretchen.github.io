import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import hre from "hardhat";

// Import shared test utilities
import { 
  createBasicNFTTests, 
  createImageUpdateTests, 
  cleanupTestFiles,
  ContractFixture
} from "./shared/GenImNFTSharedTests";

describe("GenImNFTv3", function () {
  async function deployGenImNFTv2AndUpgradeToV3Fixture() {
    // Get signers
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();

    // First deploy v2
    const GenImNFTv2 = await ethers.getContractFactory("GenImNFTv2");
    const proxyV2 = await upgrades.deployProxy(GenImNFTv2, [], {
      initializer: "initialize",
      kind: "uups"
    });
    await proxyV2.waitForDeployment();

    // Mint some tokens in v2
    const mintPrice = await proxyV2.mintPrice();
    await (proxyV2 as any).connect(owner)["safeMint(string)"]("ipfs://test1", { value: mintPrice });
    await (proxyV2 as any).connect(otherAccount)["safeMint(string)"]("ipfs://test2", { value: mintPrice });

    // Now upgrade to v3
    const GenImNFTv3 = await ethers.getContractFactory("GenImNFTv3");
    const proxyV3 = await upgrades.upgradeProxy(proxyV2, GenImNFTv3, {
      call: { fn: "reinitializeV3", args: [] }
    });

    const proxyAddress = await proxyV3.getAddress();

    return {
      proxy: proxyV3 as any,
      GenImNFTv3,
      owner,
      otherAccount,
      thirdAccount,
      proxyAddress
    };
  }

  async function deployGenImNFTv3DirectFixture() {
    // Alternative fixture for direct v3 deployment
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();

    const GenImNFTv3 = await ethers.getContractFactory("GenImNFTv3");
    const proxy = await upgrades.deployProxy(GenImNFTv3, [], {
      initializer: "initialize",
      kind: "uups"
    });
    await proxy.waitForDeployment();

    return {
      proxy: proxy as any,
      GenImNFTv3,
      owner,
      otherAccount,
      thirdAccount,
    };
  }

  async function deployGenImNFTv3ViemFixture(): Promise<ContractFixture> {
    // Deploy using ethers.js for upgrades support
    const [ethersOwner] = await ethers.getSigners();

    const GenImNFTv3 = await ethers.getContractFactory("GenImNFTv3");
    const proxy = await upgrades.deployProxy(GenImNFTv3, [], {
      initializer: "initialize",
      kind: "uups"
    });
    await proxy.waitForDeployment();

    // Get viem clients for all testing
    const [viemOwner, viemOtherAccount, viemRecipient] = await hre.viem.getWalletClients();

    // Create viem contract interface at the proxy address
    const viemContract = await hre.viem.getContractAt("GenImNFTv3", await proxy.getAddress());

    return {
      contract: viemContract,
      genImNFTPublic: viemContract,
      owner: viemOwner,
      otherAccount: viemOtherAccount,
      recipient: viemRecipient,
    };
  }

  async function deployGenImNFTv3DirectFixtureViem(): Promise<ContractFixture> {
    // Deploy using ethers.js (required for upgrades)
    const [ethersOwner] = await ethers.getSigners();

    const GenImNFTv3 = await ethers.getContractFactory("GenImNFTv3");
    const proxy = await upgrades.deployProxy(GenImNFTv3, [], {
      initializer: "initialize",
      kind: "uups"
    });
    await proxy.waitForDeployment();

    // Get viem clients for testing
    const [viemOwner, viemOtherAccount, viemRecipient] = await hre.viem.getWalletClients();

    // Create viem contract interface
    const viemContract = await hre.viem.getContractAt("GenImNFTv3", await proxy.getAddress());

    return {
      contract: viemContract,
      genImNFTPublic: viemContract,
      owner: viemOwner,
      otherAccount: viemOtherAccount,
      recipient: viemRecipient,
    };
  }

  describe("Upgrade from V2 to V3", function () {
    it("Should preserve existing tokens during upgrade and mark them as listed", async function () {
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv2AndUpgradeToV3Fixture);
      
      // Check that existing tokens are preserved
      expect(await proxy.totalSupply()).to.equal(2n);
      expect(await proxy.ownerOf(0)).to.equal(owner.address);
      expect(await proxy.ownerOf(1)).to.equal(otherAccount.address);
      
      // Check that existing tokens are marked as listed (opt-out system)
      expect(await proxy.isTokenListed(0)).to.be.true;
      expect(await proxy.isTokenListed(1)).to.be.true;
    });

    it("Should maintain all v2 functionality after upgrade", async function () {
      const { proxy, thirdAccount } = await loadFixture(deployGenImNFTv2AndUpgradeToV3Fixture);
      
      // Test minting still works (use the v2 style safeMint)
      const mintPrice = await proxy.mintPrice();
      await proxy.connect(thirdAccount)["safeMint(string)"]("ipfs://post-upgrade", { value: mintPrice });
      
      expect(await proxy.totalSupply()).to.equal(3n);
      expect(await proxy.ownerOf(2)).to.equal(thirdAccount.address);
      expect(await proxy.tokenURI(2)).to.equal("ipfs://post-upgrade");
    });

    it("Should have v3 functionality available after upgrade", async function () {
      const { proxy, thirdAccount } = await loadFixture(deployGenImNFTv2AndUpgradeToV3Fixture);
      
      // Test new v3 functionality
      const mintPrice = await proxy.mintPrice();
      await proxy.connect(thirdAccount)["safeMint(string,bool)"]("ipfs://v3-private", false, { value: mintPrice });
      
      expect(await proxy.isTokenListed(2)).to.be.false;
    });

    it("Should allow changing listing status after upgrade", async function () {
      const { proxy, owner } = await loadFixture(deployGenImNFTv2AndUpgradeToV3Fixture);
      
      // Initially, existing tokens should be listed
      expect(await proxy.isTokenListed(0)).to.be.true;
      
      // Owner should be able to change listing status
      await proxy.connect(owner).setTokenListed(0, false);
      expect(await proxy.isTokenListed(0)).to.be.false;
      
      // Change it back
      await proxy.connect(owner).setTokenListed(0, true);
      expect(await proxy.isTokenListed(0)).to.be.true;
    });

    it("Should support getting public tokens of owner after upgrade", async function () {
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv2AndUpgradeToV3Fixture);
      
      // Both existing tokens should be listed initially
      const publicTokens = await proxy.getPublicTokensOfOwner(owner.address);
      expect(publicTokens.length).to.equal(1);
      expect(publicTokens[0]).to.equal(0n);
      
      // Change one to private
      await proxy.connect(owner).setTokenListed(0, false);
      
      const publicTokensAfter = await proxy.getPublicTokensOfOwner(owner.address);
      expect(publicTokensAfter.length).to.equal(0);
    });

    it("Should preserve contract metadata after upgrade", async function () {
      const { proxy } = await loadFixture(deployGenImNFTv2AndUpgradeToV3Fixture);
      
      // After upgrade, the name should remain GenImNFTv2 (metadata doesn't change in upgrade)
      expect(await proxy.name()).to.equal("GenImNFTv2");
      expect(await proxy.symbol()).to.equal("GENIMGv2");
      expect(await proxy.mintPrice()).to.equal(ethers.parseEther("0.01"));
    });

    it("Should handle image updates for existing tokens after upgrade", async function () {
      const { proxy, owner } = await loadFixture(deployGenImNFTv2AndUpgradeToV3Fixture);
      
      // Fund the contract for image update payments
      const mintPrice = await proxy.mintPrice();
      await proxy.connect(owner)["safeMint(string)"]("ipfs://funding", { value: mintPrice });
      
      // Check that existing token hasn't been updated
      expect(await proxy.isImageUpdated(0)).to.be.false;
      
      // Request image update for existing token
      const newImageUrl = "ipfs://updated-image-v3";
      await proxy.connect(owner).requestImageUpdate(0, newImageUrl);
      
      expect(await proxy.isImageUpdated(0)).to.be.true;
      expect(await proxy.tokenURI(0)).to.equal(newImageUrl);
    });
  });

  // Use shared basic NFT tests for v3 with viem (like V2)
  describe("Basic NFT Functionality (Direct V3 Deployment)", function () {
    createBasicNFTTests(deployGenImNFTv3DirectFixtureViem);
  });

  // Use shared image update tests for v3 with viem (like V2)  
  describe("Image Updates (Direct V3 Deployment)", function () {
    createImageUpdateTests(deployGenImNFTv3DirectFixtureViem);
  });

  describe("V3 Specific Features", function () {
    it("Should support privacy settings for new tokens", async function () {
      const { proxy, owner } = await loadFixture(deployGenImNFTv3DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Mint a public token
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://public-token", true, { value: mintPrice });
      expect(await proxy.isTokenListed(0)).to.be.true;

      // Mint a private token
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://private-token", false, { value: mintPrice });
      expect(await proxy.isTokenListed(1)).to.be.false;
    });

    it("Should allow owners to change token privacy", async function () {
      const { proxy, owner } = await loadFixture(deployGenImNFTv3DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Mint a token
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://test-token", true, { value: mintPrice });
      expect(await proxy.isTokenListed(0)).to.be.true;

      // Change to private
      await proxy.connect(owner).setTokenListed(0, false);
      expect(await proxy.isTokenListed(0)).to.be.false;

      // Change back to public
      await proxy.connect(owner).setTokenListed(0, true);
      expect(await proxy.isTokenListed(0)).to.be.true;
    });

    it("Should return only public tokens when querying", async function () {
      const { proxy, owner } = await loadFixture(deployGenImNFTv3DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Mint mixed tokens
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://public1", true, { value: mintPrice });
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://private1", false, { value: mintPrice });
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://public2", true, { value: mintPrice });

      // Get public tokens
      const publicTokens = await proxy.getPublicTokensOfOwner(owner.address);
      expect(publicTokens.length).to.equal(2);
      expect(publicTokens).to.deep.equal([0n, 2n]);
    });

    it("Should reject privacy changes by non-owners", async function () {
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv3DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Mint a token as owner
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://test-token", true, { value: mintPrice });

      // Try to change privacy as non-owner (should fail)
      try {
        await proxy.connect(otherAccount).setTokenListed(0, false);
        // If we get here, the transaction didn't revert as expected
        expect.fail("Expected transaction to revert");
      } catch (error: any) {
        // Check that it failed for the right reason
        expect(error.message).to.include("revert");
      }
    });

    it("Should support basic NFT functionality with V3 contract", async function () {
      const { proxy, owner } = await loadFixture(deployGenImNFTv3DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Basic mint test
      await proxy.connect(owner)["safeMint(string)"]("ipfs://basic-test", { value: mintPrice });
      
      expect(await proxy.ownerOf(0)).to.equal(owner.address);
      expect(await proxy.tokenURI(0)).to.equal("ipfs://basic-test");
      expect(await proxy.totalSupply()).to.equal(1n);
    });

    it("Should support image updates with V3 contract", async function () {
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv3DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Mint a token
      await proxy.connect(owner)["safeMint(string)"]("ipfs://test-image", { value: mintPrice });

      // Request image update
      const newImageUrl = "ipfs://updated-image-v3";
      await proxy.connect(otherAccount).requestImageUpdate(0, newImageUrl);

      expect(await proxy.isImageUpdated(0)).to.be.true;
      expect(await proxy.tokenURI(0)).to.equal(newImageUrl);
    });
  });

  // Use shared basic NFT tests for v3 with viem (like V2)
  describe("Basic NFT Functionality (Direct V3 Deployment)", 
    createBasicNFTTests(deployGenImNFTv3DirectFixtureViem)
  );

  // Use shared image update tests for v3 with viem (like V2)  
  describe("Image Updates (Direct V3 Deployment)", 
    createImageUpdateTests(deployGenImNFTv3DirectFixtureViem)
  );

  // Aufräumen nach jedem Test
  afterEach(function () {
    cleanupTestFiles();
  });
});
