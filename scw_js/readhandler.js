import { nftAbi } from "./nft_abi.js";
import { getContract } from "viem";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { generateAndUploadImage } from "./image_service.js";
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

async function handle(event, context, cb) {
  // get the prompt from the event
  const prompt = event.queryStringParameters.prompt;
  if (!prompt) {
    return {
      body: { error: "No prompt provided" },
      headers: { "Content-Type": ["application/json"] },
      statusCode: 400,
    };
  }
  console.log("Prompt: ", prompt);
  // get the tokenID from the event
  const tokenId = event.queryStringParameters.tokenId;
  if (!tokenId) {
    return {
      body: { error: "No tokenId provided" },
      headers: { "Content-Type": ["application/json"] },
      statusCode: 400,
    };
  }
  console.log("TokenId: ", tokenId);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });
  const contract = getContract({
    address: "0xf18E3901D91D8a08380E37A466E6F7f6AA4BD4a6",
    abi: nftAbi,
    client: publicClient,
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

    return {
      body: JSON.stringify({
        image_url: imageUrl,
        mintPrice: mintPrice.toString(),
        message: "Bild erfolgreich generiert",
      }),
      headers: { "Content-Type": ["application/json"] },
      statusCode: 200,
    };
  } catch (error) {
    console.error(`Fehler bei der Bildgenerierung: ${error}`);
    return {
      body: JSON.stringify({
        error: `Bildgenerierung fehlgeschlagen: ${error.message}`,
        mintPrice: mintPrice.toString(),
      }),
      headers: { "Content-Type": ["application/json"] },
      statusCode: 500,
    };
  }
}

/* This is used to test locally and will not be executed on Scaleway Functions */
if (process.env.NODE_ENV === "test") {
  import("@scaleway/serverless-functions").then((scw_fnc_node) => {
    scw_fnc_node.serveHandler(handle, 8080);
  });
}
