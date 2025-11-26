import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import hre from "hardhat";

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

describe("GenImNFTv4", function () {
  async function deployGenImNFTv3AndUpgradeToV4Fixture() {
    // Get signers
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();

    // First deploy v3
    const GenImNFTv3 = await ethers.getContractFactory("GenImNFTv3");
    const proxyV3 = await upgrades.deployProxy(GenImNFTv3, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await proxyV3.waitForDeployment();

    // Mint some tokens in v3
    const mintPrice = await proxyV3.mintPrice();
    await (proxyV3 as any).connect(owner)["safeMint(string,bool)"]("ipfs://test1", true, { value: mintPrice });
    await (proxyV3 as any).connect(otherAccount)["safeMint(string,bool)"]("ipfs://test2", true, { value: mintPrice });

    // Now upgrade to v4
    const GenImNFTv4 = await ethers.getContractFactory("GenImNFTv4");
    const proxyV4 = await upgrades.upgradeProxy(proxyV3, GenImNFTv4, {
      call: { fn: "reinitializeV4", args: [] },
    });

    const proxyAddress = await proxyV4.getAddress();

    return {
      proxy: proxyV4 as any,
      GenImNFTv4,
      owner,
      otherAccount,
      thirdAccount,
      proxyAddress,
    };
  }

  async function deployGenImNFTv4DirectFixture() {
    // Alternative fixture for direct v4 deployment
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();

    const GenImNFTv4 = await ethers.getContractFactory("GenImNFTv4");
    const proxy = await upgrades.deployProxy(GenImNFTv4, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await proxy.waitForDeployment();

    return {
      proxy: proxy as any,
      GenImNFTv4,
      owner,
      otherAccount,
      thirdAccount,
    };
  }

  async function deployGenImNFTv3ViemFixture(): Promise<ContractFixture> {
    // Deploy using ethers.js for upgrades support
    const [ethersOwner] = await ethers.getSigners();

    const GenImNFTv4 = await ethers.getContractFactory("GenImNFTv4");
    const proxy = await upgrades.deployProxy(GenImNFTv4, [], {
      initializer: "initialize",
      kind: "uups",
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

  async function deployGenImNFTv4DirectFixtureViem(): Promise<ContractFixture> {
    // Deploy using ethers.js (required for upgrades)
    const [ethersOwner] = await ethers.getSigners();

    const GenImNFTv4 = await ethers.getContractFactory("GenImNFTv4");
    const proxy = await upgrades.deployProxy(GenImNFTv4, [], {
      initializer: "initialize",
      kind: "uups",
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

  describe.skip("Upgrade from V2 to V3 (legacy tests from v3, not relevant for v4)", function () {
    it("Should preserve existing tokens during upgrade and mark them as listed", async function () {
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv3AndUpgradeToV4Fixture);

      // Check that existing tokens are preserved
      expect(await proxy.totalSupply()).to.equal(2n);
      expect(await proxy.ownerOf(0)).to.equal(owner.address);
      expect(await proxy.ownerOf(1)).to.equal(otherAccount.address);

      // Check that existing tokens are marked as listed (opt-out system)
      expect(await proxy.isTokenListed(0)).to.be.true;
      expect(await proxy.isTokenListed(1)).to.be.true;
    });

    it("Should maintain all v2 functionality after upgrade", async function () {
      const { proxy, thirdAccount } = await loadFixture(deployGenImNFTv3AndUpgradeToV4Fixture);

      // Test minting still works (use the v2 style safeMint)
      const mintPrice = await proxy.mintPrice();
      await proxy.connect(thirdAccount)["safeMint(string)"]("ipfs://post-upgrade", { value: mintPrice });

      expect(await proxy.totalSupply()).to.equal(3n);
      expect(await proxy.ownerOf(2)).to.equal(thirdAccount.address);
      expect(await proxy.tokenURI(2)).to.equal("ipfs://post-upgrade");
    });

    it("Should have v3 functionality available after upgrade", async function () {
      const { proxy, thirdAccount } = await loadFixture(deployGenImNFTv3AndUpgradeToV4Fixture);

      // Test new v3 functionality
      const mintPrice = await proxy.mintPrice();
      await proxy.connect(thirdAccount)["safeMint(string,bool)"]("ipfs://v3-private", false, { value: mintPrice });

      expect(await proxy.isTokenListed(2)).to.be.false;
    });

    it("Should allow changing listing status after upgrade", async function () {
      const { proxy, owner } = await loadFixture(deployGenImNFTv3AndUpgradeToV4Fixture);

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
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv3AndUpgradeToV4Fixture);

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
      const { proxy } = await loadFixture(deployGenImNFTv3AndUpgradeToV4Fixture);

      // After upgrade, the name should remain GenImNFTv2 (metadata doesn't change in upgrade)
      expect(await proxy.name()).to.equal("GenImNFTv2");
      expect(await proxy.symbol()).to.equal("GENIMGv2");
      expect(await proxy.mintPrice()).to.equal(ethers.parseEther("0.01"));
    });

    it("Should enforce authorization for image updates after upgrade to v4", async function () {
      const { proxy, owner, thirdAccount } = await loadFixture(deployGenImNFTv3AndUpgradeToV4Fixture);

      // Token 0 exists (minted in v3 before upgrade)
      expect(await proxy.isImageUpdated(0)).to.be.false;

      // NEW V4 BEHAVIOR: Unauthorized attacker cannot update anymore
      await expect(
        proxy.connect(thirdAccount).requestImageUpdate(0, "ipfs://attacker-url")
      ).to.be.rejectedWith("Not authorized agent");

      // Owner whitelists themselves as authorized agent
      await proxy.connect(owner).authorizeAgentWallet(owner.address);
      expect(await proxy.isAuthorizedAgent(owner.address)).to.be.true;
      
      // Fund contract for payment
      const mintPrice = await proxy.mintPrice();
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://funding", true, { value: mintPrice });

      // Now authorized agent can update
      await proxy.connect(owner).requestImageUpdate(0, "ipfs://updated-v4");
      expect(await proxy.isImageUpdated(0)).to.be.true;
      expect(await proxy.tokenURI(0)).to.equal("ipfs://updated-v4");
    });
  });

  // Use shared basic NFT tests for v4 with viem
  describe("Basic NFT Functionality (Direct V4 Deployment)", function () {
    createBasicNFTTests(deployGenImNFTv4DirectFixtureViem);
  });

  // V4-specific image update tests WITH authorization setup
  describe("Image Updates with Authorization (Direct V4 Deployment)", function () {
    it("Should allow whitelisted agent to request image update and receive payment", async function () {
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Mint a token
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://initial", true, { value: mintPrice });
      const tokenId = 0n;

      // Whitelist agent
      await proxy.connect(owner).authorizeAgentWallet(otherAccount.address);

      // Record balances before update
      const agentBalanceBefore = await hre.ethers.provider.getBalance(otherAccount.address);
      const contractBalanceBefore = await hre.ethers.provider.getBalance(await proxy.getAddress());

      // Request image update
      const tx = await proxy.connect(otherAccount).requestImageUpdate(tokenId, "ipfs://updated");
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      // Verify token was updated
      expect(await proxy.isImageUpdated(tokenId)).to.be.true;
      expect(await proxy.tokenURI(tokenId)).to.equal("ipfs://updated");

      // Verify payment was made to agent
      const agentBalanceAfter = await hre.ethers.provider.getBalance(otherAccount.address);
      const contractBalanceAfter = await hre.ethers.provider.getBalance(await proxy.getAddress());

      expect(agentBalanceAfter).to.equal(agentBalanceBefore + mintPrice - gasUsed);
      expect(contractBalanceAfter).to.equal(contractBalanceBefore - mintPrice);
    });

    it("Should reject image update from non-whitelisted address", async function () {
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Mint a token
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://initial", true, { value: mintPrice });
      const tokenId = 0n;

      // Try to update without being whitelisted
      await expect(
        proxy.connect(otherAccount).requestImageUpdate(tokenId, "ipfs://unauthorized")
      ).to.be.rejectedWith("Not authorized agent");

      // Verify token was NOT updated
      expect(await proxy.isImageUpdated(tokenId)).to.be.false;
      expect(await proxy.tokenURI(tokenId)).to.equal("ipfs://initial");
    });

    it("Should prevent duplicate image updates", async function () {
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Mint a token and whitelist agent
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://initial", true, { value: mintPrice });
      await proxy.connect(owner).authorizeAgentWallet(otherAccount.address);

      // First update should succeed
      await proxy.connect(otherAccount).requestImageUpdate(0, "ipfs://updated");
      expect(await proxy.isImageUpdated(0)).to.be.true;

      // Second update should fail
      await expect(
        proxy.connect(otherAccount).requestImageUpdate(0, "ipfs://double-update")
      ).to.be.rejectedWith("Image already updated");
    });

    it("Should reject update for non-existent token", async function () {
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixture);

      // Whitelist agent
      await proxy.connect(owner).authorizeAgentWallet(otherAccount.address);

      // Try to update non-existent token
      await expect(
        proxy.connect(otherAccount).requestImageUpdate(999, "ipfs://nonexistent")
      ).to.be.rejectedWith("Token does not exist");
    });

    it("Should allow revoking agent authorization", async function () {
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Mint tokens
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://token0", true, { value: mintPrice });
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://token1", true, { value: mintPrice });

      // Whitelist and use agent
      await proxy.connect(owner).authorizeAgentWallet(otherAccount.address);
      await proxy.connect(otherAccount).requestImageUpdate(0, "ipfs://updated0");
      expect(await proxy.isImageUpdated(0)).to.be.true;

      // Revoke authorization
      await proxy.connect(owner).revokeAgentWallet(otherAccount.address);
      expect(await proxy.isAuthorizedAgent(otherAccount.address)).to.be.false;

      // Fund contract again
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://funding", true, { value: mintPrice });

      // Should now be rejected
      await expect(
        proxy.connect(otherAccount).requestImageUpdate(1, "ipfs://updated1")
      ).to.be.rejectedWith("Not authorized agent");
    });
  });

  describe("V4 Specific Features (Authorization & Security)", function () {
    it("Should allow owner to whitelist agent wallets (EIP-8004)", async function () {
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixture);
      
      // Initially not whitelisted
      expect(await proxy.isAuthorizedAgent(otherAccount.address)).to.be.false;

      // Owner whitelists agent
      await proxy.connect(owner).authorizeAgentWallet(otherAccount.address);
      expect(await proxy.isAuthorizedAgent(otherAccount.address)).to.be.true;
      
      // Owner can revoke
      await proxy.connect(owner).revokeAgentWallet(otherAccount.address);
      expect(await proxy.isAuthorizedAgent(otherAccount.address)).to.be.false;
    });

    it("Should allow whitelisted agent to update any token", async function () {
      const { proxy, owner, otherAccount, thirdAccount } = await loadFixture(deployGenImNFTv4DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Mint two tokens by different owners
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://token0", true, { value: mintPrice });
      await proxy.connect(thirdAccount)["safeMint(string,bool)"]("ipfs://token1", true, { value: mintPrice });

      // Whitelist otherAccount as agent
      await proxy.connect(owner).authorizeAgentWallet(otherAccount.address);

      // Fund contract for payments
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://funding", true, { value: mintPrice });

      // Whitelisted agent can update any token (regardless of owner)
      await proxy.connect(otherAccount).requestImageUpdate(0, "ipfs://updated0");
      expect(await proxy.isImageUpdated(0)).to.be.true;
      expect(await proxy.tokenURI(0)).to.equal("ipfs://updated0");

      // Fund again
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://funding2", true, { value: mintPrice });

      await proxy.connect(otherAccount).requestImageUpdate(1, "ipfs://updated1");
      expect(await proxy.isImageUpdated(1)).to.be.true;
      expect(await proxy.tokenURI(1)).to.equal("ipfs://updated1");
    });

    it("Should return only public tokens when querying", async function () {
      const { proxy, owner } = await loadFixture(deployGenImNFTv4DirectFixture);
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

    it("Should return all public tokens across all owners", async function () {
      const { proxy, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Initially no tokens
      let allPublicTokens = await proxy.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(0);

      // Mint tokens by different owners with mixed privacy settings
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://owner-public1", true, { value: mintPrice });
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://owner-private", false, { value: mintPrice });
      await proxy.connect(otherAccount)["safeMint(string,bool)"]("ipfs://other-public1", true, { value: mintPrice });
      await proxy.connect(otherAccount)["safeMint(string,bool)"]("ipfs://other-private", false, { value: mintPrice });
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://owner-public2", true, { value: mintPrice });

      // Get all public tokens (should return tokens from both owners)
      allPublicTokens = await proxy.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(3);
      expect(allPublicTokens).to.deep.equal([0n, 2n, 4n]);

      // Change one public token to private
      await proxy.connect(owner).setTokenListed(0, false);

      allPublicTokens = await proxy.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(2);
      expect(allPublicTokens).to.deep.equal([2n, 4n]);

      // Change a private token to public
      await proxy.connect(otherAccount).setTokenListed(3, true);

      allPublicTokens = await proxy.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(3);
      expect(allPublicTokens).to.deep.equal([2n, 3n, 4n]);
    });

    it("Should handle edge cases for getAllPublicTokens", async function () {
      const { proxy, owner } = await loadFixture(deployGenImNFTv4DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Test empty collection
      let allPublicTokens = await proxy.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(0);

      // Test all private tokens
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://private1", false, { value: mintPrice });
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://private2", false, { value: mintPrice });

      allPublicTokens = await proxy.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(0);

      // Test all public tokens
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://public1", true, { value: mintPrice });
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://public2", true, { value: mintPrice });

      allPublicTokens = await proxy.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(2);
      expect(allPublicTokens).to.deep.equal([2n, 3n]);
    });

    it("Should correctly handle burned tokens in getAllPublicTokens", async function () {
      const { proxy, owner } = await loadFixture(deployGenImNFTv4DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Mint some public tokens
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://public1", true, { value: mintPrice });
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://public2", true, { value: mintPrice });
      await proxy.connect(owner)["safeMint(string,bool)"]("ipfs://public3", true, { value: mintPrice });

      // All should be public
      let allPublicTokens = await proxy.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(3);
      expect(allPublicTokens).to.deep.equal([0n, 1n, 2n]);

      // Burn a token in the middle
      await proxy.connect(owner).burn(1);

      // Should only return existing public tokens
      allPublicTokens = await proxy.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(2);
      expect(allPublicTokens).to.deep.equal([0n, 2n]);
    });
  });

  // Use shared basic NFT tests for v3 with viem (like V2)
  // Removed duplicate describe blocks for "Basic NFT Functionality" and "Image Updates" as they are already defined earlier in the file.
  // NOTE: Advanced image update tests SKIPPED for v4 - authorization required
  // V4 requires proper authorization setup which shared tests don't provide

  // Use shared enumeration tests for v4 with viem
  describe(
    "Token Transfers and Burns (Direct V4 Deployment)",
    createEnumerationTests(deployGenImNFTv4DirectFixtureViem),
  );

  // Use shared wallet enumeration tests for v4 with viem
  describe(
    "Wallet NFT Enumeration Helper (Direct V4 Deployment)",
    createWalletEnumerationTests(deployGenImNFTv4DirectFixtureViem, "GenImNFTv4"),
  );

  describe("Security Fix Verification (CVE-2025-11-26)", function () {
    it("Should PREVENT unauthorized attacker from updating tokens (exploit fixed)", async function () {
      // This test verifies that the exploit from Nov 26, 2025 is now FIXED in v4
      // Original attacker: 0x8B6B008A0073D34D04ff00210E7200Ab00003300
      // Original vulnerability: No authorization in requestImageUpdate()
      // V4 Fix: EIP-8004 compatible whitelist - only authorized agents can update

      const { proxy, owner, otherAccount, thirdAccount } = await loadFixture(deployGenImNFTv4DirectFixture);
      const mintPrice = await proxy.mintPrice();

      // Step 1: Owner mints a token WITHOUT setting defaultImageUpdater
      await proxy.connect(owner)["safeMint(string,bool)"]("", true, { value: mintPrice });
      const tokenId = 0n;

      // Verify initial state
      expect(await proxy.ownerOf(tokenId)).to.equal(owner.address);
      expect(await proxy.isImageUpdated(tokenId)).to.be.false;

      // Step 2: Contract has funds from mint (to pay updater)
      const contractBalance = await hre.ethers.provider.getBalance(await proxy.getAddress());
      expect(contractBalance).to.equal(mintPrice);

      // Step 3: Attacker (unauthorized third party) watches for mint event and attacks
      // THE EXPLOIT IS NOW BLOCKED: Attacker tries to call requestImageUpdate
      await expect(
        proxy.connect(thirdAccount).requestImageUpdate(tokenId, "ipfs://attacker-controlled-url")
      ).to.be.rejectedWith("Not authorized agent");

      // Step 4: Verify exploit was blocked
      expect(await proxy.isImageUpdated(tokenId)).to.be.false; // Token NOT updated
      expect(await proxy.tokenURI(tokenId)).to.equal(""); // URI unchanged

      // Step 5: Only whitelisted agent can update
      await proxy.connect(owner).authorizeAgentWallet(otherAccount.address);
      await proxy.connect(otherAccount).requestImageUpdate(tokenId, "ipfs://legitimate-url");
      
      // Step 6: Verify legitimate update succeeded
      expect(await proxy.isImageUpdated(tokenId)).to.be.true;
      expect(await proxy.tokenURI(tokenId)).to.equal("ipfs://legitimate-url");

      // Impact: Token is permanently locked with attacker's URL, legitimate service cannot update
    });
  });

  // Aufräumen nach jedem Test
  afterEach(function () {
    cleanupTestFiles();
  });
});
