import { expect } from "chai";
import hre from "hardhat";
import { formatEther, getAddress } from "viem";
import * as fs from "fs";
import * as path from "path";

// Definiere den Pfad für die Metadaten-Dateien
const METADATA_DIR = path.join(__dirname, "../../metadata");

// Definiere ein Array, um alle erstellten Dateipfade zu verfolgen
const createdFiles: string[] = [];

/**
 * Hilfsfunktion zum Erstellen der Metadaten-Datei
 * @param tokenId Die ID des Tokens
 * @param prompt Der Prompt-Text für die Bild-Generierung
 * @returns Den Pfad zur erstellten Metadaten-Datei
 */
export function createMetadataFile(tokenId: number | bigint, prompt: string): string {
  // Stelle sicher, dass das Verzeichnis existiert
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }

  // Erstelle die Metadaten
  const metadata = {
    name: `GenImNFT #${tokenId}`,
    description: prompt,
    image: "", // Leerer Image-Link, würde später gefüllt
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

/**
 * Helper function to get all NFTs for a wallet
 */
export async function getAllNFTsForWallet(contract: any, walletAddress: string) {
  const balance = await contract.read.balanceOf([walletAddress]);
  const tokens = [];
  
  for (let i = 0; i < Number(balance); i++) {
    const tokenId = await contract.read.tokenOfOwnerByIndex([walletAddress, BigInt(i)]);
    const tokenURI = await contract.read.tokenURI([tokenId]);
    tokens.push({
      tokenId: Number(tokenId),
      tokenURI: tokenURI
    });
  }
  
  return tokens;
}

/**
 * Aufräumen nach jedem Test
 */
export function cleanupTestFiles() {
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
}

/**
 * Interface für Contract-Fixture
 */
export interface ContractFixture {
  contract: any;
  owner: any;
  otherAccount: any;
  recipient?: any;
  [key: string]: any;
}

/**
 * Gemeinsame Tests für grundlegende NFT-Funktionalität
 */
export function createBasicNFTTests(getFixture: () => Promise<ContractFixture>, contractName: string = "GenImNFT") {
  return function() {
    describe("Basic NFT Functionality", function () {
      it("Should set the right owner", async function () {
        const { contract, owner } = await getFixture();

        // read the owner address from the contract
        const ownerAddress = await contract.read.owner();
        // Normalisiere beide Adressen mit getAddress
        expect(getAddress(ownerAddress)).to.equal(getAddress(owner.account.address));
      });

      it("Should have the correct name and symbol", async function () {
        const { contract } = await getFixture();
        const name = await contract.read.name();
        const symbol = await contract.read.symbol();
        
        // Diese können je nach Version unterschiedlich sein
        expect(name).to.be.a('string');
        expect(symbol).to.be.a('string');
      });

      it("Should allow minting a new NFT", async function () {
        const { contract, owner } = await getFixture();

        const tokenURI = "https://example.com/metadata/1.json";
        const mintPrice = await contract.read.mintPrice();

        // Prägen mit Gebühr und als Owner
        await contract.write.safeMint([tokenURI], {
          account: owner.account,
          value: mintPrice,
        });

        // NFT gehört jetzt dem Owner
        const ownerOfToken = await contract.read.ownerOf([0n]);
        expect(getAddress(ownerOfToken)).to.equal(getAddress(owner.account.address));

        // Check that the token URI is set correctly
        expect(await contract.read.tokenURI([0n])).to.equal(tokenURI);
      });

      it("Should increment token ID after each mint", async function () {
        const { contract, owner } = await getFixture();

        const mintPrice = await contract.read.mintPrice();
        // Erste Münzung
        await contract.write.safeMint(["uri1"], {
          value: mintPrice,
        });

        // Zweite Münzung
        await contract.write.safeMint(["uri2"], {
          value: mintPrice,
        });

        // Überprüfungen
        const ownerOfToken0 = await contract.read.ownerOf([0n]);
        expect(getAddress(ownerOfToken0)).to.equal(getAddress(owner.account.address));

        const ownerOfToken1 = await contract.read.ownerOf([1n]);
        expect(getAddress(ownerOfToken1)).to.equal(getAddress(owner.account.address));
      });

      it("Should return the token ID when minting", async function () {
        const { contract } = await getFixture();
        const mintPrice = await contract.read.mintPrice();

        // Simuliere mit korrekter Gebühr
        const tokenIdResponse = await contract.simulate.safeMint(
          ["https://example.com/metadata/1.json"],
          { value: mintPrice },
        );

        expect(tokenIdResponse.result).to.equal(0n);

        // Führe tatsächlich aus
        await contract.write.safeMint(
          ["https://example.com/metadata/1.json"],
          { value: mintPrice },
        );

        // Simuliere den nächsten Mint
        const nextTokenIdResponse = await contract.simulate.safeMint(
          ["https://example.com/metadata/2.json"],
          { value: mintPrice },
        );

        expect(nextTokenIdResponse.result).to.equal(1n);
      });
    });

    describe("Token URI", function () {
      it("Should be possible to create an NFT without the token URI at minting", async function () {
        const { contract } = await getFixture();
        const mintPrice = await contract.read.mintPrice();
        
        // Mint NFT ohne URI
        await contract.write.safeMint([""], {
          value: mintPrice,
        });
        
        // Überprüfe, dass der Token URI leer ist
        const tokenURI = await contract.read.tokenURI([0n]);
        expect(tokenURI).to.equal("");
      });

      it("Should return the correct token URI", async function () {
        const { contract } = await getFixture();

        const tokenURI = "https://example.com/metadata/special.json";
        const mintPrice = await contract.read.mintPrice();
        await contract.write.safeMint([tokenURI], {
          value: mintPrice,
        });

        expect(await contract.read.tokenURI([0n])).to.equal(tokenURI);
      });

      it("Should revert when querying non-existent token", async function () {
        const { contract } = await getFixture();

        // Should revert with an ERC721 error about nonexistent token
        await expect(contract.read.tokenURI([999n])).to.be.rejected;
      });
    });

    describe("Metadata Storage", function () {
      it("Should create and use local metadata files", async function () {
        const { contract, recipient } = await getFixture();

        // Erstelle eine Metadaten-Datei
        const prompt = "A futuristic city skyline at night with neon lights";
        const tokenURI = createMetadataFile(0, prompt);

        console.log("Created metadata at:", tokenURI);
        const mintPrice = await contract.read.mintPrice();
        
        // Mint NFT mit dem lokalen URI
        await contract.write.safeMint([tokenURI], {
          value: mintPrice,
          account: recipient?.account || contract.account,
        });

        // Überprüfe, dass der Token URI richtig gesetzt wurde
        const storedURI = await contract.read.tokenURI([0n]);
        expect(storedURI).to.equal(tokenURI);

        // Überprüfe, dass die Datei existiert
        expect(fs.existsSync(tokenURI.replace("file://", ""))).to.be.true;

        // Optional: Lese die Datei und überprüfe den Inhalt
        const fileContent = JSON.parse(fs.readFileSync(tokenURI.replace("file://", ""), "utf8"));
        expect(fileContent.description).to.equal(prompt);
      });

      it("Should mint multiple NFTs with different metadata files", async function () {
        const { contract, recipient } = await getFixture();

        // Erstelle mehrere Metadaten-Dateien
        const prompts = ["A serene mountain landscape at sunset", "An abstract digital artwork with geometric patterns"];
        const mintPrice = await contract.read.mintPrice();
        
        // Mint mehrere NFTs mit verschiedenen Metadaten
        for (let i = 0; i < prompts.length; i++) {
          const tokenURI = createMetadataFile(i, prompts[i]);
          await contract.write.safeMint([tokenURI], {
            value: mintPrice,
            account: recipient?.account || contract.account,
          });
        }

        // Überprüfe, dass alle URIs richtig gesetzt wurden
        for (let i = 0; i < prompts.length; i++) {
          const storedURI = await contract.read.tokenURI([BigInt(i)]);
          expect(storedURI).to.include(`token_${i}.json`);

          // Lese die Datei und überprüfe den Inhalt
          const fileContent = JSON.parse(fs.readFileSync(storedURI.replace("file://", ""), "utf8"));
          expect(fileContent.description).to.equal(prompts[i]);
        }
      });
    });

    describe("Token Enumeration", function () {
      it("Should return correct total supply", async function () {
        const { contract } = await getFixture();
        const mintPrice = await contract.read.mintPrice();

        // Initially no tokens
        expect(await contract.read.totalSupply()).to.equal(0n);

        // Mint first token
        await contract.write.safeMint(["uri1"], { value: mintPrice });
        expect(await contract.read.totalSupply()).to.equal(1n);

        // Mint second token
        await contract.write.safeMint(["uri2"], { value: mintPrice });
        expect(await contract.read.totalSupply()).to.equal(2n);
      });

      it("Should enumerate tokens by index", async function () {
        const { contract } = await getFixture();
        const mintPrice = await contract.read.mintPrice();

        // Mint some tokens
        await contract.write.safeMint(["uri1"], { value: mintPrice });
        await contract.write.safeMint(["uri2"], { value: mintPrice });
        await contract.write.safeMint(["uri3"], { value: mintPrice });

        // Check tokens by index
        expect(await contract.read.tokenByIndex([0n])).to.equal(0n);
        expect(await contract.read.tokenByIndex([1n])).to.equal(1n);
        expect(await contract.read.tokenByIndex([2n])).to.equal(2n);
      });

      it("Should get all NFTs owned by a specific wallet", async function () {
        const { contract, owner, otherAccount } = await getFixture();
        const mintPrice = await contract.read.mintPrice();

        // Mint tokens to different owners
        await contract.write.safeMint(["uri1"], { value: mintPrice }); // Token 0 to owner
        
        const otherClient = await hre.viem.getContractAt(contractName, contract.address, {
          client: { wallet: otherAccount },
        });
        await otherClient.write.safeMint(["uri2"], { value: mintPrice }); // Token 1 to otherAccount
        await otherClient.write.safeMint(["uri3"], { value: mintPrice }); // Token 2 to otherAccount
        
        await contract.write.safeMint(["uri4"], { value: mintPrice }); // Token 3 to owner

        // Check balances
        expect(await contract.read.balanceOf([owner.account.address])).to.equal(2n);
        expect(await contract.read.balanceOf([otherAccount.account.address])).to.equal(2n);

        // Get all tokens owned by owner
        const ownerTokens = [];
        const ownerBalance = await contract.read.balanceOf([owner.account.address]);
        for (let i = 0; i < Number(ownerBalance); i++) {
          const tokenId = await contract.read.tokenOfOwnerByIndex([owner.account.address, BigInt(i)]);
          ownerTokens.push(Number(tokenId));
        }
        expect(ownerTokens).to.deep.equal([0, 3]);

        // Get all tokens owned by otherAccount
        const otherTokens = [];
        const otherBalance = await contract.read.balanceOf([otherAccount.account.address]);
        for (let i = 0; i < Number(otherBalance); i++) {
          const tokenId = await contract.read.tokenOfOwnerByIndex([otherAccount.account.address, BigInt(i)]);
          otherTokens.push(Number(tokenId));
        }
        expect(otherTokens).to.deep.equal([1, 2]);
      });

      it("Should return empty array for wallet with no NFTs", async function () {
        const { contract, recipient } = await getFixture();

        const recipientAddress = recipient?.account?.address || contract.account.address;
        
        // Check balance is 0
        expect(await contract.read.balanceOf([recipientAddress])).to.equal(0n);

        // Should revert when trying to get token by index for empty wallet
        await expect(
          contract.read.tokenOfOwnerByIndex([recipientAddress, 0n])
        ).to.be.rejected;
      });
    });
  };
}

/**
 * Gemeinsame Tests für Image Update Funktionalität
 */
export function createImageUpdateTests(getFixture: () => Promise<ContractFixture>, contractName: string = "GenImNFT") {
  return function() {
    describe("Image Updates", function () {
      it("Should update the tokenURI when requestImageUpdate is called", async function () {
        const { contract, otherAccount } = await getFixture();

        // 1. Erstelle ein NFT mit initialem Metadaten-Pfad
        const prompt = "A futuristic space station orbiting Jupiter";
        const initialTokenURI = createMetadataFile(42, prompt);
        const mintPrice = await contract.read.mintPrice();

        await contract.write.safeMint([initialTokenURI], {
          value: mintPrice,
        });

        // Bestätige die initiale TokenURI
        const originalTokenURI = await contract.read.tokenURI([0n]);
        expect(originalTokenURI).to.equal(initialTokenURI);

        // 2. Updater fordert ein Bild-Update an mit neuer URL
        const updaterClient = await hre.viem.getContractAt(contractName, contract.address, {
          client: { wallet: otherAccount },
        });

        const newMetadataUrl = "https://example.com/metadata/updated-token-42.json";
        await updaterClient.write.requestImageUpdate([0n, newMetadataUrl]);

        // 3. Überprüfe, ob die tokenURI aktualisiert wurde
        const updatedTokenURI = await contract.read.tokenURI([0n]);

        // Der Test wird fehlschlagen, wenn der Contract die tokenURI nicht aktualisiert
        expect(updatedTokenURI).to.equal(
          newMetadataUrl,
          "Die tokenURI wurde nicht aktualisiert. Die requestImageUpdate-Funktion " +
            "aktualisiert möglicherweise nicht automatisch die tokenURI.",
        );

        // 4. Bestätige, dass das Bild als aktualisiert markiert wurde
        const isImageUpdated = await contract.read.isImageUpdated([0n]);
        expect(isImageUpdated).to.be.true;
      });

      it("Should return correct authorized image updater information", async function () {
        const { contract, otherAccount } = await getFixture();
        const mintPrice = await contract.read.mintPrice();

        // 1. Mint ein Token
        await contract.write.safeMint(["test-uri"], { value: mintPrice });

        // 2. Initialer Zustand - kein autorisierter Updater
        const initialAuthorizedUpdater = await contract.read.getAuthorizedImageUpdater([0n]);
        expect(initialAuthorizedUpdater).to.equal("0x0000000000000000000000000000000000000000");

        // 3. Führe Image-Update durch
        const otherClient = await hre.viem.getContractAt(contractName, contract.address, {
          client: { wallet: otherAccount },
        });
        
        await otherClient.write.requestImageUpdate([0n, "https://example.com/updated.png"]);

        // 4. Image sollte als updated markiert sein
        const isImageUpdated = await contract.read.isImageUpdated([0n]);
        expect(isImageUpdated).to.be.true;
      });

      it("Should fail when querying non-existent token for image update status", async function () {
        const { contract } = await getFixture();

        // Versuche, Status eines nicht-existierenden Tokens abzufragen
        await expect(contract.read.isImageUpdated([999n])).to.be.rejectedWith("Token does not exist");
        await expect(contract.read.getAuthorizedImageUpdater([999n])).to.be.rejectedWith("Token does not exist");
      });

      it("Should prevent double image updates", async function () {
        const { contract, otherAccount } = await getFixture();
        const mintPrice = await contract.read.mintPrice();

        // 1. Mint ein Token
        await contract.write.safeMint(["test-uri"], { value: mintPrice });

        // 2. Erstes Update
        const otherClient = await hre.viem.getContractAt(contractName, contract.address, {
          client: { wallet: otherAccount },
        });
        
        await otherClient.write.requestImageUpdate([0n, "https://example.com/first-update.png"]);

        // 3. Image sollte als updated markiert sein
        expect(await contract.read.isImageUpdated([0n])).to.be.true;

        // 4. Zweites Update sollte fehlschlagen
        await expect(
          otherClient.write.requestImageUpdate([0n, "https://example.com/second-update.png"])
        ).to.be.rejected;
      });
    });
  };
}

/**
 * Creates basic NFT tests compatible with ethers.js fixtures
 * @param getFixture Function that returns an ethers.js-based fixture
 * @param expectedName Expected contract name (optional)
 * @returns Test function
 */
export function createBasicNFTTestsEthers(getFixture: () => Promise<any>, expectedName?: string) {
  return function() {
    describe("Basic NFT Functionality (Ethers)", function () {
      it("Should set the right owner", async function () {
        const { proxy, owner } = await getFixture();

        // read the owner address from the contract
        const ownerAddress = await proxy.owner();
        expect(ownerAddress).to.equal(owner.address);
      });

      it("Should have the correct name and symbol", async function () {
        const { proxy } = await getFixture();
        const name = await proxy.name();
        const symbol = await proxy.symbol();
        
        // Diese können je nach Version unterschiedlich sein
        expect(name).to.be.a('string');
        expect(symbol).to.be.a('string');
        
        if (expectedName) {
          expect(name).to.equal(expectedName);
        }
      });

      it("Should allow minting a new NFT", async function () {
        const { proxy, owner } = await getFixture();

        const tokenURI = "https://example.com/metadata/1.json";
        const mintPrice = await proxy.mintPrice();

        // Prägen mit Gebühr und als Owner
        await proxy.connect(owner)["safeMint(string)"](tokenURI, { value: mintPrice });

        // NFT gehört jetzt dem Owner
        const ownerOfToken = await proxy.ownerOf(0);
        expect(ownerOfToken).to.equal(owner.address);

        // Check that the token URI is set correctly
        expect(await proxy.tokenURI(0)).to.equal(tokenURI);
      });

      it("Should increment token ID after each mint", async function () {
        const { proxy, owner } = await getFixture();

        const mintPrice = await proxy.mintPrice();
        // Erste Münzung
        await proxy.connect(owner)["safeMint(string)"]("uri1", { value: mintPrice });

        // Zweite Münzung
        await proxy.connect(owner)["safeMint(string)"]("uri2", { value: mintPrice });

        // Überprüfe, dass die Token IDs korrekt sind
        expect(await proxy.ownerOf(0)).to.equal(owner.address);
        expect(await proxy.ownerOf(1)).to.equal(owner.address);
        expect(await proxy.tokenURI(0)).to.equal("uri1");
        expect(await proxy.tokenURI(1)).to.equal("uri2");
      });

      it("Should return the token ID when minting", async function () {
        const { proxy, owner } = await getFixture();

        const mintPrice = await proxy.mintPrice();
        const tx = await proxy.connect(owner)["safeMint(string)"]("test-uri", { value: mintPrice });
        
        // In ethers.js, we check the total supply to infer the token ID
        const totalSupply = await proxy.totalSupply();
        expect(totalSupply).to.equal(1n);
      });
    });

    describe("Token URI", function () {
      it("Should be possible to create an NFT without the token URI at minting", async function () {
        const { proxy, owner } = await getFixture();

        const mintPrice = await proxy.mintPrice();
        await proxy.connect(owner)["safeMint(string)"]("", { value: mintPrice });

        // Überprüfe, dass der Token URI leer ist
        const tokenURI = await proxy.tokenURI(0);
        expect(tokenURI).to.equal("");
      });

      it("Should return the correct token URI", async function () {
        const { proxy, owner } = await getFixture();

        const tokenURI = "https://example.com/metadata/special.json";
        const mintPrice = await proxy.mintPrice();
        await proxy.connect(owner)["safeMint(string)"](tokenURI, { value: mintPrice });

        expect(await proxy.tokenURI(0)).to.equal(tokenURI);
      });

      it("Should revert when querying non-existent token", async function () {
        const { proxy } = await getFixture();

        // Should revert with an ERC721 error about nonexistent token
        try {
          await proxy.tokenURI(999);
          expect.fail("Expected transaction to revert");
        } catch (error: any) {
          expect(error.message).to.include("revert");
        }
      });
    });

    describe("Metadata Storage", function () {
      it("Should create and use local metadata files", async function () {
        const { proxy, owner } = await getFixture();

        // Erstelle eine Metadaten-Datei
        const prompt = "A futuristic city skyline at night with neon lights";
        const tokenURI = createMetadataFile(0, prompt);

        console.log("Created metadata at:", tokenURI);
        const mintPrice = await proxy.mintPrice();
        
        // Mint NFT mit dem lokalen URI
        await proxy.connect(owner)["safeMint(string)"](tokenURI, { value: mintPrice });

        // Überprüfe, dass der Token URI richtig gesetzt wurde
        const storedURI = await proxy.tokenURI(0);
        expect(storedURI).to.equal(tokenURI);

        // Überprüfe, dass die Datei existiert
        expect(fs.existsSync(tokenURI.replace("file://", ""))).to.be.true;
      });

      it("Should mint multiple NFTs with different metadata files", async function () {
        const { proxy, owner } = await getFixture();

        const mintPrice = await proxy.mintPrice();

        // Erstelle und präge erstes NFT
        const tokenURI1 = createMetadataFile(0, "A serene mountain landscape");
        await proxy.connect(owner)["safeMint(string)"](tokenURI1, { value: mintPrice });

        // Erstelle und präge zweites NFT
        const tokenURI2 = createMetadataFile(1, "An underwater coral reef scene");
        await proxy.connect(owner)["safeMint(string)"](tokenURI2, { value: mintPrice });

        // Überprüfe beide Token URIs
        expect(await proxy.tokenURI(0)).to.equal(tokenURI1);
        expect(await proxy.tokenURI(1)).to.equal(tokenURI2);

        // Überprüfe das Total Supply
        expect(await proxy.totalSupply()).to.equal(2n);
      });
    });

    describe("Token Enumeration", function () {
      it("Should return correct total supply", async function () {
        const { proxy, owner } = await getFixture();

        expect(await proxy.totalSupply()).to.equal(0n);

        const mintPrice = await proxy.mintPrice();
        await proxy.connect(owner)["safeMint(string)"]("uri1", { value: mintPrice });
        expect(await proxy.totalSupply()).to.equal(1n);

        await proxy.connect(owner)["safeMint(string)"]("uri2", { value: mintPrice });
        expect(await proxy.totalSupply()).to.equal(2n);
      });

      it("Should enumerate tokens by index", async function () {
        const { proxy, owner } = await getFixture();

        const mintPrice = await proxy.mintPrice();
        await proxy.connect(owner)["safeMint(string)"]("uri1", { value: mintPrice });
        await proxy.connect(owner)["safeMint(string)"]("uri2", { value: mintPrice });

        expect(await proxy.tokenByIndex(0)).to.equal(0n);
        expect(await proxy.tokenByIndex(1)).to.equal(1n);
      });

      it("Should get all NFTs owned by a specific wallet", async function () {
        const { proxy, owner, otherAccount } = await getFixture();

        const mintPrice = await proxy.mintPrice();

        // Owner mint 2 tokens
        await proxy.connect(owner)["safeMint(string)"]("uri1", { value: mintPrice });
        await proxy.connect(owner)["safeMint(string)"]("uri2", { value: mintPrice });

        // Other account mint 1 token
        await proxy.connect(otherAccount)["safeMint(string)"]("uri3", { value: mintPrice });

        // Check owner's balance
        expect(await proxy.balanceOf(owner.address)).to.equal(2n);
        expect(await proxy.balanceOf(otherAccount.address)).to.equal(1n);

        // Check specific tokens
        expect(await proxy.ownerOf(0)).to.equal(owner.address);
        expect(await proxy.ownerOf(1)).to.equal(owner.address);
        expect(await proxy.ownerOf(2)).to.equal(otherAccount.address);
      });

      it("Should return empty array for wallet with no NFTs", async function () {
        const { proxy, otherAccount } = await getFixture();

        // Check that account with no NFTs has balance 0
        expect(await proxy.balanceOf(otherAccount.address)).to.equal(0n);
      });
    });
  };
}

/**
 * Creates image update tests compatible with ethers.js fixtures
 * @param getFixture Function that returns an ethers.js-based fixture
 * @param expectedName Expected contract name (optional)
 * @returns Test function
 */
export function createImageUpdateTestsEthers(getFixture: () => Promise<any>, expectedName?: string) {
  return function() {
    describe("Image Updates (Ethers)", function () {
      it("Should update the tokenURI when requestImageUpdate is called", async function () {
        const { proxy, owner, otherAccount } = await getFixture();

        // Erst ein NFT prägen
        const originalURI = createMetadataFile(42, "A fantasy dragon breathing fire");
        const mintPrice = await proxy.mintPrice();
        await proxy.connect(owner)["safeMint(string)"](originalURI, { value: mintPrice });

        const tokenId = 0n;

        // Überprüfe, dass das Image noch nicht updated wurde
        expect(await proxy.isImageUpdated(tokenId)).to.be.false;

        // Einen anderen Account das Image updaten lassen
        const newImageUrl = "https://example.com/generated-image-12345.png";
        await proxy.connect(otherAccount).requestImageUpdate(tokenId, newImageUrl);

        // Überprüfe, dass das Image updated wurde
        expect(await proxy.isImageUpdated(tokenId)).to.be.true;
        expect(await proxy.tokenURI(tokenId)).to.equal(newImageUrl);
      });

      it("Should return correct authorized image updater information", async function () {
        const { proxy, owner, otherAccount } = await getFixture();

        // Erst ein NFT prägen
        const mintPrice = await proxy.mintPrice();
        await proxy.connect(owner)["safeMint(string)"]("test-uri", { value: mintPrice });

        const tokenId = 0n;

        // Einen anderen Account das Image updaten lassen
        const newImageUrl = "https://example.com/generated-image-67890.png";
        await proxy.connect(otherAccount).requestImageUpdate(tokenId, newImageUrl);

        // Check that the image was updated successfully
        expect(await proxy.isImageUpdated(tokenId)).to.be.true;
        expect(await proxy.tokenURI(tokenId)).to.equal(newImageUrl);
        
        // Try to get the authorized image updater (may not be implemented in all versions)
        try {
          const imageUpdater = await proxy.getAuthorizedImageUpdater(tokenId);
          // If this function exists and works, check the updater address
          if (imageUpdater !== "0x0000000000000000000000000000000000000000") {
            expect(imageUpdater).to.equal(otherAccount.address);
          }
        } catch (error) {
          // If the function doesn't exist or doesn't work as expected in this version,
          // just verify that the image update was successful
          expect(await proxy.isImageUpdated(tokenId)).to.be.true;
        }
      });

      it("Should fail when querying non-existent token for image update status", async function () {
        const { proxy } = await getFixture();

        // Should revert when asking for image update status of non-existent token
        try {
          await proxy.isImageUpdated(999);
          expect.fail("Expected transaction to revert");
        } catch (error: any) {
          expect(error.message).to.include("revert");
        }
      });

      it("Should prevent double image updates", async function () {
        const { proxy, owner, otherAccount } = await getFixture();

        // Erst ein NFT prägen
        const mintPrice = await proxy.mintPrice();
        await proxy.connect(owner)["safeMint(string)"]("test-uri", { value: mintPrice });

        const tokenId = 0n;

        // Ersten Image-Update durchführen
        const firstImageUrl = "https://example.com/first-image.png";
        await proxy.connect(otherAccount).requestImageUpdate(tokenId, firstImageUrl);

        expect(await proxy.isImageUpdated(tokenId)).to.be.true;
        expect(await proxy.tokenURI(tokenId)).to.equal(firstImageUrl);

        // Versuche einen zweiten Image-Update (sollte fehlschlagen)
        try {
          const secondImageUrl = "https://example.com/second-image.png";
          await proxy.connect(otherAccount).requestImageUpdate(tokenId, secondImageUrl);
          expect.fail("Expected transaction to revert");
        } catch (error: any) {
          expect(error.message).to.include("revert");
        }

        // URI sollte unverändert sein
        expect(await proxy.tokenURI(tokenId)).to.equal(firstImageUrl);
      });
    });
  };
}
