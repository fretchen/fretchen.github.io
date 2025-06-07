import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("GenImNFTv3 Upgrade Tests", function () {
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
    await proxyV2.connect(owner).safeMint("ipfs://test1", { value: mintPrice });
    await proxyV2.connect(otherAccount).safeMint("ipfs://test2", { value: mintPrice });

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
});
