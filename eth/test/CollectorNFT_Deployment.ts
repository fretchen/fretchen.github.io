/**
 * CollectorNFT Deployment Tests
 *
 * Minimal tests for CollectorNFT deployment using OpenZeppelin Upgrades Plugin.
 */

import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { deployCollectorNFT } from "../scripts/deploy-collector-nft";

describe("CollectorNFT - Deployment Tests", function () {
  const BASE_MINT_PRICE = ethers.parseEther("0.001");

  async function deployGenImNFTFixture() {
    const [owner, collector] = await ethers.getSigners();

    const GenImNFTFactory = await ethers.getContractFactory("GenImNFTv3");
    const genImNFT = await GenImNFTFactory.deploy();
    await genImNFT.waitForDeployment();

    const genImNFTAddress = await genImNFT.getAddress();

    // Mint a test token
    const mintPrice = await genImNFT.mintPrice();
    await genImNFT.safeMint("ipfs://test-genIm", true, { value: mintPrice });

    return {
      genImNFT,
      genImNFTAddress,
      owner,
      collector,
    };
  }

  async function deployCollectorNFTFixture() {
    const { genImNFT, genImNFTAddress, owner, collector } = await loadFixture(deployGenImNFTFixture);

    const CollectorNFTFactory = await ethers.getContractFactory("CollectorNFT");

    const collectorNFTProxy = await upgrades.deployProxy(CollectorNFTFactory, [genImNFTAddress, BASE_MINT_PRICE], {
      kind: "uups",
      initializer: "initialize",
    });

    await collectorNFTProxy.waitForDeployment();
    const proxyAddress = await collectorNFTProxy.getAddress();

    return {
      genImNFT,
      genImNFTAddress,
      collectorNFT: collectorNFTProxy,
      proxyAddress,
      owner,
      collector,
    };
  }

  describe("Basic Deployment", function () {
    it("Should deploy CollectorNFT proxy correctly", async function () {
      const { collectorNFT, genImNFTAddress, owner, proxyAddress } = await loadFixture(deployCollectorNFTFixture);

      // Basic contract properties
      expect(await collectorNFT.name()).to.equal("CollectorNFT");
      expect(await collectorNFT.symbol()).to.equal("COLLECTOR");
      expect(await collectorNFT.owner()).to.equal(owner.address);

      // Configuration
      expect(await collectorNFT.genImNFTContract()).to.equal(genImNFTAddress);
      expect(await collectorNFT.baseMintPrice()).to.equal(BASE_MINT_PRICE);

      // Proxy setup
      const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
      expect(implementationAddress).to.not.equal(proxyAddress);
    });

    it("Should initialize correctly", async function () {
      const { collectorNFT, genImNFTAddress } = await loadFixture(deployCollectorNFTFixture);

      expect(await collectorNFT.name()).to.equal("CollectorNFT");
      expect(await collectorNFT.symbol()).to.equal("COLLECTOR");
      expect(await collectorNFT.genImNFTContract()).to.equal(genImNFTAddress);
      expect(await collectorNFT.baseMintPrice()).to.equal(BASE_MINT_PRICE);
      expect(await collectorNFT.totalSupply()).to.equal(0n);
    });

    it("Should have correct owner", async function () {
      const { collectorNFT, owner, collector } = await loadFixture(deployCollectorNFTFixture);

      const contractOwner = await collectorNFT.owner();
      expect(contractOwner).to.equal(owner.address);
      expect(contractOwner).to.not.equal(collector.address);
    });
  });

  describe("Script Integration", function () {
    it("Should validate deployment", async function () {
      const { genImNFTAddress } = await loadFixture(deployGenImNFTFixture);

      const result = await deployCollectorNFT({
        genImNFTAddress,
        baseMintPrice: "0.001",
        validateOnly: true,
      });

      expect(result).to.be.true;
    });

    it("Should deploy via script", async function () {
      const { genImNFTAddress } = await loadFixture(deployGenImNFTFixture);

      const result = await deployCollectorNFT({
        genImNFTAddress,
        baseMintPrice: "0.001",
        validateOnly: false,
      });

      if (typeof result === "boolean") {
        throw new Error("Expected deployment result");
      }

      expect(result).to.have.property("contract");
      expect(result).to.have.property("address");
      expect(await result.contract.name()).to.equal("CollectorNFT");
    });
  });

  describe("GenImNFT Integration", function () {
    it("Should reference GenImNFT correctly", async function () {
      const { collectorNFT, genImNFT, genImNFTAddress } = await loadFixture(deployCollectorNFTFixture);

      expect(await collectorNFT.genImNFTContract()).to.equal(genImNFTAddress);
      expect(await genImNFT.totalSupply()).to.equal(1n);
    });
  });

  describe("Edge Cases", function () {
    it("Should accept zero address for GenImNFT during deployment", async function () {
      const CollectorNFTFactory = await ethers.getContractFactory("CollectorNFT");

      // This should succeed as the contract doesn't validate the address in initialize
      const collectorNFTProxy = await upgrades.deployProxy(CollectorNFTFactory, [ethers.ZeroAddress, BASE_MINT_PRICE], {
        kind: "uups",
        initializer: "initialize",
      });

      await collectorNFTProxy.waitForDeployment();
      expect(await collectorNFTProxy.genImNFTContract()).to.equal(ethers.ZeroAddress);
    });

    it("Should accept zero mint price during deployment", async function () {
      const { genImNFTAddress } = await loadFixture(deployGenImNFTFixture);
      const CollectorNFTFactory = await ethers.getContractFactory("CollectorNFT");

      // This should succeed as the contract doesn't validate the price in initialize
      const collectorNFTProxy = await upgrades.deployProxy(CollectorNFTFactory, [genImNFTAddress, 0n], {
        kind: "uups",
        initializer: "initialize",
      });

      await collectorNFTProxy.waitForDeployment();
      expect(await collectorNFTProxy.baseMintPrice()).to.equal(0n);
    });
  });
});
