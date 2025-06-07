import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress } from "viem";

describe("GenImNFTv3 OpenZeppelin Upgrades Plugin", function () {
  // Fixture to deploy initial GenImNFTv2 proxy using OpenZeppelin
  async function deployGenImNFTv2Fixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    
    // Deploy GenImNFTv2 using OpenZeppelin upgrades plugin
    const GenImNFTv2Factory = await hre.ethers.getContractFactory("GenImNFTv2");
    const proxy = await hre.upgrades.deployProxy(GenImNFTv2Factory, [], {
      initializer: "initialize",
      kind: "uups"
    });
    await proxy.waitForDeployment();
    
    const proxyAddress = await proxy.getAddress();
    
    // Get viem contract instance for easier testing
    const genImNFTv2 = await hre.viem.getContractAt("GenImNFTv2", proxyAddress);
    const mintPrice = await genImNFTv2.read.mintPrice();
    
    return {
      genImNFTv2,
      proxy,
      owner,
      otherAccount,
      mintPrice,
      proxyAddress
    };
  }

  // Fixture to deploy V2 and upgrade to V3 using OpenZeppelin
  async function deployAndUpgradeToV3Fixture() {
    const { genImNFTv2, proxy, owner, otherAccount, mintPrice, proxyAddress } = await loadFixture(deployGenImNFTv2Fixture);
    
    // Mint some tokens before upgrade
    await genImNFTv2.write.safeMint(["ipfs://token1"], { value: mintPrice, account: otherAccount.account });
    await genImNFTv2.write.safeMint(["ipfs://token2"], { value: mintPrice, account: otherAccount.account });
    
    // Upgrade to V3 using OpenZeppelin upgrades plugin
    const GenImNFTv3Factory = await hre.ethers.getContractFactory("GenImNFTv3");
    const upgradedProxy = await hre.upgrades.upgradeProxy(proxy, GenImNFTv3Factory, {
      call: { fn: "reinitializeV3", args: [] }
    });
    
    // Get viem contract instance with V3 ABI
    const genImNFTv3 = await hre.viem.getContractAt("GenImNFTv3", proxyAddress);
    
    return {
      genImNFTv2,
      genImNFTv3,
      upgradedProxy,
      owner,
      otherAccount,
      mintPrice,
      proxyAddress
    };
  }

  describe("Initial V2 Deployment", function () {
    it("Should deploy GenImNFTv2 proxy correctly", async function () {
      const { genImNFTv2, owner } = await loadFixture(deployGenImNFTv2Fixture);

      expect(await genImNFTv2.read.name()).to.equal("GenImNFTv2");
      expect(await genImNFTv2.read.symbol()).to.equal("GENIMGv2");
      expect(await genImNFTv2.read.owner()).to.equal(getAddress(owner.account.address));
      expect(await genImNFTv2.read.totalSupply()).to.equal(0n);
    });

    it("Should allow minting tokens in V2", async function () {
      const { genImNFTv2, otherAccount, mintPrice } = await loadFixture(deployGenImNFTv2Fixture);

      await genImNFTv2.write.safeMint(["ipfs://test"], { value: mintPrice, account: otherAccount.account });
      
      expect(await genImNFTv2.read.totalSupply()).to.equal(1n);
      expect(await genImNFTv2.read.ownerOf([0n])).to.equal(getAddress(otherAccount.account.address));
      expect(await genImNFTv2.read.tokenURI([0n])).to.equal("ipfs://test");
    });
  });

  describe("Upgrade from V2 to V3", function () {
    it("Should upgrade proxy to V3 and preserve existing data", async function () {
      const { genImNFTv3, otherAccount, proxyAddress } = await loadFixture(deployAndUpgradeToV3Fixture);

      // Verify proxy address is the same
      expect(genImNFTv3.address).to.equal(proxyAddress);
      
      // Verify existing tokens are preserved
      expect(await genImNFTv3.read.totalSupply()).to.equal(2n);
      expect(await genImNFTv3.read.ownerOf([0n])).to.equal(getAddress(otherAccount.account.address));
      expect(await genImNFTv3.read.ownerOf([1n])).to.equal(getAddress(otherAccount.account.address));
      expect(await genImNFTv3.read.tokenURI([0n])).to.equal("ipfs://token1");
      expect(await genImNFTv3.read.tokenURI([1n])).to.equal("ipfs://token2");
    });

    it("Should mark existing tokens as listed during upgrade", async function () {
      const { genImNFTv3 } = await loadFixture(deployAndUpgradeToV3Fixture);

      // All existing tokens should be marked as listed after upgrade
      expect(await genImNFTv3.read.isTokenListed([0n])).to.be.true;
      expect(await genImNFTv3.read.isTokenListed([1n])).to.be.true;
    });

    it("Should maintain backward compatibility with V2 functions", async function () {
      const { genImNFTv3, otherAccount, mintPrice } = await loadFixture(deployAndUpgradeToV3Fixture);

      // V2 function should still work and default to listed=true
      await genImNFTv3.write.safeMint(["ipfs://v2-style"], { value: mintPrice, account: otherAccount.account });
      
      const newTokenId = 2n;
      expect(await genImNFTv3.read.ownerOf([newTokenId])).to.equal(getAddress(otherAccount.account.address));
      expect(await genImNFTv3.read.tokenURI([newTokenId])).to.equal("ipfs://v2-style");
      expect(await genImNFTv3.read.isTokenListed([newTokenId])).to.be.true; // Should default to listed
    });

    it("Should enable new V3 functionality", async function () {
      const { genImNFTv3, otherAccount, mintPrice } = await loadFixture(deployAndUpgradeToV3Fixture);

      // Test new V3 function with explicit listing parameter
      await genImNFTv3.write.safeMint(["ipfs://private-token", false], { value: mintPrice, account: otherAccount.account });
      
      const privateTokenId = 2n;
      expect(await genImNFTv3.read.ownerOf([privateTokenId])).to.equal(getAddress(otherAccount.account.address));
      expect(await genImNFTv3.read.tokenURI([privateTokenId])).to.equal("ipfs://private-token");
      expect(await genImNFTv3.read.isTokenListed([privateTokenId])).to.be.false; // Should be private
    });

    it("Should allow batch listing operations", async function () {
      const { genImNFTv3, otherAccount } = await loadFixture(deployAndUpgradeToV3Fixture);

      // Initially both tokens should be listed
      expect(await genImNFTv3.read.isTokenListed([0n])).to.be.true;
      expect(await genImNFTv3.read.isTokenListed([1n])).to.be.true;

      // Batch update to make them private
      await genImNFTv3.write.setMultipleTokensListed([[0n, 1n], false], { account: otherAccount.account });
      
      expect(await genImNFTv3.read.isTokenListed([0n])).to.be.false;
      expect(await genImNFTv3.read.isTokenListed([1n])).to.be.false;

      // Batch update to make them public again
      await genImNFTv3.write.setMultipleTokensListed([[0n, 1n], true], { account: otherAccount.account });
      
      expect(await genImNFTv3.read.isTokenListed([0n])).to.be.true;
      expect(await genImNFTv3.read.isTokenListed([1n])).to.be.true;
    });

    it("Should filter public tokens correctly", async function () {
      const { genImNFTv3, otherAccount, mintPrice } = await loadFixture(deployAndUpgradeToV3Fixture);

      // Add a private token using V3 safeMint
      await genImNFTv3.write.safeMint(["ipfs://private", false], { value: mintPrice, account: otherAccount.account });
      
      // Make token 1 private
      await genImNFTv3.write.setTokenListed([1n, false], { account: otherAccount.account });

      // Get public tokens (should only include token 0)
      const publicTokens = await genImNFTv3.read.getPublicTokensOfOwner([getAddress(otherAccount.account.address)]);
      
      expect(publicTokens).to.have.lengthOf(1);
      expect(publicTokens[0]).to.equal(0n);
    });

    it("Should verify implementation address changed after upgrade", async function () {
      const { genImNFTv2, proxyAddress, otherAccount, mintPrice } = await loadFixture(deployGenImNFTv2Fixture);

      // Mint a token before upgrade to test V3 functionality after upgrade
      await genImNFTv2.write.safeMint(["ipfs://test"], { value: mintPrice, account: otherAccount.account });

      // Get implementation before upgrade
      const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const publicClient = await hre.viem.getPublicClient();
      
      const implBefore = await publicClient.getStorageAt({
        address: proxyAddress as `0x${string}`,
        slot: implementationSlot as `0x${string}`
      });
      
      // Perform upgrade
      const GenImNFTv3Factory = await hre.ethers.getContractFactory("GenImNFTv3");
      const upgradedProxy = await hre.upgrades.upgradeProxy(await hre.ethers.getContractAt("GenImNFTv2", proxyAddress), GenImNFTv3Factory, {
        call: { fn: "reinitializeV3", args: [] }
      });
      
      // Get implementation after upgrade
      const implAfter = await publicClient.getStorageAt({
        address: proxyAddress as `0x${string}`,
        slot: implementationSlot as `0x${string}`
      });
      
      console.log("Implementation before upgrade:", `0x${implBefore!.slice(-40)}`);
      console.log("Implementation after upgrade:", `0x${implAfter!.slice(-40)}`);
      
      // Verify implementation changed
      expect(implBefore).to.not.equal(implAfter);
      
      // Verify V3 functionality works - test with the token we minted before upgrade
      const genImNFTv3 = await hre.viem.getContractAt("GenImNFTv3", proxyAddress);
      const isListed = await genImNFTv3.read.isTokenListed([0n]); // Token 0 exists and should be listed after upgrade
      expect(isListed).to.be.true;
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle upgrade with no existing tokens", async function () {
      const { genImNFTv2, proxyAddress } = await loadFixture(deployGenImNFTv2Fixture);

      // Upgrade without any tokens
      const GenImNFTv3Factory = await hre.ethers.getContractFactory("GenImNFTv3");
      const upgradedProxy = await hre.upgrades.upgradeProxy(
        await hre.ethers.getContractAt("GenImNFTv2", proxyAddress), 
        GenImNFTv3Factory, {
          call: { fn: "reinitializeV3", args: [] }
        }
      );

      const genImNFTv3 = await hre.viem.getContractAt("GenImNFTv3", proxyAddress);
      expect(await genImNFTv3.read.totalSupply()).to.equal(0n);
    });

    it("Should handle large number of existing tokens", async function () {
      const { genImNFTv2, otherAccount, mintPrice, proxyAddress } = await loadFixture(deployGenImNFTv2Fixture);

      // Mint multiple tokens
      const numTokens = 5;
      for (let i = 0; i < numTokens; i++) {
        await genImNFTv2.write.safeMint([`ipfs://token${i}`], { value: mintPrice, account: otherAccount.account });
      }

      // Upgrade to v3
      const GenImNFTv3Factory = await hre.ethers.getContractFactory("GenImNFTv3");
      const upgradedProxy = await hre.upgrades.upgradeProxy(
        await hre.ethers.getContractAt("GenImNFTv2", proxyAddress), 
        GenImNFTv3Factory, {
          call: { fn: "reinitializeV3", args: [] }
        }
      );

      const genImNFTv3 = await hre.viem.getContractAt("GenImNFTv3", proxyAddress);

      // Verify all tokens are preserved and listed
      expect(await genImNFTv3.read.totalSupply()).to.equal(BigInt(numTokens));
      
      for (let i = 0; i < numTokens; i++) {
        expect(await genImNFTv3.read.ownerOf([BigInt(i)])).to.equal(getAddress(otherAccount.account.address));
        expect(await genImNFTv3.read.isTokenListed([BigInt(i)])).to.be.true;
        expect(await genImNFTv3.read.tokenURI([BigInt(i)])).to.equal(`ipfs://token${i}`);
      }
    });
  });

  describe("Integration with Real-world Scenarios", function () {
    it("Should handle multiple owners with different token counts", async function () {
      const { genImNFTv2, owner, otherAccount, mintPrice, proxyAddress } = await loadFixture(deployGenImNFTv2Fixture);

      // Multiple accounts mint tokens
      await genImNFTv2.write.safeMint(["ipfs://owner-token"], { value: mintPrice, account: owner.account });
      await genImNFTv2.write.safeMint(["ipfs://other-token1"], { value: mintPrice, account: otherAccount.account });
      await genImNFTv2.write.safeMint(["ipfs://other-token2"], { value: mintPrice, account: otherAccount.account });

      // Upgrade to v3
      const GenImNFTv3Factory = await hre.ethers.getContractFactory("GenImNFTv3");
      const upgradedProxy = await hre.upgrades.upgradeProxy(
        await hre.ethers.getContractAt("GenImNFTv2", proxyAddress), 
        GenImNFTv3Factory, {
          call: { fn: "reinitializeV3", args: [] }
        }
      );

      const genImNFTv3 = await hre.viem.getContractAt("GenImNFTv3", proxyAddress);

      // Verify ownership and listing status
      expect(await genImNFTv3.read.ownerOf([0n])).to.equal(getAddress(owner.account.address));
      expect(await genImNFTv3.read.ownerOf([1n])).to.equal(getAddress(otherAccount.account.address));
      expect(await genImNFTv3.read.ownerOf([2n])).to.equal(getAddress(otherAccount.account.address));

      // All should be listed
      expect(await genImNFTv3.read.isTokenListed([0n])).to.be.true;
      expect(await genImNFTv3.read.isTokenListed([1n])).to.be.true;
      expect(await genImNFTv3.read.isTokenListed([2n])).to.be.true;

      // Test public token filtering per owner
      const ownerPublicTokens = await genImNFTv3.read.getPublicTokensOfOwner([getAddress(owner.account.address)]);
      const otherPublicTokens = await genImNFTv3.read.getPublicTokensOfOwner([getAddress(otherAccount.account.address)]);

      expect(ownerPublicTokens).to.have.lengthOf(1);
      expect(ownerPublicTokens[0]).to.equal(0n);
      
      expect(otherPublicTokens).to.have.lengthOf(2);
      expect(otherPublicTokens).to.include(1n);
      expect(otherPublicTokens).to.include(2n);
    });
  });
});
