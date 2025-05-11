import { nftAbi } from "./nft_abi.js";
import { getContract, createWalletClient, parseEther } from "viem";
import { createPublicClient, http } from "viem";
import { sepolia, optimism } from "viem/chains";
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
 * Aktualisiert ein Token mit einer neuen Image-URL
 * @param {Object} contract - Der Smart-Contract
 * @param {string} tokenId - Die Token-ID
 * @param {string} imageUrl - Die URL des neuen Bildes
 * @returns {Object} - Die Transaktionsdetails
 */
async function updateTokenWithImage(contract, tokenId, imageUrl) {
  console.log(`Aktualisiere Token ${tokenId} mit Image-URL: ${imageUrl}`);

  // Die Transaktion vorbereiten und senden
  const hash = await contract.write.requestImageUpdate([BigInt(tokenId), imageUrl]);

  console.log(`Transaktion gesendet: ${hash}`);
  return hash;
}

async function handle(event, context, cb) {
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
    address: "0xa5d6a3eEDADc3346E22dF9556dc5B99f2777ab68",
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

  //  if the image  is valid and if the was alreay
  // updated through isImageUpdated function
  const isUpdated = await contract.read.isImageUpdated([BigInt(tokenId)]);
  console.log(`Token ${tokenId} existiert. Bild-Update-Status: ${isUpdated}`);
  // if the image is already updated raise an error
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
    const imageUrl = await generateAndUploadImage(prompt);

    // Jetzt aktualisieren wir das Token mit der neuen Image-URL
    const txHash = await updateTokenWithImage(contract, tokenId, imageUrl);

    return {
      body: JSON.stringify({
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
