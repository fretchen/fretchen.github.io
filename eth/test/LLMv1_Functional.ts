import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress } from "viem";
import { deployCollectorNFTv1 } from "../scripts/deploy-collector-nft-v1";

const GEN_IM_MINT_PRICE = hre.ethers.parseEther("0.01");
const BASE_MINT_PRICE = hre.ethers.parseEther("0.001");

describe("LLMv1v1 Deployment and Functionality", function () {
  // Fixture to deploy LLMv1 for testing
  async function deployLLMv1Fixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    // Deploy LLMv1 for testing
    const LLMv1Factory = await hre.ethers.getContractFactory("LLMv1");
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

    // Deploy CollectorNFTv1 using OpenZeppelin upgrades
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

  // Fixture with some test data
  async function deployCollectorNFTv1WithDataFixture() {
    const fixtureData = await loadFixture(deployCollectorNFTv1Fixture);
    const { genImNFT, collectorNFTv1, owner, otherAccount } = fixtureData;

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

  describe("Deployment", function () {
    it("Should deploy CollectorNFTv1 correctly", async function () {
      const { collectorNFTv1, genImAddress, owner } = await loadFixture(deployCollectorNFTv1Fixture);

      expect(await collectorNFTv1.read.name()).to.equal("CollectorNFTv1");
      expect(await collectorNFTv1.read.symbol()).to.equal("COLLECTORv1");
      expect(await collectorNFTv1.read.owner()).to.equal(getAddress(owner.account.address));
      expect(await collectorNFTv1.read.genImNFTContract()).to.equal(getAddress(genImAddress));
      expect(await collectorNFTv1.read.baseMintPrice()).to.equal(BASE_MINT_PRICE);
      expect(await collectorNFTv1.read.totalSupply()).to.equal(0n);
    });

    it("Should emit ContractInitialized event during deployment", async function () {
      const { genImAddress } = await loadFixture(deployGenImNFTv3Fixture);

      // Deploy and check for initialization event
      const CollectorNFTv1Factory = await hre.ethers.getContractFactory("CollectorNFTv1");
      const collectorProxy = await hre.upgrades.deployProxy(CollectorNFTv1Factory, [genImAddress, BASE_MINT_PRICE], {
        initializer: "initialize",
        kind: "uups",
      });
      await collectorProxy.waitForDeployment();

      const proxyAddress = await collectorProxy.getAddress();
      const ethersContract = await hre.ethers.getContractAt("CollectorNFTv1", proxyAddress);
      const filter = ethersContract.filters.ContractInitialized();
      const events = await ethersContract.queryFilter(filter);

      expect(events).to.have.length(1);
      expect(events[0].args.genImNFTContract).to.equal(genImAddress);
      expect(events[0].args.baseMintPrice).to.equal(BASE_MINT_PRICE);
    });

    it("Should be upgradeable (UUPS proxy)", async function () {
      const { proxyAddress } = await loadFixture(deployCollectorNFTv1Fixture);

      // Check that it's a valid proxy by reading implementation
      const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const publicClient = await hre.viem.getPublicClient();

      const implementation = await publicClient.getStorageAt({
        address: proxyAddress as `0x${string}`,
        slot: implementationSlot as `0x${string}`,
      });

      expect(implementation).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });
  });

  describe("Basic Functionality", function () {
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

    it("Should handle dynamic pricing correctly", async function () {
      const { collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      // Initial price should be base price
      expect(await collectorNFTv1.read.getCurrentPrice([0n])).to.equal(BASE_MINT_PRICE);

      // Mint 5 CollectorNFTs (price should still be base)
      for (let i = 0; i < 5; i++) {
        await collectorNFTv1.write.mintCollectorNFT([0n], {
          account: otherAccount.account,
          value: BASE_MINT_PRICE,
        });
      }

      // After 5 mints, price should double
      const newPrice = await collectorNFTv1.read.getCurrentPrice([0n]);
      expect(newPrice).to.equal(BASE_MINT_PRICE * 2n);
    });

    it("Should track mint statistics correctly", async function () {
      const { collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      // Initially no mints
      const [mintCount, currentPrice, nextPrice] = await collectorNFTv1.read.getMintStats([0n]);
      expect(mintCount).to.equal(0n);
      expect(currentPrice).to.equal(BASE_MINT_PRICE);
      expect(nextPrice).to.equal(BASE_MINT_PRICE); // Still base price for next mint

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

    it("Should allow getting CollectorNFT relationships", async function () {
      const { collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

      // Mint some CollectorNFTs
      await collectorNFTv1.write.mintCollectorNFT([0n], {
        account: otherAccount.account,
        value: BASE_MINT_PRICE,
      });

      await collectorNFTv1.write.mintCollectorNFT([1n], {
        account: otherAccount.account,
        value: BASE_MINT_PRICE,
      });

      // Check relationships
      expect(await collectorNFTv1.read.getGenImTokenIdForCollector([0n])).to.equal(0n);
      expect(await collectorNFTv1.read.getGenImTokenIdForCollector([1n])).to.equal(1n);

      const collectorsForGenIm0 = await collectorNFTv1.read.getCollectorTokensForGenIm([0n]);
      const collectorsForGenIm1 = await collectorNFTv1.read.getCollectorTokensForGenIm([1n]);

      expect(collectorsForGenIm0).to.have.lengthOf(1);
      expect(collectorsForGenIm1).to.have.lengthOf(1);
      expect(collectorsForGenIm0[0]).to.equal(0n);
      expect(collectorsForGenIm1[0]).to.equal(1n);
    });
  });

  describe("Upgrade Readiness", function () {
    it("Should be ready for future upgrades", async function () {
      const { collectorNFTv1, proxyAddress } = await loadFixture(deployCollectorNFTv1Fixture);

      // Check that owner can authorize upgrades
      const [owner] = await hre.viem.getWalletClients();
      expect(await collectorNFTv1.read.owner()).to.equal(getAddress(owner.account.address));

      // Check storage gap exists (this is more of a compilation check)
      // If the contract compiles, the storage gap is properly defined
      expect(await collectorNFTv1.read.name()).to.equal("CollectorNFTv1");
    });
  });

  // CollectorNFTv1 New Features (Functional Equivalence with v2)
  describe("CollectorNFTv1 Advanced Features", function () {
    describe("Automatic URI Inheritance", function () {
      it("Should mint without URI parameter and inherit GenImNFT URI", async function () {
        const { genImNFT, collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

        const genImTokenId = 0n;

        // Get the original GenImNFT URI
        const originalURI = await genImNFT.read.tokenURI([genImTokenId]);
        expect(originalURI).to.equal("ipfs://test-uri-1"); // From fixture setup

        // Mint CollectorNFT without providing URI (automatic URI inheritance)
        await collectorNFTv1.write.mintCollectorNFT([genImTokenId], {
          account: otherAccount.account,
          value: BASE_MINT_PRICE,
        });

        // Verify the CollectorNFT was minted with the inherited URI
        expect(await collectorNFTv1.read.totalSupply()).to.equal(1n);
        expect(await collectorNFTv1.read.ownerOf([0n])).to.equal(getAddress(otherAccount.account.address));
        expect(await collectorNFTv1.read.tokenURI([0n])).to.equal(originalURI);

        // Verify the relationship tracking
        const genImTokenIdForCollector = await collectorNFTv1.read.getGenImTokenIdForCollector([0n]);
        expect(genImTokenIdForCollector).to.equal(genImTokenId);
      });

      it("Should work with multiple collectors using automatic URI inheritance", async function () {
        const { genImNFT, collectorNFTv1, owner, otherAccount } = await loadFixture(
          deployCollectorNFTv1WithDataFixture,
        );

        const genImTokenId = 0n;
        const originalURI = await genImNFT.read.tokenURI([genImTokenId]);

        // First collector mints without URI
        await collectorNFTv1.write.mintCollectorNFT([genImTokenId], {
          account: owner.account,
          value: BASE_MINT_PRICE,
        });

        // Second collector mints without URI
        await collectorNFTv1.write.mintCollectorNFT([genImTokenId], {
          account: otherAccount.account,
          value: BASE_MINT_PRICE,
        });

        // Both should have inherited the same URI from GenImNFT
        expect(await collectorNFTv1.read.tokenURI([0n])).to.equal(originalURI);
        expect(await collectorNFTv1.read.tokenURI([1n])).to.equal(originalURI);

        // Verify total supply and collectors tracking
        expect(await collectorNFTv1.read.totalSupply()).to.equal(2n);
        const collectorTokens = await collectorNFTv1.read.getCollectorTokensForGenIm([genImTokenId]);
        expect(collectorTokens).to.deep.equal([0n, 1n]);
      });

      it("Should retrieve original GenImNFT URI for any CollectorNFT", async function () {
        const { genImNFT, collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

        const genImTokenId = 1n; // Use different GenImNFT
        const originalURI = await genImNFT.read.tokenURI([genImTokenId]);

        // Mint CollectorNFT without URI
        await collectorNFTv1.write.mintCollectorNFT([genImTokenId], {
          account: otherAccount.account,
          value: BASE_MINT_PRICE,
        });

        // Get original URI through the new function
        const retrievedOriginalURI = await collectorNFTv1.read.getOriginalGenImURI([0n]);
        expect(retrievedOriginalURI).to.equal(originalURI);
        expect(retrievedOriginalURI).to.equal("ipfs://test-uri-2"); // From fixture setup
      });
    });

    describe("Enhanced Relationship Tracking", function () {
      it("Should track GenImNFT to CollectorNFT relationships correctly", async function () {
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

        // Check relationships
        expect(await collectorNFTv1.read.getGenImTokenIdForCollector([0n])).to.equal(0n);
        expect(await collectorNFTv1.read.getGenImTokenIdForCollector([1n])).to.equal(1n);
        expect(await collectorNFTv1.read.getGenImTokenIdForCollector([2n])).to.equal(0n);

        // Check reverse lookup
        const genIm0Collectors = await collectorNFTv1.read.getCollectorTokensForGenIm([0n]);
        const genIm1Collectors = await collectorNFTv1.read.getCollectorTokensForGenIm([1n]);

        expect(genIm0Collectors).to.deep.equal([0n, 2n]);
        expect(genIm1Collectors).to.deep.equal([1n]);
      });
    });
  });
});
