import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress } from "viem";

const GEN_IM_MINT_PRICE = hre.ethers.parseEther("0.01");
const BASE_MINT_PRICE = hre.ethers.parseEther("0.001");

describe("CollectorNFTv1 - Functional Tests", function () {
  // Fixture to deploy GenImNFTv3 for testing (using ethers for deployment, viem for testing)
  async function deployGenImNFTv3Fixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    // Deploy GenImNFTv3 using ethers (required for OpenZeppelin upgrades)
    const GenImNFTv3Factory = await hre.ethers.getContractFactory("GenImNFTv3");
    const genImProxy = await hre.upgrades.deployProxy(GenImNFTv3Factory, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await genImProxy.waitForDeployment();

    const genImAddress = await genImProxy.getAddress();
    const genImNFT = await hre.viem.getContractAt("GenImNFTv3", genImAddress);

    return {
      genImNFT,
      genImAddress,
      owner,
      otherAccount,
    };
  }

  // Fixture to deploy CollectorNFTv1
  async function deployCollectorNFTv1Fixture() {
    const { genImNFT, genImAddress, owner, otherAccount } = await loadFixture(deployGenImNFTv3Fixture);

    // Deploy CollectorNFTv1 using ethers (required for OpenZeppelin upgrades)
    const CollectorNFTv1Factory = await hre.ethers.getContractFactory("CollectorNFTv1");
    const collectorProxy = await hre.upgrades.deployProxy(CollectorNFTv1Factory, [genImAddress, BASE_MINT_PRICE], {
      initializer: "initialize",
      kind: "uups",
    });
    await collectorProxy.waitForDeployment();

    const proxyAddress = await collectorProxy.getAddress();
    const collectorNFTv1 = await hre.viem.getContractAt("CollectorNFTv1", proxyAddress);

    return {
      genImNFT,
      genImAddress,
      collectorNFTv1,
      proxyAddress,
      owner,
      otherAccount,
    };
  }

  // Fixture with test data
  async function deployCollectorNFTv1WithDataFixture() {
    const fixtureData = await loadFixture(deployCollectorNFTv1Fixture);
    const { genImNFT, owner, otherAccount } = fixtureData;

    // Mint some GenImNFTs for testing
    await genImNFT.write.safeMint(["ipfs://test-uri-1", true], {
      account: owner.account,
      value: GEN_IM_MINT_PRICE,
    });

    await genImNFT.write.safeMint(["ipfs://test-uri-2", true], {
      account: otherAccount.account,
      value: GEN_IM_MINT_PRICE,
    });

    await genImNFT.write.safeMint(["ipfs://test-uri-3", false], {
      account: owner.account,
      value: GEN_IM_MINT_PRICE,
    });

    return fixtureData;
  }

  describe("Basic Minting Functionality", function () {
    it("Should allow minting CollectorNFTs for listed GenImNFTs", async function () {
      const { genImNFT, collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      // Mint a CollectorNFT for the first GenImNFT (which is listed)
      await collectorNFTv1.write.mintCollectorNFT([0n], {
        account: otherAccount.account,
        value: BASE_MINT_PRICE,
      });

      expect(await collectorNFTv1.read.totalSupply()).to.equal(1n);
      expect(await collectorNFTv1.read.ownerOf([0n])).to.equal(getAddress(otherAccount.account.address));

      // Check that URI was copied from GenImNFT
      const collectorURI = await collectorNFTv1.read.tokenURI([0n]);
      const genImURI = await genImNFT.read.tokenURI([0n]);
      expect(collectorURI).to.equal(genImURI);
      expect(collectorURI).to.equal("ipfs://test-uri-1");
    });

    it("Should reject minting for unlisted GenImNFTs", async function () {
      const { collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      // Try to mint for GenImNFT token 2 (which is not listed)
      await expect(
        collectorNFTv1.write.mintCollectorNFT([2n], {
          account: otherAccount.account,
          value: BASE_MINT_PRICE,
        }),
      ).to.be.rejected;
    });

    it("Should reject minting with insufficient payment", async function () {
      const { collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      // Try to mint with insufficient payment
      await expect(
        collectorNFTv1.write.mintCollectorNFT([0n], {
          account: otherAccount.account,
          value: BASE_MINT_PRICE - 1n,
        }),
      ).to.be.rejected;
    });

    it("Should reject minting for non-existent GenImNFT", async function () {
      const { collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      // Try to mint for non-existent GenImNFT token
      await expect(
        collectorNFTv1.write.mintCollectorNFT([999n], {
          account: otherAccount.account,
          value: BASE_MINT_PRICE,
        }),
      ).to.be.rejected;
    });
  });

  describe("Dynamic Pricing System", function () {
    it("Should start with base price", async function () {
      const { collectorNFTv1 } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      expect(await collectorNFTv1.read.getCurrentPrice([0n])).to.equal(BASE_MINT_PRICE);
    });

    it("Should maintain base price for first 5 mints", async function () {
      const { collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      // Mint 5 CollectorNFTs
      for (let i = 0; i < 5; i++) {
        const currentPrice = await collectorNFTv1.read.getCurrentPrice([0n]);
        await collectorNFTv1.write.mintCollectorNFT([0n], {
          account: otherAccount.account,
          value: currentPrice,
        });

        // After minting, check if price is still reasonable for the next mint
        const nextPrice = await collectorNFTv1.read.getCurrentPrice([0n]);
        if (i < 4) {
          // For first 4 mints, next price should still be base price
          expect(nextPrice).to.equal(BASE_MINT_PRICE);
        }
      }
    });

    it("Should double price after 5 mints", async function () {
      const { collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      // Mint 5 CollectorNFTs at base price
      for (let i = 0; i < 5; i++) {
        await collectorNFTv1.write.mintCollectorNFT([0n], {
          account: otherAccount.account,
          value: BASE_MINT_PRICE,
        });
      }

      // After 5 mints, price should double
      const newPrice = await collectorNFTv1.read.getCurrentPrice([0n]);
      expect(newPrice).to.equal(BASE_MINT_PRICE * 2n);

      // Mint one more at the new price
      await collectorNFTv1.write.mintCollectorNFT([0n], {
        account: otherAccount.account,
        value: newPrice,
      });

      expect(await collectorNFTv1.read.totalSupply()).to.equal(6n);
    });

    it("Should have independent pricing per GenImNFT", async function () {
      const { collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      // Mint for GenImNFT token 0
      await collectorNFTv1.write.mintCollectorNFT([0n], {
        account: otherAccount.account,
        value: BASE_MINT_PRICE,
      });

      // Mint for GenImNFT token 1
      await collectorNFTv1.write.mintCollectorNFT([1n], {
        account: otherAccount.account,
        value: BASE_MINT_PRICE,
      });

      // Both should still have base price
      expect(await collectorNFTv1.read.getCurrentPrice([0n])).to.equal(BASE_MINT_PRICE);
      expect(await collectorNFTv1.read.getCurrentPrice([1n])).to.equal(BASE_MINT_PRICE);
    });
  });

  describe("Statistics and Tracking", function () {
    it("Should track mint statistics correctly", async function () {
      const { collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      // Initially no mints
      const [mintCount, currentPrice, nextPrice] = await collectorNFTv1.read.getMintStats([0n]);
      expect(mintCount).to.equal(0n);
      expect(currentPrice).to.equal(BASE_MINT_PRICE);
      expect(nextPrice).to.equal(BASE_MINT_PRICE);

      // After one mint
      await collectorNFTv1.write.mintCollectorNFT([0n], {
        account: otherAccount.account,
        value: BASE_MINT_PRICE,
      });

      const [mintCount2, currentPrice2, nextPrice2] = await collectorNFTv1.read.getMintStats([0n]);
      expect(mintCount2).to.equal(1n);
      expect(currentPrice2).to.equal(BASE_MINT_PRICE);
      expect(nextPrice2).to.equal(BASE_MINT_PRICE); // Still base price for next 4 mints
    });

    it("Should track GenImNFT to CollectorNFT relationships", async function () {
      const { collectorNFTv1, owner, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      // Mint for different GenImNFTs
      await collectorNFTv1.write.mintCollectorNFT([0n], {
        account: owner.account,
        value: BASE_MINT_PRICE,
      });

      await collectorNFTv1.write.mintCollectorNFT([1n], {
        account: otherAccount.account,
        value: BASE_MINT_PRICE,
      });

      await collectorNFTv1.write.mintCollectorNFT([0n], {
        account: otherAccount.account,
        value: BASE_MINT_PRICE,
      });

      // Check forward relationships (CollectorNFT -> GenImNFT)
      expect(await collectorNFTv1.read.getGenImTokenIdForCollector([0n])).to.equal(0n);
      expect(await collectorNFTv1.read.getGenImTokenIdForCollector([1n])).to.equal(1n);
      expect(await collectorNFTv1.read.getGenImTokenIdForCollector([2n])).to.equal(0n);

      // Check reverse relationships (GenImNFT -> CollectorNFTs)
      const genIm0Collectors = await collectorNFTv1.read.getCollectorTokensForGenIm([0n]);
      const genIm1Collectors = await collectorNFTv1.read.getCollectorTokensForGenIm([1n]);

      expect(genIm0Collectors).to.deep.equal([0n, 2n]);
      expect(genIm1Collectors).to.deep.equal([1n]);
    });
  });

  describe("URI Management", function () {
    it("Should automatically inherit GenImNFT URI", async function () {
      const { genImNFT, collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      const genImTokenId = 0n;
      const originalURI = await genImNFT.read.tokenURI([genImTokenId]);
      expect(originalURI).to.equal("ipfs://test-uri-1");

      // Mint CollectorNFT (URI is automatically inherited)
      await collectorNFTv1.write.mintCollectorNFT([genImTokenId], {
        account: otherAccount.account,
        value: BASE_MINT_PRICE,
      });

      // Verify URI inheritance
      expect(await collectorNFTv1.read.tokenURI([0n])).to.equal(originalURI);
    });

    it("Should retrieve original GenImNFT URI for any CollectorNFT", async function () {
      const { genImNFT, collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      const genImTokenId = 1n;
      const originalURI = await genImNFT.read.tokenURI([genImTokenId]);

      // Mint CollectorNFT
      await collectorNFTv1.write.mintCollectorNFT([genImTokenId], {
        account: otherAccount.account,
        value: BASE_MINT_PRICE,
      });

      // Get original URI through the dedicated function
      const retrievedOriginalURI = await collectorNFTv1.read.getOriginalGenImURI([0n]);
      expect(retrievedOriginalURI).to.equal(originalURI);
      expect(retrievedOriginalURI).to.equal("ipfs://test-uri-2");
    });

    it("Should work with multiple collectors inheriting same URI", async function () {
      const { genImNFT, collectorNFTv1, owner, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      const genImTokenId = 0n;
      const originalURI = await genImNFT.read.tokenURI([genImTokenId]);

      // First collector mints
      await collectorNFTv1.write.mintCollectorNFT([genImTokenId], {
        account: owner.account,
        value: BASE_MINT_PRICE,
      });

      // Second collector mints
      await collectorNFTv1.write.mintCollectorNFT([genImTokenId], {
        account: otherAccount.account,
        value: BASE_MINT_PRICE,
      });

      // Both should have inherited the same URI
      expect(await collectorNFTv1.read.tokenURI([0n])).to.equal(originalURI);
      expect(await collectorNFTv1.read.tokenURI([1n])).to.equal(originalURI);

      // Verify tracking
      const collectorTokens = await collectorNFTv1.read.getCollectorTokensForGenIm([genImTokenId]);
      expect(collectorTokens).to.deep.equal([0n, 1n]);
    });
  });

  describe("Payment Distribution", function () {
    it("Should distribute payments to GenImNFT owners", async function () {
      const { genImNFT, collectorNFTv1, owner, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      const publicClient = await hre.viem.getPublicClient();

      // Get initial balances
      const initialOwnerBalance = await publicClient.getBalance({ address: owner.account.address });
      // const initialOtherBalance = await publicClient.getBalance({ address: otherAccount.account.address });

      // GenImNFT token 0 is owned by owner, token 1 is owned by otherAccount
      expect(await genImNFT.read.ownerOf([0n])).to.equal(getAddress(owner.account.address));
      expect(await genImNFT.read.ownerOf([1n])).to.equal(getAddress(otherAccount.account.address));

      // Mint CollectorNFT for token 0 (owner should receive payment)
      await collectorNFTv1.write.mintCollectorNFT([0n], {
        account: otherAccount.account, // otherAccount is buying
        value: BASE_MINT_PRICE,
      });

      // Check that owner received the payment
      const finalOwnerBalance = await publicClient.getBalance({ address: owner.account.address });
      expect(Number(finalOwnerBalance)).to.be.greaterThan(Number(initialOwnerBalance));
    });
  });

  describe("Access Control", function () {
    it("Should have correct owner", async function () {
      const { collectorNFTv1, owner } = await loadFixture(deployCollectorNFTv1Fixture);

      expect(await collectorNFTv1.read.owner()).to.equal(getAddress(owner.account.address));
    });

    it("Should allow owner to update base mint price", async function () {
      const { collectorNFTv1, owner } = await loadFixture(deployCollectorNFTv1Fixture);

      const newPrice = hre.ethers.parseEther("0.002");

      await collectorNFTv1.write.setBaseMintPrice([newPrice], {
        account: owner.account,
      });

      expect(await collectorNFTv1.read.baseMintPrice()).to.equal(newPrice);
    });

    it("Should reject non-owner attempts to update base mint price", async function () {
      const { collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1Fixture);

      const newPrice = hre.ethers.parseEther("0.002");

      await expect(
        collectorNFTv1.write.setBaseMintPrice([newPrice], {
          account: otherAccount.account,
        }),
      ).to.be.rejected;
    });
  });
});
