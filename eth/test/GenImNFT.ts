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

describe("GenImNFT", function () {
  // We define a fixture to reuse the same contract instance in every test
  async function deployGenImNFTFixture() {
    // Get accounts
    const [owner, otherAccount, recipient] = await hre.viem.getWalletClients();

    // Deploy the contract (ohne initialize aufzurufen)
    const genImNFT = await hre.viem.deployContract("GenImNFT", []);

    // Manuelle Initialisierung nach dem Deployment
    await genImNFT.write.initialize();

    const genImNFTPublic = await hre.viem.getContractAt("GenImNFT", genImNFT.address);

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

    it("Should not allow re-initialization", async function () {
      const { genImNFT } = await loadFixture(deployGenImNFTFixture);

      // Versuche, initialize() erneut aufzurufen
      await expect(genImNFT.write.initialize()).to.be.rejected; // Sollte mit einem "bereits initialisiert"-Fehler fehlschlagen
    });
  });

  describe("Minting", function () {
    it("Should allow the owner to mint a new NFT", async function () {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTFixture);

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
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTFixture);

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
      const { genImNFT, owner } = await loadFixture(deployGenImNFTFixture);
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
      const { genImNFT, owner } = await loadFixture(deployGenImNFTFixture);
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
      const { genImNFT, owner } = await loadFixture(deployGenImNFTFixture);

      const tokenURI = "https://example.com/metadata/special.json";
      const mintPrice = await genImNFT.read.mintPrice();
      await genImNFT.write.safeMint([tokenURI], {
        value: mintPrice,
      });

      expect(await genImNFT.read.tokenURI([0n])).to.equal(tokenURI);
    });

    it("Should revert when querying non-existent token", async function () {
      const { genImNFT } = await loadFixture(deployGenImNFTFixture);

      // Should revert with an ERC721 error about nonexistent token
      await expect(genImNFT.read.tokenURI([999n])).to.be.rejected;
    });
  });

  describe("Metadata Storage", function () {
    it("Should create and use local metadata files", async function () {
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTFixture);

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
      const { genImNFT, owner, recipient } = await loadFixture(deployGenImNFTFixture);

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
      const { genImNFT, owner, recipient, otherAccount } = await loadFixture(deployGenImNFTFixture);
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
      const recipientClient = await hre.viem.getContractAt("GenImNFT", genImNFT.address, {
        client: { wallet: recipient },
      });

      // 3. Erfasse den Kontostand des Updaters VOR dem Update
      const updaterBalanceBefore = await provider.getBalance({
        address: otherAccount.account.address,
      });
      console.log(`Updater balance before: ${formatEther(updaterBalanceBefore)} ETH`);

      // 4. Die autorisierte Wallet fordert ein Bild-Update an
      const updaterClient = await hre.viem.getContractAt("GenImNFT", genImNFT.address, {
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
      const { genImNFT, owner, recipient, otherAccount } = await loadFixture(deployGenImNFTFixture);

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
      const updaterClient = await hre.viem.getContractAt("GenImNFT", genImNFT.address, {
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
  });

  describe("Public Minting", function () {
    it("Should allow anyone to mint an NFT if they pay the fee", async function () {
      const { genImNFT, otherAccount } = await loadFixture(deployGenImNFTFixture);

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
      const { genImNFT, otherAccount } = await loadFixture(deployGenImNFTFixture);

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
      const { genImNFT, owner } = await loadFixture(deployGenImNFTFixture);

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
      const { genImNFT, owner, otherAccount } = await loadFixture(deployGenImNFTFixture);

      // 1. Präge ein Token als Owner
      const tokenURI = "https://example.com/metadata/not-yours-to-burn.json";
      const mintPrice = await genImNFT.read.mintPrice();

      await genImNFT.write.safeMint([tokenURI], {
        value: mintPrice,
      });

      // 2. Versuche, das Token als Nicht-Besitzer zu verbrennen
      const otherClientContract = await hre.viem.getContractAt("GenImNFT", genImNFT.address, {
        client: { wallet: otherAccount },
      });

      // Sollte fehlschlagen, da otherAccount nicht der Besitzer ist
      await expect(otherClientContract.write.burn([0n])).to.be.rejected;

      // 3. Das Token sollte noch existieren
      const ownerAfter = await genImNFT.read.ownerOf([0n]);
      expect(getAddress(ownerAfter)).to.equal(getAddress(owner.account.address));
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
