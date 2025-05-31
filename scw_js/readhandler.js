import { nftAbi } from "./nft_abi.js";
import { getContract, createWalletClient, createPublicClient, http } from "viem";
import { optimism } from "viem/chains";
import { generateAndUploadImage } from "./image_service.js";
import { privateKeyToAccount } from "viem/accounts";
export { handle };

async function isTokenMinted(contract, tokenId) {
  try {
    // Der ownerOf-Aufruf schlägt fehl, wenn das Token nicht existiert
    await contract.read.ownerOf([BigInt(tokenId)]);
    return true; // Token existiert
  } catch (error) {
    return false; // Token existiert nicht
  }
}

/**
 * Aktualisiert ein Token mit einer neuen Metadaten-URL
 * @param {Object} contract - Der Smart-Contract
 * @param {string} tokenId - Die Token-ID
 * @param {string} metadataUrl - Die URL der neuen Metadaten
 * @returns {Object} - Die Transaktionsdetails
 */
async function updateTokenWithImage(contract, tokenId, metadataUrl) {
  console.log(`Aktualisiere Token ${tokenId} mit Metadaten-URL: ${metadataUrl}`);

  // Die Transaktion vorbereiten und senden
  const hash = await contract.write.requestImageUpdate([BigInt(tokenId), metadataUrl]);

  console.log(`Transaktion gesendet: ${hash}`);
  return hash;
}

async function handle(event, _context, _cb) {
  // get the prompt from the event
  const prompt = event.queryStringParameters.prompt;
  if (!prompt) {
    return {
      body: JSON.stringify({ error: "No prompt provided" }),
      headers: { "Content-Type": ["application/json"] },
      statusCode: 400,
    };
  }
  console.log("Prompt: ", prompt);
  // get the tokenID from the event
  const tokenId = event.queryStringParameters.tokenId;
  if (!tokenId) {
    return {
      body: JSON.stringify({ error: "No tokenId provided" }),
      headers: { "Content-Type": ["application/json"] },
      statusCode: 400,
    };
  }
  console.log("TokenId: ", tokenId);

  const publicClient = createPublicClient({
    chain: optimism,
    transport: http(),
  });

  // Private Key aus der Umgebungsvariable laden
  const privateKey = process.env.NFT_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("NFT_WALLET_PRIVATE_KEY nicht konfiguriert");
  }

  // Account aus dem privaten Schlüssel erstellen
  const account = privateKeyToAccount(`0x${privateKey}`);

  // Wallet-Client mit dem Account erstellen
  const walletClient = createWalletClient({
    account,
    chain: optimism,
    transport: http(),
  });

  const contract = getContract({
    address: "0x9859431b682e861b19e87Db14a04944BC747AB6d",
    abi: nftAbi,
    client: {
      public: publicClient,
      wallet: walletClient,
    },
  });

  const mintPrice = await contract.read.mintPrice();
  console.log("Mint price: ", mintPrice.toString());

  // now test if the NFT exists
  const tokenExists = await isTokenMinted(contract, tokenId);
  if (!tokenExists) {
    return {
      body: JSON.stringify({ error: "Token does not exist" }),
      headers: { "Content-Type": ["application/json"] },
      statusCode: 404,
    };
  }
  console.log("Token exists: ", tokenExists);

  // Prüfen, ob das Bild bereits aktualisiert wurde
  const isUpdated = await contract.read.isImageUpdated([BigInt(tokenId)]);
  console.log(`Token ${tokenId} existiert. Bild-Update-Status: ${isUpdated}`);

  // Wenn das Bild bereits aktualisiert wurde, geben wir einen Fehler zurück
  if (isUpdated) {
    return {
      body: JSON.stringify({ error: "Image already updated" }),
      headers: { "Content-Type": ["application/json"] },
      statusCode: 400,
    };
  }

  // Wenn das Token existiert und noch nicht aktualisiert wurde
  try {
    // Generiere ein Bild basierend auf dem Prompt und lade es hoch
    // Übergebe jetzt auch die tokenId an die Funktion
    const metadataUrl = await generateAndUploadImage(prompt, tokenId);

    // Metadaten laden, um die Bild-URL zu extrahieren
    const metadataResponse = await fetch(metadataUrl);
    if (!metadataResponse.ok) {
      throw new Error(`Fehler beim Laden der Metadaten: ${metadataResponse.status}`);
    }

    const metadata = await metadataResponse.json();
    const imageUrl = metadata.image;

    // Jetzt aktualisieren wir das Token mit der neuen Metadaten-URL
    const txHash = await updateTokenWithImage(contract, tokenId, metadataUrl);

    return {
      body: JSON.stringify({
        metadata_url: metadataUrl,
        image_url: imageUrl,
        mintPrice: mintPrice.toString(),
        message: "Bild erfolgreich generiert und Token aktualisiert",
        transaction_hash: txHash,
      }),
      headers: { "Content-Type": ["application/json"] },
      statusCode: 200,
    };
  } catch (error) {
    console.error(`Fehler bei der Bildgenerierung oder Token-Aktualisierung: ${error}`);
    return {
      body: JSON.stringify({
        error: `Operation fehlgeschlagen: ${error.message}`,
        mintPrice: mintPrice.toString(),
      }),
      headers: { "Content-Type": ["application/json"] },
      statusCode: 500,
    };
  }
}

/* This is used to test locally and will not be executed on Scaleway Functions */
if (process.env.NODE_ENV === "test") {
  // Zuerst dotenv laden, um den privaten Schlüssel zu laden
  import("dotenv").then((dotenv) => {
    dotenv.config();

    // Dann Serverless-Funktionen laden
    import("@scaleway/serverless-functions").then((scw_fnc_node) => {
      scw_fnc_node.serveHandler(handle, 8080);
    });
  });
}
