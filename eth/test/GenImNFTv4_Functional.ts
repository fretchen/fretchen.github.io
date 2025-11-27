import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import hre from "hardhat";

// Import shared test utilities
import {
  createBasicNFTTests,
  createEnumerationTests,
  createWalletEnumerationTests,
  cleanupTestFiles,
  ContractFixture,
} from "./shared/GenImNFTSharedTests";

describe("GenImNFTv4 - Functional Tests", function () {
  async function deployGenImNFTv4DirectFixtureViem(): Promise<ContractFixture> {
    // Deploy using ethers.js (required for upgrades)
    const GenImNFTv4 = await ethers.getContractFactory("GenImNFTv4");
    const proxy = await upgrades.deployProxy(GenImNFTv4, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await proxy.waitForDeployment();

    // Get viem clients for all testing
    const [viemOwner, viemOtherAccount, viemRecipient] = await hre.viem.getWalletClients();

    // Create viem contract interface at the proxy address
    const viemContract = await hre.viem.getContractAt("GenImNFTv4", await proxy.getAddress());

    return {
      contract: viemContract,
      genImNFTPublic: viemContract,
      owner: viemOwner,
      otherAccount: viemOtherAccount,
      recipient: viemRecipient,
    };
  }

  // Use shared basic NFT tests for v4 with viem
  describe("Basic NFT Functionality (Direct V4 Deployment)", function () {
    createBasicNFTTests(deployGenImNFTv4DirectFixtureViem);
  });

  // V4-specific image update tests WITH authorization setup
  describe("Image Updates with Authorization (Direct V4 Deployment)", function () {
    it("Should allow whitelisted agent to request image update and receive payment", async function () {
      const { contract, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixtureViem);
      const publicClient = await hre.viem.getPublicClient();
      
      const mintPrice = await contract.read.mintPrice();

      // Mint a token
      await contract.write.safeMint(["ipfs://initial", true], { value: mintPrice, account: owner.account });
      const tokenId = 0n;

      // Whitelist agent
      await contract.write.authorizeAgentWallet([otherAccount.account.address], { account: owner.account });

      // Record balances before update
      const agentBalanceBefore = await publicClient.getBalance({ address: otherAccount.account.address });
      const contractBalanceBefore = await publicClient.getBalance({ address: contract.address });

      // Request image update
      const hash = await contract.write.requestImageUpdate([tokenId, "ipfs://updated"], {
        account: otherAccount.account,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;

      // Verify token was updated
      expect(await contract.read.isImageUpdated([tokenId])).to.equal(true);
      expect(await contract.read.tokenURI([tokenId])).to.equal("ipfs://updated");

      // Verify payment was made to agent
      const agentBalanceAfter = await publicClient.getBalance({ address: otherAccount.account.address });
      const contractBalanceAfter = await publicClient.getBalance({ address: contract.address });

      expect(agentBalanceAfter).to.equal(agentBalanceBefore + mintPrice - gasUsed);
      expect(contractBalanceAfter).to.equal(contractBalanceBefore - mintPrice);
    });

    it("Should reject image update from non-whitelisted address", async function () {
      const { contract, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixtureViem);
      const mintPrice = await contract.read.mintPrice();

      // Mint a token
      await contract.write.safeMint(["ipfs://initial", true], { value: mintPrice, account: owner.account });
      const tokenId = 0n;

      // Try to update without being whitelisted
      await expect(
        contract.write.requestImageUpdate([tokenId, "ipfs://unauthorized"], { account: otherAccount.account })
      ).to.be.rejectedWith("Not authorized agent");

      // Verify token was NOT updated
      expect(await contract.read.isImageUpdated([tokenId])).to.equal(false);
      expect(await contract.read.tokenURI([tokenId])).to.equal("ipfs://initial");
    });

    it("Should prevent duplicate image updates", async function () {
      const { contract, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixtureViem);
      const mintPrice = await contract.read.mintPrice();

      // Mint a token and whitelist agent
      await contract.write.safeMint(["ipfs://initial", true], { value: mintPrice, account: owner.account });
      await contract.write.authorizeAgentWallet([otherAccount.account.address], { account: owner.account });

      // First update should succeed
      await contract.write.requestImageUpdate([0n, "ipfs://updated"], { account: otherAccount.account });
      expect(await contract.read.isImageUpdated([0n])).to.equal(true);

      // Second update should fail
      await expect(
        contract.write.requestImageUpdate([0n, "ipfs://double-update"], { account: otherAccount.account })
      ).to.be.rejectedWith("Image already updated");
    });

    it("Should reject update for non-existent token", async function () {
      const { contract, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixtureViem);

      // Whitelist agent
      await contract.write.authorizeAgentWallet([otherAccount.account.address], { account: owner.account });

      // Try to update non-existent token
      await expect(
        contract.write.requestImageUpdate([999n, "ipfs://nonexistent"], { account: otherAccount.account })
      ).to.be.rejectedWith("Token does not exist");
    });

    it("Should allow revoking agent authorization", async function () {
      const { contract, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixtureViem);
      const mintPrice = await contract.read.mintPrice();

      // Mint tokens
      await contract.write.safeMint(["ipfs://token0", true], { value: mintPrice, account: owner.account });
      await contract.write.safeMint(["ipfs://token1", true], { value: mintPrice, account: owner.account });

      // Whitelist and use agent
      await contract.write.authorizeAgentWallet([otherAccount.account.address], { account: owner.account });
      await contract.write.requestImageUpdate([0n, "ipfs://updated0"], { account: otherAccount.account });
      expect(await contract.read.isImageUpdated([0n])).to.equal(true);

      // Revoke authorization
      await contract.write.revokeAgentWallet([otherAccount.account.address], { account: owner.account });
      expect(await contract.read.isAuthorizedAgent([otherAccount.account.address])).to.equal(false);

      // Fund contract again
      await contract.write.safeMint(["ipfs://funding", true], { value: mintPrice, account: owner.account });

      // Should now be rejected
      await expect(
        contract.write.requestImageUpdate([1n, "ipfs://updated1"], { account: otherAccount.account })
      ).to.be.rejectedWith("Not authorized agent");
    });
  });

  describe("V4 Specific Features (Authorization & Security)", function () {
    it("Should allow owner to whitelist agent wallets (EIP-8004)", async function () {
      const { contract, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixtureViem);
      
      // Initially not whitelisted
      expect(await contract.read.isAuthorizedAgent([otherAccount.account.address])).to.equal(false);

      // Owner whitelists agent
      await contract.write.authorizeAgentWallet([otherAccount.account.address], { account: owner.account });
      expect(await contract.read.isAuthorizedAgent([otherAccount.account.address])).to.equal(true);
      
      // Owner can revoke
      await contract.write.revokeAgentWallet([otherAccount.account.address], { account: owner.account });
      expect(await contract.read.isAuthorizedAgent([otherAccount.account.address])).to.equal(false);
    });

    it("Should allow whitelisted agent to update any token", async function () {
      const { contract, owner, otherAccount, recipient } = await loadFixture(deployGenImNFTv4DirectFixtureViem);
      const mintPrice = await contract.read.mintPrice();

      // Mint two tokens by different owners
      await contract.write.safeMint(["ipfs://token0", true], { value: mintPrice, account: owner.account });
      await contract.write.safeMint(["ipfs://token1", true], { value: mintPrice, account: recipient.account });

      // Whitelist otherAccount as agent
      await contract.write.authorizeAgentWallet([otherAccount.account.address], { account: owner.account });

      // Fund contract for payments
      await contract.write.safeMint(["ipfs://funding", true], { value: mintPrice, account: owner.account });

      // Whitelisted agent can update any token (regardless of owner)
      await contract.write.requestImageUpdate([0n, "ipfs://updated0"], { account: otherAccount.account });
      expect(await contract.read.isImageUpdated([0n])).to.equal(true);
      expect(await contract.read.tokenURI([0n])).to.equal("ipfs://updated0");

      // Fund again
      await contract.write.safeMint(["ipfs://funding2", true], { value: mintPrice, account: owner.account });

      await contract.write.requestImageUpdate([1n, "ipfs://updated1"], { account: otherAccount.account });
      expect(await contract.read.isImageUpdated([1n])).to.equal(true);
      expect(await contract.read.tokenURI([1n])).to.equal("ipfs://updated1");
    });

    it("Should return only public tokens when querying", async function () {
      const { contract, owner } = await loadFixture(deployGenImNFTv4DirectFixtureViem);
      const mintPrice = await contract.read.mintPrice();

      // Mint mixed tokens
      await contract.write.safeMint(["ipfs://public1", true], { value: mintPrice, account: owner.account });
      await contract.write.safeMint(["ipfs://private1", false], { value: mintPrice, account: owner.account });
      await contract.write.safeMint(["ipfs://public2", true], { value: mintPrice, account: owner.account });

      // Get public tokens
      const publicTokens = await contract.read.getPublicTokensOfOwner([owner.account.address]);
      expect(publicTokens.length).to.equal(2);
      expect(publicTokens).to.deep.equal([0n, 2n]);
    });

    it("Should return all public tokens across all owners", async function () {
      const { contract, owner, otherAccount } = await loadFixture(deployGenImNFTv4DirectFixtureViem);
      const mintPrice = await contract.read.mintPrice();

      // Initially no tokens
      let allPublicTokens = await contract.read.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(0);

      // Mint tokens by different owners with mixed privacy settings
      await contract.write.safeMint(["ipfs://owner-public1", true], { value: mintPrice, account: owner.account });
      await contract.write.safeMint(["ipfs://owner-private", false], { value: mintPrice, account: owner.account });
      await contract.write.safeMint(["ipfs://other-public1", true], { value: mintPrice, account: otherAccount.account });
      await contract.write.safeMint(["ipfs://other-private", false], { value: mintPrice, account: otherAccount.account });
      await contract.write.safeMint(["ipfs://owner-public2", true], { value: mintPrice, account: owner.account });

      // Get all public tokens (should return tokens from both owners)
      allPublicTokens = await contract.read.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(3);
      expect(allPublicTokens).to.deep.equal([0n, 2n, 4n]);

      // Change one public token to private
      await contract.write.setTokenListed([0n, false], { account: owner.account });

      allPublicTokens = await contract.read.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(2);
      expect(allPublicTokens).to.deep.equal([2n, 4n]);

      // Change a private token to public
      await contract.write.setTokenListed([3n, true], { account: otherAccount.account });

      allPublicTokens = await contract.read.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(3);
      expect(allPublicTokens).to.deep.equal([2n, 3n, 4n]);
    });

    it("Should handle edge cases for getAllPublicTokens", async function () {
      const { contract, owner } = await loadFixture(deployGenImNFTv4DirectFixtureViem);
      const mintPrice = await contract.read.mintPrice();

      // Test empty collection
      let allPublicTokens = await contract.read.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(0);

      // Test all private tokens
      await contract.write.safeMint(["ipfs://private1", false], { value: mintPrice, account: owner.account });
      await contract.write.safeMint(["ipfs://private2", false], { value: mintPrice, account: owner.account });

      allPublicTokens = await contract.read.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(0);

      // Test all public tokens
      await contract.write.safeMint(["ipfs://public1", true], { value: mintPrice, account: owner.account });
      await contract.write.safeMint(["ipfs://public2", true], { value: mintPrice, account: owner.account });

      allPublicTokens = await contract.read.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(2);
      expect(allPublicTokens).to.deep.equal([2n, 3n]);
    });

    it("Should correctly handle burned tokens in getAllPublicTokens", async function () {
      const { contract, owner } = await loadFixture(deployGenImNFTv4DirectFixtureViem);
      const mintPrice = await contract.read.mintPrice();

      // Mint some public tokens
      await contract.write.safeMint(["ipfs://public1", true], { value: mintPrice, account: owner.account });
      await contract.write.safeMint(["ipfs://public2", true], { value: mintPrice, account: owner.account });
      await contract.write.safeMint(["ipfs://public3", true], { value: mintPrice, account: owner.account });

      // All should be public
      let allPublicTokens = await contract.read.getAllPublicTokens();
      expect(allPublicTokens.length).to.equal(3);
      expect(allPublicTokens).to.deep.equal([0n, 1n, 2n]);

      // Burn a token in the middle
      await contract.write.burn([1n], { account: owner.account });

      // Should only return existing public tokens
      allPublicTokens = await contract.read.getAllPublicTokens();
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

      const { contract, owner, otherAccount, recipient } = await loadFixture(deployGenImNFTv4DirectFixtureViem);
      const publicClient = await hre.viem.getPublicClient();
      const mintPrice = await contract.read.mintPrice();

      // Step 1: Owner mints a token WITHOUT setting defaultImageUpdater
      await contract.write.safeMint(["", true], { value: mintPrice, account: owner.account });
      const tokenId = 0n;

      // Verify initial state
      expect((await contract.read.ownerOf([tokenId])).toLowerCase()).to.equal(
        owner.account.address.toLowerCase(),
      );
      expect(await contract.read.isImageUpdated([tokenId])).to.equal(false);

      // Step 2: Contract has funds from mint (to pay updater)
      const contractBalance = await publicClient.getBalance({ address: contract.address });
      expect(contractBalance).to.equal(mintPrice);

      // Step 3: Attacker (unauthorized third party) watches for mint event and attacks
      // THE EXPLOIT IS NOW BLOCKED: Attacker tries to call requestImageUpdate
      await expect(
        contract.write.requestImageUpdate([tokenId, "ipfs://attacker-controlled-url"], {
          account: recipient.account,
        }),
      ).to.be.rejectedWith("Not authorized agent");

      // Step 4: Verify exploit was blocked
      expect(await contract.read.isImageUpdated([tokenId])).to.equal(false); // Token NOT updated
      expect(await contract.read.tokenURI([tokenId])).to.equal(""); // URI unchanged

      // Step 5: Only whitelisted agent can update
      await contract.write.authorizeAgentWallet([otherAccount.account.address], { account: owner.account });
      await contract.write.requestImageUpdate([tokenId, "ipfs://legitimate-url"], {
        account: otherAccount.account,
      });

      // Step 6: Verify legitimate update succeeded
      expect(await contract.read.isImageUpdated([tokenId])).to.equal(true);
      expect(await contract.read.tokenURI([tokenId])).to.equal("ipfs://legitimate-url");
    });
  });

  // Aufräumen nach jedem Test
  afterEach(function () {
    cleanupTestFiles();
  });
});
