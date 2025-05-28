import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { formatEther, getAddress } from "viem"; // getAddress für Address-Normalisierung importieren
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
    name: `GenImNFTv2 #${tokenId}`,
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

describe("GenImNFTv2", function () {
  // We define a fixture to reuse the same contract instance in every test
  async function deployGenImNFTv2Fixture() {
    // Get accounts
    const [owner, otherAccount, recipient] = await hre.viem.getWalletClients();

    // Deploy the contract (ohne initialize aufzurufen)
    const genImNFT = await hre.viem.deployContract("GenImNFTv2", []);

    // Manuelle Initialisierung nach dem Deployment
    await genImNFT.write.initialize();

    const genImNFTPublic = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address);

    return {
      genImNFT,
      genImNFTPublic,
      owner,
      otherAccount,
      recipient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { genImNFTPublic, owner } = await loadFixture(deployGenImNFTv2Fixture);

      // read the owner address from the contract
      const ownerAddress = await genImNFTPublic.read.owner();
      // Normalisiere beide Adressen mit getAddress
      expect(getAddress(ownerAddress)).to.equal(getAddress(owner.account.address));
    });

    it("Should have the correct name and symbol", async function () {
      const { genImNFTPublic } = await loadFixture(deployGenImNFTv2Fixture);
      expect(await genImNFTPublic.read.name()).to.equal("GenImNFTv2");
      expect(await genImNFTPublic.read.symbol()).to.equal("GENIMGv2");
    });

    it("Should not allow re-initialization", async function () {
      const { genImNFT } = await loadFixture(deployGenImNFTv2Fixture);

      // Versuche, initialize() erneut aufzurufen
      await expect(genImNFT.write.initialize()).to.be.rejected; // Sollte mit einem "bereits initialisiert"-Fehler fehlschlagen
    });
  });

  describe("Minting", function () {
    it("Should allow the owner to mint a new NFT", async function () {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTv2Fixture);

      const tokenURI = "https://example.com/metadata/1.json";
      const mintPrice = await genImNFT.read.mintPrice();

      // Prägen mit Gebühr und als Owner
      const tx = await genImNFT.write.safeMint([tokenURI], {
        account: owner.account,
        value: mintPrice,
      });
      await tx;

      // NFT gehört jetzt dem Owner, nicht dem Empfänger
      const ownerOfToken = await genImNFT.read.ownerOf([0n]);
      expect(getAddress(ownerOfToken)).to.equal(getAddress(owner.account.address));

      // Check that the token URI is set correctly
      expect(await genImNFT.read.tokenURI([0n])).to.equal(tokenURI);
    });

    it("Should increment token ID after each mint", async function () {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTv2Fixture);

      const mintPrice = await genImNFT.read.mintPrice();
      // Erste Münzung
      await genImNFT.write.safeMint(["uri1"], {
        value: mintPrice,
      });

      // Zweite Münzung
      await genImNFT.write.safeMint(["uri2"], {
        value: mintPrice,
      });

      // Überprüfungen bleiben gleich, aber die Owner sind jetzt immer der Sender
      const ownerOfToken0 = await genImNFT.read.ownerOf([0n]);
      expect(getAddress(ownerOfToken0)).to.equal(getAddress(owner.account.address));

      const ownerOfToken1 = await genImNFT.read.ownerOf([1n]);
      expect(getAddress(ownerOfToken1)).to.equal(getAddress(owner.account.address));
    });

    it("Should return the token ID when minting", async function () {
      const { genImNFT, owner } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await genImNFT.read.mintPrice();

      // Simuliere mit korrekter Gebühr
      const tokenIdResponse = await genImNFT.simulate.safeMint(
        ["https://example.com/metadata/1.json"],
        { value: mintPrice }, // 0.01 ETH
      );

      expect(tokenIdResponse.result).to.equal(0n);

      // Führe tatsächlich aus
      await genImNFT.write.safeMint(
        ["https://example.com/metadata/1.json"],
        { value: mintPrice }, // 0.01 ETH
      );

      // Simuliere den nächsten Mint
      const nextTokenIdResponse = await genImNFT.simulate.safeMint(
        ["https://example.com/metadata/2.json"],
        { value: mintPrice }, // 0.01 ETH
      );

      expect(nextTokenIdResponse.result).to.equal(1n);
    });
  });

  describe("Token URI", function () {
    it("Should be possible to create an NFT without the token URI at minting", async function () {
      const { genImNFT, owner } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await genImNFT.read.mintPrice();
      // Mint NFT ohne URI
      await genImNFT.write.safeMint([""], {
        value: mintPrice,
      });
      // Überprüfe, dass der Token URI leer ist
      const tokenURI = await genImNFT.read.tokenURI([0n]);
      expect(tokenURI).to.equal("");
    });
    it("Should return the correct token URI", async function () {
      const { genImNFT, owner } = await loadFixture(deployGenImNFTv2Fixture);

      const tokenURI = "https://example.com/metadata/special.json";
      const mintPrice = await genImNFT.read.mintPrice();
      await genImNFT.write.safeMint([tokenURI], {
        value: mintPrice,
      });

      expect(await genImNFT.read.tokenURI([0n])).to.equal(tokenURI);
    });

    it("Should revert when querying non-existent token", async function () {
      const { genImNFT } = await loadFixture(deployGenImNFTv2Fixture);

      // Should revert with an ERC721 error about nonexistent token
      await expect(genImNFT.read.tokenURI([999n])).to.be.rejected;
    });
  });

  describe("Metadata Storage", function () {
    it("Should create and use local metadata files", async function () {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTv2Fixture);

      // Erstelle eine Metadaten-Datei
      const prompt = "A futuristic city skyline at night with neon lights";
      const tokenURI = createMetadataFile(0, prompt);

      console.log("Created metadata at:", tokenURI);
      const mintPrice = await genImNFT.read.mintPrice();
      // Mint NFT mit dem lokalen URI
      await genImNFT.write.safeMint([tokenURI], {
        value: mintPrice, // 0.01 ETH
        account: recipient.account,
      });

      // Überprüfe, dass der Token URI richtig gesetzt wurde
      const storedURI = await genImNFT.read.tokenURI([0n]);
      expect(storedURI).to.equal(tokenURI);

      // Überprüfe, dass die Datei existiert
      expect(fs.existsSync(tokenURI.replace("file://", ""))).to.be.true;

      // Optional: Lese die Datei und überprüfe den Inhalt
      const fileContent = JSON.parse(fs.readFileSync(tokenURI.replace("file://", ""), "utf8"));
      expect(fileContent.description).to.equal(prompt);
    });

    it("Should mint multiple NFTs with different metadata files", async function () {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTv2Fixture);

      // Erstelle mehrere Metadaten-Dateien
      const prompts = ["A serene mountain landscape at sunset", "An abstract digital artwork with geometric patterns"];
      const mintPrice = await genImNFT.read.mintPrice();
      // Mint mehrere NFTs mit verschiedenen Metadaten
      for (let i = 0; i < prompts.length; i++) {
        const tokenURI = createMetadataFile(i, prompts[i]);
        await genImNFT.write.safeMint([tokenURI], {
          value: mintPrice,
          account: recipient.account,
        });
      }

      // Überprüfe, dass alle URIs richtig gesetzt wurden
      for (let i = 0; i < prompts.length; i++) {
        const storedURI = await genImNFT.read.tokenURI([BigInt(i)]);
        expect(storedURI).to.include(`token_${i}.json`);

        // Lese die Datei und überprüfe den Inhalt
        const fileContent = JSON.parse(fs.readFileSync(storedURI.replace("file://", ""), "utf8"));
        expect(fileContent.description).to.equal(prompts[i]);
      }
    });
  });

  describe("Image Updates", function () {
    it("Should allow another wallet to update the image for a token", async function () {
      const { genImNFT, owner, recipient, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);
      const provider = await hre.viem.getPublicClient();

      // 1. Erstelle ein NFT mit leerem Bild und übertrage es dann an recipient
      const prompt = "A cyberpunk city with flying cars in the rain";
      const tokenURI = createMetadataFile(7, prompt);
      const mintPrice = await genImNFT.read.mintPrice();
      console.log("Mint price:", formatEther(mintPrice), "ETH");
      await genImNFT.write.safeMint([tokenURI], {
        value: mintPrice,
      });

      // NFT an recipient übertragen
      await genImNFT.write.transferFrom([owner.account.address, recipient.account.address, 0n]);

      // 2. Token-Besitzer autorisiert eine andere Wallet als Bild-Updater
      const recipientClient = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address, {
        client: { wallet: recipient },
      });

      // 3. Erfasse den Kontostand des Updaters VOR dem Update
      const updaterBalanceBefore = await provider.getBalance({
        address: otherAccount.account.address,
      });
      console.log(`Updater balance before: ${formatEther(updaterBalanceBefore)} ETH`);

      // 4. Die autorisierte Wallet fordert ein Bild-Update an
      const updaterClient = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address, {
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
      const isImageUpdated = await genImNFT.read.isImageUpdated([0n]);
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

    it("Should update the tokenURI when requestImageUpdate is called", async function () {
      const { genImNFT, owner, recipient, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);

      // 1. Erstelle ein NFT mit initialem Metadaten-Pfad
      const prompt = "A futuristic space station orbiting Jupiter";
      const initialTokenURI = createMetadataFile(42, prompt);
      const mintPrice = await genImNFT.read.mintPrice();

      await genImNFT.write.safeMint([initialTokenURI], {
        value: mintPrice,
      });

      // Bestätige die initiale TokenURI
      const originalTokenURI = await genImNFT.read.tokenURI([0n]);
      expect(originalTokenURI).to.equal(initialTokenURI);

      // 2. Updater fordert ein Bild-Update an mit neuer URL
      const updaterClient = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address, {
        client: { wallet: otherAccount },
      });

      const newMetadataUrl = "https://example.com/metadata/updated-token-42.json";
      await updaterClient.write.requestImageUpdate([0n, newMetadataUrl]);

      // 3. Überprüfe, ob die tokenURI aktualisiert wurde
      const updatedTokenURI = await genImNFT.read.tokenURI([0n]);

      // Der Test wird fehlschlagen, wenn der Contract die tokenURI nicht aktualisiert
      expect(updatedTokenURI).to.equal(
        newMetadataUrl,
        "Die tokenURI wurde nicht aktualisiert. Die requestImageUpdate-Funktion " +
          "aktualisiert möglicherweise nicht automatisch die tokenURI.",
      );

      // 4. Bestätige, dass das Bild als aktualisiert markiert wurde
      const isImageUpdated = await genImNFT.read.isImageUpdated([0n]);
      expect(isImageUpdated).to.be.true;
    });

    it("Should return correct authorized image updater information", async function () {
      const { genImNFT, owner, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await genImNFT.read.mintPrice();

      // 1. Mint ein Token
      await genImNFT.write.safeMint(["test-uri"], { value: mintPrice });

      // 2. Initialer Zustand - kein autorisierter Updater
      const initialAuthorizedUpdater = await genImNFT.read.getAuthorizedImageUpdater([0n]);
      expect(initialAuthorizedUpdater).to.equal("0x0000000000000000000000000000000000000000");

      // 3. Führe Image-Update durch
      const otherClient = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address, {
        client: { wallet: otherAccount },
      });
      
      await otherClient.write.requestImageUpdate([0n, "https://example.com/updated.png"]);

      // 4. Image sollte als updated markiert sein
      const isImageUpdated = await genImNFT.read.isImageUpdated([0n]);
      expect(isImageUpdated).to.be.true;
    });

    it("Should fail when querying non-existent token for image update status", async function () {
      const { genImNFT } = await loadFixture(deployGenImNFTv2Fixture);

      // Versuche, Status eines nicht-existierenden Tokens abzufragen
      await expect(genImNFT.read.isImageUpdated([999n])).to.be.rejectedWith("Token does not exist");
      await expect(genImNFT.read.getAuthorizedImageUpdater([999n])).to.be.rejectedWith("Token does not exist");
    });

    it("Should prevent double image updates", async function () {
      const { genImNFT, owner, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await genImNFT.read.mintPrice();

      // 1. Mint ein Token
      await genImNFT.write.safeMint(["test-uri"], { value: mintPrice });

      // 2. Erstes Update
      const otherClient = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address, {
        client: { wallet: otherAccount },
      });
      
      await otherClient.write.requestImageUpdate([0n, "https://example.com/first-update.png"]);

      // 3. Image sollte als updated markiert sein
      expect(await genImNFT.read.isImageUpdated([0n])).to.be.true;

      // 4. Zweites Update sollte fehlschlagen
      await expect(
        otherClient.write.requestImageUpdate([0n, "https://example.com/second-update.png"])
      ).to.be.rejectedWith("Image already updated");
    });
  });

  describe("Public Minting", function () {
    it("Should allow anyone to mint an NFT if they pay the fee", async function () {
      const { genImNFT, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);

      const tokenURI = "https://example.com/metadata/public-mint.json";
      const mintPrice = await genImNFT.read.mintPrice();

      // Minte als normaler Benutzer (nicht Owner) mit korrekter Gebühr
      const mintTx = await genImNFT.write.safeMint([tokenURI], {
        account: otherAccount.account,
        value: mintPrice, // 0.01 ETH
      });

      // Prüfe, dass der NFT dem Sender gehört
      const ownerOfToken = await genImNFT.read.ownerOf([0n]);
      expect(getAddress(ownerOfToken)).to.equal(getAddress(otherAccount.account.address));

      // Prüfe, dass der Token-URI korrekt gesetzt wurde
      expect(await genImNFT.read.tokenURI([0n])).to.equal(tokenURI);
    });

    it("Should fail if payment is insufficient", async function () {
      const { genImNFT, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);

      const tokenURI = "https://example.com/metadata/insufficient-payment.json";
      const mintPrice = await genImNFT.read.mintPrice();
      // Versuche zu minten mit zu wenig Gebühr
      await expect(
        genImNFT.write.safeMint([tokenURI], {
          account: otherAccount.account,
          value: mintPrice - 1n,
        }),
      ).to.be.rejectedWith("Insufficient payment");
    });
  });

  describe("Token Burning", function () {
    it("Should allow the owner to burn their token", async function () {
      const { genImNFT, owner } = await loadFixture(deployGenImNFTv2Fixture);

      // 1. Zuerst ein NFT prägen
      const tokenURI = "https://example.com/metadata/to-be-burned.json";
      const mintPrice = await genImNFT.read.mintPrice();

      await genImNFT.write.safeMint([tokenURI], {
        value: mintPrice,
      });

      // 2. Überprüfe, dass das Token existiert
      const ownerBefore = await genImNFT.read.ownerOf([0n]);
      expect(getAddress(ownerBefore)).to.equal(getAddress(owner.account.address));

      // 3. Verbrenne das Token
      await genImNFT.write.burn([0n]);

      // 4. Überprüfe, dass das Token wirklich verbrannt wurde
      // Der ownerOf-Aufruf sollte fehlschlagen, da das Token nicht mehr existiert
      await expect(genImNFT.read.ownerOf([0n])).to.be.rejected;
    });

    it("Should prevent non-owners from burning tokens", async function () {
      const { genImNFT, owner, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);

      // 1. Präge ein Token als Owner
      const tokenURI = "https://example.com/metadata/not-yours-to-burn.json";
      const mintPrice = await genImNFT.read.mintPrice();

      await genImNFT.write.safeMint([tokenURI], {
        value: mintPrice,
      });

      // 2. Versuche, das Token als Nicht-Besitzer zu verbrennen
      const otherClientContract = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address, {
        client: { wallet: otherAccount },
      });

      // Sollte fehlschlagen, da otherAccount nicht der Besitzer ist
      await expect(otherClientContract.write.burn([0n])).to.be.rejected;

      // 3. Das Token sollte noch existieren
      const ownerAfter = await genImNFT.read.ownerOf([0n]);
      expect(getAddress(ownerAfter)).to.equal(getAddress(owner.account.address));
    });

    it("Should clean up mappings when burning tokens", async function () {
      const { genImNFT, owner, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);

      // 1. Mint ein Token
      const tokenURI = "https://example.com/metadata/burn-cleanup-test.json";
      const mintPrice = await genImNFT.read.mintPrice();
      await genImNFT.write.safeMint([tokenURI], { value: mintPrice });

      // 2. Führe ein Image-Update durch, um die Mappings zu setzen
      const otherClient = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address, {
        client: { wallet: otherAccount },
      });
      
      const imageUrl = "https://example.com/updated-image.png";
      await otherClient.write.requestImageUpdate([0n, imageUrl]);

      // 3. Überprüfe, dass die Mappings gesetzt sind
      const isUpdatedBefore = await genImNFT.read.isImageUpdated([0n]);
      expect(isUpdatedBefore).to.be.true;

      // 4. Verbrenne das Token
      await genImNFT.write.burn([0n]);

      // 5. Versuche, die Mappings abzufragen - sollte fehlschlagen, da Token nicht existiert
      await expect(genImNFT.read.isImageUpdated([0n])).to.be.rejectedWith("Token does not exist");
      await expect(genImNFT.read.getAuthorizedImageUpdater([0n])).to.be.rejectedWith("Token does not exist");
    });

    it("Should clean up mappings for multiple tokens when burned", async function () {
      const { genImNFT, owner, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await genImNFT.read.mintPrice();

      // 1. Mint mehrere Tokens
      await genImNFT.write.safeMint(["uri1"], { value: mintPrice });
      await genImNFT.write.safeMint(["uri2"], { value: mintPrice });
      await genImNFT.write.safeMint(["uri3"], { value: mintPrice });

      // 2. Update Images für alle Tokens
      const otherClient = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address, {
        client: { wallet: otherAccount },
      });

      for (let i = 0; i < 3; i++) {
        await otherClient.write.requestImageUpdate([BigInt(i), `https://example.com/image${i}.png`]);
      }

      // 3. Überprüfe, dass alle Mappings gesetzt sind
      for (let i = 0; i < 3; i++) {
        const isUpdated = await genImNFT.read.isImageUpdated([BigInt(i)]);
        expect(isUpdated).to.be.true;
      }

      // 4. Verbrenne Token 1 (mittleres Token)
      await genImNFT.write.burn([1n]);

      // 5. Überprüfe, dass Token 0 und 2 noch existieren und ihre Mappings intakt sind
      expect(await genImNFT.read.isImageUpdated([0n])).to.be.true;
      expect(await genImNFT.read.isImageUpdated([2n])).to.be.true;

      // 6. Token 1 sollte nicht mehr existieren
      await expect(genImNFT.read.isImageUpdated([1n])).to.be.rejectedWith("Token does not exist");

      // 7. Verbrenne die restlichen Tokens
      await genImNFT.write.burn([0n]);
      await genImNFT.write.burn([2n]);

      // 8. Alle Tokens sollten nicht mehr existieren
      await expect(genImNFT.read.isImageUpdated([0n])).to.be.rejectedWith("Token does not exist");
      await expect(genImNFT.read.isImageUpdated([2n])).to.be.rejectedWith("Token does not exist");
    });

    it("Should not affect other tokens when burning one token", async function () {
      const { genImNFT, owner, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await genImNFT.read.mintPrice();

      // 1. Mint drei Tokens
      await genImNFT.write.safeMint(["uri1"], { value: mintPrice });
      await genImNFT.write.safeMint(["uri2"], { value: mintPrice });
      await genImNFT.write.safeMint(["uri3"], { value: mintPrice });

      // 2. Update nur Token 0 und 2
      const otherClient = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address, {
        client: { wallet: otherAccount },
      });

      await otherClient.write.requestImageUpdate([0n, "https://example.com/image0.png"]);
      await otherClient.write.requestImageUpdate([2n, "https://example.com/image2.png"]);

      // 3. Überprüfe Initial-Status
      expect(await genImNFT.read.isImageUpdated([0n])).to.be.true;
      expect(await genImNFT.read.isImageUpdated([1n])).to.be.false; // Nicht updated
      expect(await genImNFT.read.isImageUpdated([2n])).to.be.true;

      // 4. Verbrenne Token 1 (das nicht-updated Token)
      await genImNFT.write.burn([1n]);

      // 5. Token 0 und 2 sollten unverändert bleiben
      expect(await genImNFT.read.isImageUpdated([0n])).to.be.true;
      expect(await genImNFT.read.isImageUpdated([2n])).to.be.true;

      // 6. Token 1 sollte nicht mehr existieren
      await expect(genImNFT.read.isImageUpdated([1n])).to.be.rejectedWith("Token does not exist");
    });
  });

  describe("Enumerable Features", function () {
    it("Should track total supply correctly", async function () {
      const { genImNFT, owner } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await genImNFT.read.mintPrice();

      // Initially no tokens
      expect(await genImNFT.read.totalSupply()).to.equal(0n);

      // Mint first token
      await genImNFT.write.safeMint(["uri1"], { value: mintPrice });
      expect(await genImNFT.read.totalSupply()).to.equal(1n);

      // Mint second token
      await genImNFT.write.safeMint(["uri2"], { value: mintPrice });
      expect(await genImNFT.read.totalSupply()).to.equal(2n);
    });

    it("Should enumerate tokens by index", async function () {
      const { genImNFT, owner } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await genImNFT.read.mintPrice();

      // Mint some tokens
      await genImNFT.write.safeMint(["uri1"], { value: mintPrice });
      await genImNFT.write.safeMint(["uri2"], { value: mintPrice });
      await genImNFT.write.safeMint(["uri3"], { value: mintPrice });

      // Check tokens by index
      expect(await genImNFT.read.tokenByIndex([0n])).to.equal(0n);
      expect(await genImNFT.read.tokenByIndex([1n])).to.equal(1n);
      expect(await genImNFT.read.tokenByIndex([2n])).to.equal(2n);
    });

    it("Should get all NFTs owned by a specific wallet", async function () {
      const { genImNFT, owner, otherAccount, recipient } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await genImNFT.read.mintPrice();

      // Mint tokens to different owners
      await genImNFT.write.safeMint(["uri1"], { value: mintPrice }); // Token 0 to owner
      
      const otherClient = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address, {
        client: { wallet: otherAccount },
      });
      await otherClient.write.safeMint(["uri2"], { value: mintPrice }); // Token 1 to otherAccount
      await otherClient.write.safeMint(["uri3"], { value: mintPrice }); // Token 2 to otherAccount
      
      await genImNFT.write.safeMint(["uri4"], { value: mintPrice }); // Token 3 to owner

      // Check balances
      expect(await genImNFT.read.balanceOf([owner.account.address])).to.equal(2n);
      expect(await genImNFT.read.balanceOf([otherAccount.account.address])).to.equal(2n);

      // Get all tokens owned by owner
      const ownerTokens = [];
      const ownerBalance = await genImNFT.read.balanceOf([owner.account.address]);
      for (let i = 0; i < Number(ownerBalance); i++) {
        const tokenId = await genImNFT.read.tokenOfOwnerByIndex([owner.account.address, BigInt(i)]);
        ownerTokens.push(Number(tokenId));
      }
      expect(ownerTokens).to.deep.equal([0, 3]);

      // Get all tokens owned by otherAccount
      const otherTokens = [];
      const otherBalance = await genImNFT.read.balanceOf([otherAccount.account.address]);
      for (let i = 0; i < Number(otherBalance); i++) {
        const tokenId = await genImNFT.read.tokenOfOwnerByIndex([otherAccount.account.address, BigInt(i)]);
        otherTokens.push(Number(tokenId));
      }
      expect(otherTokens).to.deep.equal([1, 2]);
    });

    it("Should return empty array for wallet with no NFTs", async function () {
      const { genImNFT, recipient } = await loadFixture(deployGenImNFTv2Fixture);

      // Check balance is 0
      expect(await genImNFT.read.balanceOf([recipient.account.address])).to.equal(0n);

      // Should revert when trying to get token by index for empty wallet
      await expect(
        genImNFT.read.tokenOfOwnerByIndex([recipient.account.address, 0n])
      ).to.be.rejected;
    });

    it("Should update enumeration after token transfer", async function () {
      const { genImNFT, owner, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await genImNFT.read.mintPrice();

      // Mint token to owner
      await genImNFT.write.safeMint(["uri1"], { value: mintPrice });
      await genImNFT.write.safeMint(["uri2"], { value: mintPrice });

      // Initially owner has 2 tokens
      expect(await genImNFT.read.balanceOf([owner.account.address])).to.equal(2n);
      expect(await genImNFT.read.balanceOf([otherAccount.account.address])).to.equal(0n);

      // Transfer one token
      await genImNFT.write.transferFrom([owner.account.address, otherAccount.account.address, 0n]);

      // Check updated balances
      expect(await genImNFT.read.balanceOf([owner.account.address])).to.equal(1n);
      expect(await genImNFT.read.balanceOf([otherAccount.account.address])).to.equal(1n);

      // Check owner still has token 1
      const ownerToken = await genImNFT.read.tokenOfOwnerByIndex([owner.account.address, 0n]);
      expect(ownerToken).to.equal(1n);

      // Check otherAccount now has token 0
      const otherToken = await genImNFT.read.tokenOfOwnerByIndex([otherAccount.account.address, 0n]);
      expect(otherToken).to.equal(0n);
    });

    it("Should update enumeration after token burn", async function () {
      const { genImNFT, owner } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await genImNFT.read.mintPrice();

      // Mint 3 tokens
      await genImNFT.write.safeMint(["uri1"], { value: mintPrice });
      await genImNFT.write.safeMint(["uri2"], { value: mintPrice });
      await genImNFT.write.safeMint(["uri3"], { value: mintPrice });

      // Check initial state
      expect(await genImNFT.read.totalSupply()).to.equal(3n);
      expect(await genImNFT.read.balanceOf([owner.account.address])).to.equal(3n);

      // Burn middle token
      await genImNFT.write.burn([1n]);

      // Check updated state
      expect(await genImNFT.read.totalSupply()).to.equal(2n);
      expect(await genImNFT.read.balanceOf([owner.account.address])).to.equal(2n);

      // Check remaining tokens are still accessible
      const token0 = await genImNFT.read.tokenOfOwnerByIndex([owner.account.address, 0n]);
      const token1 = await genImNFT.read.tokenOfOwnerByIndex([owner.account.address, 1n]);
      
      // Should be tokens 0 and 2 (since token 1 was burned)
      expect([Number(token0), Number(token1)].sort()).to.deep.equal([0, 2]);
    });
  });

  describe("Wallet NFT Enumeration Helper", function () {
    // Helper function to get all NFTs for a wallet
    async function getAllNFTsForWallet(contract: any, walletAddress: string) {
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

    it("Should get all NFTs with metadata for a wallet", async function () {
      const { genImNFT, owner, otherAccount } = await loadFixture(deployGenImNFTv2Fixture);
      const mintPrice = await genImNFT.read.mintPrice();

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
          const otherClient = await hre.viem.getContractAt("GenImNFTv2", genImNFT.address, {
            client: { wallet: otherAccount },
          });
          await otherClient.write.safeMint([tokenURI], { value: mintPrice });
        } else {
          await genImNFT.write.safeMint([tokenURI], { value: mintPrice });
        }
      }

      // Get all NFTs for owner
      const ownerNFTs = await getAllNFTsForWallet(genImNFT, owner.account.address);
      expect(ownerNFTs).to.have.length(2);
      expect(ownerNFTs[0].tokenId).to.equal(0);
      expect(ownerNFTs[1].tokenId).to.equal(2);

      // Get all NFTs for otherAccount
      const otherNFTs = await getAllNFTsForWallet(genImNFT, otherAccount.account.address);
      expect(otherNFTs).to.have.length(1);
      expect(otherNFTs[0].tokenId).to.equal(1);
      expect(otherNFTs[0].tokenURI).to.include("token_1.json");
    });
  });

  // Aufräumen nach jedem Test
  afterEach(function () {
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
