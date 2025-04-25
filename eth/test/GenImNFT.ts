import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress } from "viem";
import { GenImNFT__factory } from "../typechain-types";

describe("GenImNFT", function () {
  // We define a fixture to reuse the same contract instance in every test
  async function deployGenImNFTFixture() {
    // Get accounts
    const [owner, otherAccount, recipient] = await hre.viem.getWalletClients();

    // Deploy the contract
    const genImNFT = await hre.viem.deployContract("GenImNFT", [owner.account.address]);
    const genImNFTPublic = await hre.viem.getContractAt("GenImNFT", genImNFT.address);
    
    return { 
      genImNFT, 
      genImNFTPublic,
      owner, 
      otherAccount, 
      recipient 
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { genImNFTPublic, owner } = await loadFixture(deployGenImNFTFixture);
      expect(await genImNFTPublic.read.owner()).to.equal(owner.account.address);
    });

    it("Should have the correct name and symbol", async function () {
      const { genImNFTPublic } = await loadFixture(deployGenImNFTFixture);
      expect(await genImNFTPublic.read.name()).to.equal("GeneratedImageNFT");
      expect(await genImNFTPublic.read.symbol()).to.equal("GENIMG");
    });
  });

  describe("Minting", function () {
    it("Should allow the owner to mint a new NFT", async function () {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTFixture);
      
      const tokenURI = "https://example.com/metadata/1.json";
      
      const tx = await genImNFT.write.safeMint([recipient.account.address, tokenURI]);
      await tx;
      
      // Check that the NFT was minted to the correct address
      expect(await genImNFT.read.ownerOf([0n])).to.equal(recipient.account.address);
      
      // Check that the token URI is set correctly
      expect(await genImNFT.read.tokenURI([0n])).to.equal(tokenURI);
    });

    it("Should increment token ID after each mint", async function () {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTFixture);
      
      await genImNFT.write.safeMint([recipient.account.address, "uri1"]);
      await genImNFT.write.safeMint([recipient.account.address, "uri2"]);
      
      // First token ID should be 0
      expect(await genImNFT.read.ownerOf([0n])).to.equal(recipient.account.address);
      
      // Second token ID should be 1
      expect(await genImNFT.read.ownerOf([1n])).to.equal(recipient.account.address);
    });

    it("Should return the token ID when minting", async function () {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTFixture);
      
      // This requires capturing the return value from the transaction
      // In Viem we need to simulate the call to get the return value
      const tokenId = await genImNFT.simulate.safeMint([
        recipient.account.address, 
        "https://example.com/metadata/1.json"
      ]);
      
      expect(tokenId).to.equal(0n);
      
      // Actually execute the mint
      await genImNFT.write.safeMint([recipient.account.address, "https://example.com/metadata/1.json"]);
      
      // Simulate the next mint to check incrementing
      const nextTokenId = await genImNFT.simulate.safeMint([
        recipient.account.address, 
        "https://example.com/metadata/2.json"
      ]);
      
      expect(nextTokenId).to.equal(1n);
    });

    it("Should prevent non-owners from minting", async function () {
      const { genImNFT, otherAccount, recipient } = await loadFixture(deployGenImNFTFixture);
      
      // Connect as non-owner account
      const connectedContract = await hre.viem.getContractAt(
        "GenImNFT", 
        genImNFT.address, 
        { walletClient: otherAccount }
      );
      
      // Should revert with an "OwnableUnauthorizedAccount" error
      await expect(connectedContract.write.safeMint([
        recipient.account.address, 
        "https://example.com/metadata/1.json"
      ])).to.be.rejectedWith(/OwnableUnauthorizedAccount/);
    });
  });

  describe("Token URI", function () {
    it("Should return the correct token URI", async function () {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTFixture);
      
      const tokenURI = "https://example.com/metadata/special.json";
      await genImNFT.write.safeMint([recipient.account.address, tokenURI]);
      
      expect(await genImNFT.read.tokenURI([0n])).to.equal(tokenURI);
    });

    it("Should revert when querying non-existent token", async function () {
      const { genImNFT } = await loadFixture(deployGenImNFTFixture);
      
      // Should revert with an ERC721 error about nonexistent token
      await expect(genImNFT.read.tokenURI([999n])).to.be.rejected;
    });
  });
});