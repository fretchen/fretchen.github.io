import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { formatEther, getAddress } from "viem";
import * as fs from "fs";
import * as path from "path";

// Import shared test utilities
import { 
  createBasicNFTTests, 
  createImageUpdateTests, 
  createMetadataFile, 
  getAllNFTsForWallet,
  cleanupTestFiles,
  ContractFixture
} from "./shared/GenImNFTSharedTests";

describe("GenImNFTv2", function () {
  // We define a fixture to reuse the same contract instance in every test
  async function deployGenImNFTv2Fixture(): Promise<ContractFixture> {
    // Get accounts
    const [owner, otherAccount, recipient] = await hre.viem.getWalletClients();

    // Deploy the contract (ohne initialize aufzurufen)
    const genImNFT = await hre.viem.deployContract("GenImNFTv2", []);

    // Manuelle Initialisierung nach dem Deployment
    await genImNFT.write.initialize();

    const genImNFTPublic = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address);

    return {
      contract: genImNFT,
      genImNFTPublic,
      owner,
      otherAccount,
      recipient,
    };
  }

  describe("Deployment", function () {
    it("Should not allow re-initialization", async function () {
      const { contract } = await loadFixture(deployGenImNFTv2Fixture);

      // Versuche, initialize() erneut aufzurufen
      await expect(contract.write.initialize()).to.be.rejected; // Sollte mit einem "bereits initialisiert"-Fehler fehlschlagen
    });

    it("Should have the correct name and symbol for v2", async function () {
      const { contract } = await loadFixture(deployGenImNFTv2Fixture);
      expect(await contract.read.name()).to.equal("GenImNFTv2");
      expect(await contract.read.symbol()).to.equal("GENIMGv2");
    });
  });

  // Use shared basic NFT tests
  describe("Basic NFT Functionality", createBasicNFTTests(deployGenImNFTv2Fixture, "GenImNFTv2"));

  // Use shared image update tests
  describe("Image Updates", createImageUpdateTests(deployGenImNFTv2Fixture, "GenImNFTv2"));

  describe("Advanced Image Updates (V2 specific)", function () {
    it("Should allow another wallet to update the image for a token", async function () {
      const { contract, owner, recipient, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);
      const provider = await hre.viem.getPublicClient();

      // 1. Erstelle ein NFT mit leerem Bild und übertrage es dann an recipient
      const prompt = "A cyberpunk city with flying cars in the rain";
      const tokenURI = createMetadataFile(7, prompt);
      const mintPrice = await contract.read.mintPrice();
      console.log("Mint price:", formatEther(mintPrice), "ETH");
      await contract.write.safeMint([tokenURI], {
        value: mintPrice,
      });

      // NFT an recipient übertragen
      await contract.write.transferFrom([owner.account.address, recipient.account.address, 0n]);

      // 2. Token-Besitzer autorisiert eine andere Wallet als Bild-Updater
      const recipientClient = await hre.viem.getContractAt("GenImNFTv2", contract.address, {
        client: { wallet: recipient },
      });

      // 3. Erfasse den Kontostand des Updaters VOR dem Update
      const updaterBalanceBefore = await provider.getBalance({
        address: otherAccount.account.address,
      });
      console.log(`Updater balance before: ${formatEther(updaterBalanceBefore)} ETH`);

      // 4. Die autorisierte Wallet fordert ein Bild-Update an
      const updaterClient = await hre.viem.getContractAt("GenImNFTv2", contract.address, {
        client: { wallet: otherAccount },
      });

      const imageUrl = "https://example.com/generated-image-12345.png";
      const tx = await updaterClient.write.requestImageUpdate([0n, imageUrl]);

      // 5. Erfasse den Kontostand des Updaters NACH dem Update
      const updaterBalanceAfter = await provider.getBalance({
        address: otherAccount.account.address,
      });
      console.log(`Updater balance after: ${formatEther(updaterBalanceAfter)} ETH`);

      // 6. Überprüfe, dass das Bild als aktualisiert markiert wurde
      const isImageUpdated = await contract.read.isImageUpdated([0n]);
      expect(isImageUpdated).to.be.true;

      // Der Kontostand sollte höher sein als vorher abzüglich der Gaskosten
      expect(Number(updaterBalanceAfter)).to.be.gt(Number(updaterBalanceBefore));

      // 8. Simuliere einen Off-Chain-Service, der das Event abfängt und die Metadaten aktualisiert
      const filePath = tokenURI.replace("file://", "");
      const metadata = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Aktualisiere das Bild in den Metadaten
      metadata.image = imageUrl;
      fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));

      // 9. Überprüfe, dass das Bild in den Metadaten aktualisiert wurde
      const updatedMetadata = JSON.parse(fs.readFileSync(filePath, "utf8"));
      expect(updatedMetadata.image).to.equal(imageUrl);

      console.log("Image updated successfully in metadata:", updatedMetadata);
    });
  });

  describe("Token Transfers and Burns", function () {
    it("Should update enumeration after token transfer", async function () {
      const { contract, owner, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await contract.read.mintPrice();

      // Mint token to owner
      await contract.write.safeMint(["uri1"], { value: mintPrice });
      await contract.write.safeMint(["uri2"], { value: mintPrice });

      // Initially owner has 2 tokens
      expect(await contract.read.balanceOf([owner.account.address])).to.equal(2n);
      expect(await contract.read.balanceOf([otherAccount.account.address])).to.equal(0n);

      // Transfer one token
      await contract.write.transferFrom([owner.account.address, otherAccount.account.address, 0n]);

      // Check updated balances
      expect(await contract.read.balanceOf([owner.account.address])).to.equal(1n);
      expect(await contract.read.balanceOf([otherAccount.account.address])).to.equal(1n);

      // Check owner still has token 1
      const ownerToken = await contract.read.tokenOfOwnerByIndex([owner.account.address, 0n]);
      expect(ownerToken).to.equal(1n);

      // Check otherAccount now has token 0
      const otherToken = await contract.read.tokenOfOwnerByIndex([otherAccount.account.address, 0n]);
      expect(otherToken).to.equal(0n);
    });

    it("Should update enumeration after token burn", async function () {
      const { contract, owner } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await contract.read.mintPrice();

      // Mint 3 tokens
      await contract.write.safeMint(["uri1"], { value: mintPrice });
      await contract.write.safeMint(["uri2"], { value: mintPrice });
      await contract.write.safeMint(["uri3"], { value: mintPrice });

      // Check initial state
      expect(await contract.read.totalSupply()).to.equal(3n);
      expect(await contract.read.balanceOf([owner.account.address])).to.equal(3n);

      // Burn middle token
      await contract.write.burn([1n]);

      // Check updated state
      expect(await contract.read.totalSupply()).to.equal(2n);
      expect(await contract.read.balanceOf([owner.account.address])).to.equal(2n);

      // Check remaining tokens are still accessible
      const token0 = await contract.read.tokenOfOwnerByIndex([owner.account.address, 0n]);
      const token1 = await contract.read.tokenOfOwnerByIndex([owner.account.address, 1n]);
      
      // Should be tokens 0 and 2 (since token 1 was burned)
      expect([Number(token0), Number(token1)].sort()).to.deep.equal([0, 2]);
    });
  });

  describe("Wallet NFT Enumeration Helper", function () {
    it("Should get all NFTs with metadata for a wallet", async function () {
      const { contract, owner, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await contract.read.mintPrice();

      // Mint tokens with metadata
      const prompts = [
        "A beautiful sunset over mountains",
        "A futuristic city at night",
        "An abstract digital artwork"
      ];

      for (let i = 0; i < prompts.length; i++) {
        const tokenURI = createMetadataFile(i, prompts[i]);
        if (i === 1) {
          // Mint one token to otherAccount
          const otherClient = await hre.viem.getContractAt("GenImNFTv2", contract.address, {
            client: { wallet: otherAccount },
          });
          await otherClient.write.safeMint([tokenURI], { value: mintPrice });
        } else {
          await contract.write.safeMint([tokenURI], { value: mintPrice });
        }
      }

      // Get all NFTs for owner
      const ownerNFTs = await getAllNFTsForWallet(contract, owner.account.address);
      expect(ownerNFTs).to.have.length(2);
      expect(ownerNFTs[0].tokenId).to.equal(0);
      expect(ownerNFTs[1].tokenId).to.equal(2);

      // Get all NFTs for otherAccount
      const otherNFTs = await getAllNFTsForWallet(contract, otherAccount.account.address);
      expect(otherNFTs).to.have.length(1);
      expect(otherNFTs[0].tokenId).to.equal(1);
      expect(otherNFTs[0].tokenURI).to.include("token_1.json");
    });
  });

  // Aufräumen nach jedem Test
  afterEach(function () {
    cleanupTestFiles();
  });
});
