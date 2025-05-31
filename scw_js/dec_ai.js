/**
 * Ein Modul zum Generieren von Bildern und Hochladen auf S3.
 */
import { generateAndUploadImage } from "./image_service.js";

/**
 * Handler-Funktion für die Serverless-Umgebung.
 * @param {Object} event - Das Event-Objekt.
 * @param {Object} context - Der Kontext des Aufrufs.
 * @returns {Object} - Die HTTP-Antwort.
 */
export async function handle(event, _context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
    "Content-Type": "application/json",
  };

  try {
    const queryParams = event.queryStringParameters || {};
    const prompt = queryParams.prompt;

    // Extrahiere die tokenId aus den Abfrageparametern, falls vorhanden
    // Setze sie auf "0", wenn sie nicht vorhanden ist oder ungültig
    const tokenId = queryParams.tokenId || "0";

    // Validiere den Prompt
    if (!prompt) {
      return {
        body: JSON.stringify({ error: "Kein Prompt angegeben." }),
        statusCode: 400,
        headers,
      };
    }

    console.log(`Generiere Bild für Prompt: "${prompt}" und TokenID: ${tokenId}`);

    // Übergebe sowohl den Prompt als auch die tokenId an die Funktion
    const metadataUrl = await generateAndUploadImage(prompt, tokenId);

    return {
      body: JSON.stringify({
        metadata_url: metadataUrl,
        token_id: tokenId,
      }),
      statusCode: 200,
      headers,
    };
  } catch (error) {
    console.error(`Fehler bei der Bildgenerierung: ${error}`);
    const statusCode = error.message.includes("API Token nicht gefunden") ? 401 : 500;

    return {
      body: JSON.stringify({ error: error.message }),
      statusCode,
      headers,
    };
  }
}

/* This is used to test locally and will not be executed on Scaleway Functions */
if (process.env.NODE_ENV === "test") {
  // Eine IIFE (Immediately Invoked Function Expression) mit async
  (async () => {
    // Dotenv laden und konfigurieren
    const dotenvModule = await import("dotenv");
    dotenvModule.config();

    // Serverless-Funktionen laden und Server starten
    const scw_fnc_node = await import("@scaleway/serverless-functions");
    scw_fnc_node.serveHandler(handle, 8080);
  })().catch((err) => console.error("Fehler beim Starten des lokalen Servers:", err));
}
