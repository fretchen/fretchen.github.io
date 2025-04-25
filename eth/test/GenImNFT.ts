import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress } from "viem"; // getAddress für Address-Normalisierung importieren
import * as fs from "fs";
import * as path from "path";

// Definiere den Pfad für die Metadaten-Dateien
const METADATA_DIR = path.join(__dirname, "../metadata");

// Definiere ein Array, um alle erstellten Dateipfade zu verfolgen
const createdFiles: string[] = [];

/**
 * Hilfsfunktion zum Erstellen der Metadaten-Datei
 * @param tokenId Die ID des Tokens
 * @param prompt Der Prompt-Text für die Bild-Generierung
 * @returns Den Pfad zur erstellten Metadaten-Datei
 */
function createMetadataFile(tokenId: number | bigint, prompt: string): string {
  // Stelle sicher, dass das Verzeichnis existiert
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }
  
  // Erstelle die Metadaten
  const metadata = {
    name: `GenImNFT #${tokenId}`,
    description: prompt,
    image: "" // Leerer Image-Link, würde später gefüllt
  };
  
  // Speichere die Metadaten in einer Datei
  const fileName = `token_${tokenId}.json`;
  const filePath = path.join(METADATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
  
  // Datei zur Liste der zu löschenden Dateien hinzufügen
  createdFiles.push(filePath);
  
  // In einem echten Szenario würdest du eine URL zurückgeben
  // Für Tests können wir den lokalen Pfad oder einen relativen Pfad verwenden
  return `file://${filePath}`;
}

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
      
      // read the owner address from the contract
      const ownerAddress = await genImNFTPublic.read.owner();
      // Normalisiere beide Adressen mit getAddress
      expect(getAddress(ownerAddress)).to.equal(getAddress(owner.account.address));
    });

    it("Should have the correct name and symbol", async function () {
      const { genImNFTPublic } = await loadFixture(deployGenImNFTFixture);
      expect(await genImNFTPublic.read.name()).to.equal("GenImNFT");
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
      const ownerOfToken = await genImNFT.read.ownerOf([0n]);
      expect(getAddress(ownerOfToken)).to.equal(getAddress(recipient.account.address));
      
      // Check that the token URI is set correctly
      expect(await genImNFT.read.tokenURI([0n])).to.equal(tokenURI);
    });

    it("Should increment token ID after each mint", async function () {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTFixture);
      
      await genImNFT.write.safeMint([recipient.account.address, "uri1"]);
      await genImNFT.write.safeMint([recipient.account.address, "uri2"]);
      
      // First token ID should be 0
      const ownerOfToken0 = await genImNFT.read.ownerOf([0n]);
      expect(getAddress(ownerOfToken0)).to.equal(getAddress(recipient.account.address));
      
      // Second token ID should be 1
      const ownerOfToken1 = await genImNFT.read.ownerOf([1n]);
      expect(getAddress(ownerOfToken1)).to.equal(getAddress(recipient.account.address));
    });

    it("Should return the token ID when minting", async function () {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTFixture);
      
      // This requires capturing the return value from the transaction
      // In Viem we need to simulate the call to get the return value
      const tokenIdResponse = await genImNFT.simulate.safeMint([
        recipient.account.address, 
        "https://example.com/metadata/1.json"
      ]);
            
      expect(tokenIdResponse.result).to.equal(0n);
      
      // Actually execute the mint
      await genImNFT.write.safeMint([recipient.account.address, "https://example.com/metadata/1.json"]);
      
      // Simulate the next mint to check incrementing
      const nextTokenIdResponse = await genImNFT.simulate.safeMint([
        recipient.account.address, 
        "https://example.com/metadata/2.json"
      ]);
      
      expect(nextTokenIdResponse.result).to.equal(1n);
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

  describe("Metadata Storage", function() {
    it("Should create and use local metadata files", async function() {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTFixture);
      
      // Erstelle eine Metadaten-Datei
      const prompt = "A futuristic city skyline at night with neon lights";
      const tokenURI = createMetadataFile(0, prompt);
      
      console.log("Created metadata at:", tokenURI);
      
      // Mint NFT mit dem lokalen URI
      await genImNFT.write.safeMint([recipient.account.address, tokenURI]);
      
      // Überprüfe, dass der Token URI richtig gesetzt wurde
      const storedURI = await genImNFT.read.tokenURI([0n]);
      expect(storedURI).to.equal(tokenURI);
      
      // Überprüfe, dass die Datei existiert
      expect(fs.existsSync(tokenURI.replace("file://", ""))).to.be.true;
      
      // Optional: Lese die Datei und überprüfe den Inhalt
      const fileContent = JSON.parse(fs.readFileSync(tokenURI.replace("file://", ""), 'utf8'));
      expect(fileContent.description).to.equal(prompt);
    });
    
    it("Should mint multiple NFTs with different metadata files", async function() {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTFixture);
      
      // Erstelle mehrere Metadaten-Dateien
      const prompts = [
        "A serene mountain landscape at sunset",
        "An abstract digital artwork with geometric patterns"
      ];
      
      // Mint mehrere NFTs mit verschiedenen Metadaten
      for (let i = 0; i < prompts.length; i++) {
        const tokenURI = createMetadataFile(i, prompts[i]);
        await genImNFT.write.safeMint([recipient.account.address, tokenURI]);
      }
      
      // Überprüfe, dass alle URIs richtig gesetzt wurden
      for (let i = 0; i < prompts.length; i++) {
        const storedURI = await genImNFT.read.tokenURI([BigInt(i)]);
        expect(storedURI).to.include(`token_${i}.json`);
        
        // Lese die Datei und überprüfe den Inhalt
        const fileContent = JSON.parse(fs.readFileSync(storedURI.replace("file://", ""), 'utf8'));
        expect(fileContent.description).to.equal(prompts[i]);
      }
    });
  });

  // Aufräumen nach jedem Test
  afterEach(function() {
    // Lösche alle erstellten Dateien
    for (const file of createdFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Deleted test file: ${file}`);
      }
    }
    
    // Lösche den Ordner, wenn er leer ist
    if (fs.existsSync(METADATA_DIR) && fs.readdirSync(METADATA_DIR).length === 0) {
      fs.rmdirSync(METADATA_DIR);
      console.log(`Removed empty directory: ${METADATA_DIR}`);
    }
    
    // Leere die Liste der erstellten Dateien
    createdFiles.length = 0;
  });
});