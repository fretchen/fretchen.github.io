import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress } from "viem";

describe("GenImNFTv2 Upgrade Functionality", function () {
  
  async function deployProxyFixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    // Deploy implementation
    const implementation = await hre.viem.deployContract("GenImNFTv2", []);
    
    // Create initialize call data
    const initializeData = "0x8129fc1c"; // initialize() function selector
    
    // Deploy proxy
    const proxy = await hre.viem.deployContract("ERC1967Proxy", [
      implementation.address,
      initializeData
    ]);

    // Get contract instance through proxy
    const proxyContract = await hre.viem.getContractAt("GenImNFTv2", proxy.address);
    
    return {
      implementation,
      proxy,
      proxyContract,
      owner,
      otherAccount,
    };
  }

  describe("UUPS Upgrade Pattern", function () {
    it("Should be able to upgrade the implementation", async function () {
      const { proxyContract, owner } = await loadFixture(deployProxyFixture);

      // Verify initial state
      expect(await proxyContract.read.name()).to.equal("GenImNFTv2");
      expect(await proxyContract.read.symbol()).to.equal("GENIMGv2");
      
      // Deploy new implementation
      const newImplementation = await hre.viem.deployContract("GenImNFTv2", []);

      // Upgrade to new implementation
      await proxyContract.write.upgradeToAndCall([newImplementation.address, "0x"]);

      // Verify contract still works and state is preserved
      expect(await proxyContract.read.name()).to.equal("GenImNFTv2");
      expect(await proxyContract.read.symbol()).to.equal("GENIMGv2");
      expect(await proxyContract.read.mintPrice()).to.equal(10000000000000000n); // 0.01 ETH
    });

    it("Should preserve state across upgrades", async function () {
      const { proxyContract, owner } = await loadFixture(deployProxyFixture);

      // Mint some tokens
      const mintPrice = await proxyContract.read.mintPrice();
      await proxyContract.write.safeMint(["test-uri-1"], { value: mintPrice });
      await proxyContract.write.safeMint(["test-uri-2"], { value: mintPrice });

      // Verify initial state
      expect(await proxyContract.read.totalSupply()).to.equal(2n);
      expect(await proxyContract.read.ownerOf([0n])).to.equal(getAddress(owner.account.address));

      // Deploy new implementation
      const newImplementation = await hre.viem.deployContract("GenImNFTv2", []);

      // Upgrade
      await proxyContract.write.upgradeToAndCall([newImplementation.address, "0x"]);

      // Verify state is preserved
      expect(await proxyContract.read.totalSupply()).to.equal(2n);
      expect(await proxyContract.read.ownerOf([0n])).to.equal(getAddress(owner.account.address));
      expect(await proxyContract.read.tokenURI([0n])).to.equal("test-uri-1");
    });

    it("Should preserve mappings across upgrades", async function () {
      const { proxyContract, owner, otherAccount } = await loadFixture(deployProxyFixture);

      // Mint a token and update its image
      const mintPrice = await proxyContract.read.mintPrice();
      await proxyContract.write.safeMint(["test-uri"], { value: mintPrice });

      // Update image
      const otherClient = await hre.viem.getContractAt("GenImNFTv2", proxyContract.address, {
        client: { wallet: otherAccount },
      });
      await otherClient.write.requestImageUpdate([0n, "https://example.com/updated.png"]);

      // Verify image is marked as updated
      expect(await proxyContract.read.isImageUpdated([0n])).to.be.true;

      // Deploy new implementation and upgrade
      const newImplementation = await hre.viem.deployContract("GenImNFTv2", []);
      await proxyContract.write.upgradeToAndCall([newImplementation.address, "0x"]);

      // Verify mappings are preserved
      expect(await proxyContract.read.isImageUpdated([0n])).to.be.true;
      expect(await proxyContract.read.tokenURI([0n])).to.equal("https://example.com/updated.png");
    });

    it("Should only allow owner to upgrade", async function () {
      const { proxyContract, otherAccount } = await loadFixture(deployProxyFixture);

      // Deploy new implementation
      const newImplementation = await hre.viem.deployContract("GenImNFTv2", []);

      // Try to upgrade as non-owner
      const otherClient = await hre.viem.getContractAt("GenImNFTv2", proxyContract.address, {
        client: { wallet: otherAccount },
      });

      // Should fail
      await expect(
        otherClient.write.upgradeToAndCall([newImplementation.address, "0x"])
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should support simple upgrade without initialization", async function () {
      const { proxyContract, owner } = await loadFixture(deployProxyFixture);

      // Verify initial mint price
      expect(await proxyContract.read.mintPrice()).to.equal(10000000000000000n); // 0.01 ETH

      // Deploy new implementation
      const newImplementation = await hre.viem.deployContract("GenImNFTv2", []);

      // Upgrade without initialization call
      await proxyContract.write.upgradeToAndCall([newImplementation.address, "0x"]);

      // Verify mint price is unchanged
      expect(await proxyContract.read.mintPrice()).to.equal(10000000000000000n);
    });

    it("Should maintain upgrade functionality after upgrade", async function () {
      const { proxyContract } = await loadFixture(deployProxyFixture);

      // First upgrade
      const newImplementation1 = await hre.viem.deployContract("GenImNFTv2", []);
      await proxyContract.write.upgradeToAndCall([newImplementation1.address, "0x"]);

      // Verify contract still works
      expect(await proxyContract.read.name()).to.equal("GenImNFTv2");

      // Second upgrade
      const newImplementation2 = await hre.viem.deployContract("GenImNFTv2", []);
      await proxyContract.write.upgradeToAndCall([newImplementation2.address, "0x"]);

      // Verify contract still works
      expect(await proxyContract.read.name()).to.equal("GenImNFTv2");
    });
  });

  describe("Upgrade Safety", function () {
    it("Should reject upgrade to zero address", async function () {
      const { proxyContract } = await loadFixture(deployProxyFixture);

      // Try to upgrade to zero address
      await expect(
        proxyContract.write.upgradeToAndCall(["0x0000000000000000000000000000000000000000", "0x"])
      ).to.be.rejected;
    });

    it("Should maintain owner across upgrades", async function () {
      const { proxyContract, owner } = await loadFixture(deployProxyFixture);

      // Verify initial owner
      const initialOwner = await proxyContract.read.owner();
      expect(getAddress(initialOwner)).to.equal(getAddress(owner.account.address));

      // Upgrade
      const newImplementation = await hre.viem.deployContract("GenImNFTv2", []);
      await proxyContract.write.upgradeToAndCall([newImplementation.address, "0x"]);

      // Verify owner is preserved
      const afterUpgradeOwner = await proxyContract.read.owner();
      expect(getAddress(afterUpgradeOwner)).to.equal(getAddress(owner.account.address));
    });

    it("Should preserve contract balance across upgrades", async function () {
      const { proxyContract, owner } = await loadFixture(deployProxyFixture);
      const publicClient = await hre.viem.getPublicClient();

      // Add some ETH to contract by minting
      const mintPrice = await proxyContract.read.mintPrice();
      await proxyContract.write.safeMint(["test"], { value: mintPrice * 2n }); // Send extra ETH

      // Check initial balance
      const initialBalance = await publicClient.getBalance({ address: proxyContract.address });
      expect(Number(initialBalance)).to.be.greaterThan(0);

      // Upgrade
      const newImplementation = await hre.viem.deployContract("GenImNFTv2", []);
      await proxyContract.write.upgradeToAndCall([newImplementation.address, "0x"]);

      // Verify balance is preserved
      const afterUpgradeBalance = await publicClient.getBalance({ address: proxyContract.address });
      expect(afterUpgradeBalance.toString()).to.equal(initialBalance.toString());
    });
  });
});
