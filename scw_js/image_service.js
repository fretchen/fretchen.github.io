/**
 * Gemeinsames Modul für Bildgenerierung und S3-Upload
 */
if (process.env.NODE_ENV === "test") {
  try {
    // Da wir in einem ESM-Kontext sind, müssen wir dynamischen Import verwenden
    await import("dotenv").then((dotenv) => {
      dotenv.config();
      console.log("Umgebungsvariablen aus .env geladen");
    });
  } catch (error) {
    console.error("Fehler beim Laden von dotenv:", error);
  }
}

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

// Konfigurationskonstanten
const MODEL_NAME = "black-forest-labs/FLUX.1-schnell";
const ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/images/generations";
const JSON_BASE_PATH = "https://my-imagestore.s3.nl-ams.scw.cloud/";
const BUCKET_NAME = "my-imagestore";

/**
 * Generiert einen zufälligen String für Dateinamen
 */
function getRandomString(length = 6) {
  return randomBytes(length).toString("hex");
}

/**
 * Lädt ein JSON-Objekt auf S3 hoch.
 * @param {Object} jsonObj - Das hochzuladende JSON-Objekt.
 * @param {string} fileName - Der Name der Datei, unter dem das JSON-Objekt gespeichert werden soll.
 * @returns {Promise<string>} - Pfad zur hochgeladenen Datei
 */
export async function uploadJson(jsonObj, fileName) {
  const accessKey = process.env.SCW_ACCESS_KEY;
  const secretKey = process.env.SCW_SECRET_KEY;

  // Konvertiere das JSON-Objekt in einen String
  const jsonStr = JSON.stringify(jsonObj);

  // Erstelle den S3-Client
  const s3Client = new S3Client({
    region: "nl-ams",
    endpoint: "https://s3.nl-ams.scw.cloud",
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  // Konfiguriere den Upload
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: jsonStr,
    ContentType: "application/json",
    ACL: "public-read",
  };

  // Führe den Upload durch
  try {
    await s3Client.send(new PutObjectCommand(params));
    console.log(`JSON erfolgreich als ${fileName} hochgeladen`);
    return `${JSON_BASE_PATH}${fileName}`;
  } catch (error) {
    console.error(`Fehler beim Hochladen der JSON-Datei: ${error}`);
    throw error;
  }
}

/**
 * Generiert ein Bild basierend auf dem Prompt und lädt es auf S3 hoch
 * @param {string} prompt - Der Prompt für die Bildgenerierung
 * @returns {Promise<string>} - Pfad zur generierten Bilddatei
 */
export async function generateAndUploadImage(prompt) {
  const ionosApiToken = process.env.IONOS_API_TOKEN;

  if (!ionosApiToken) {
    throw new Error("API Token nicht gefunden. Bitte konfigurieren Sie die IONOS_API_TOKEN Umgebungsvariable.");
  }

  if (!prompt) {
    throw new Error("Kein Prompt angegeben.");
  }

  const headers = {
    Authorization: `Bearer ${ionosApiToken}`,
    "Content-Type": "application/json",
  };

  const body = {
    model: MODEL_NAME,
    prompt: prompt,
    size: "1024x1024",
  };

  console.log("Senden des Bildgenerierungsrequests...");
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
    timeout: 60000,
  });

  if (!response.ok) {
    console.error(`IONOS API Fehler: ${response.status} ${response.statusText}`);
    throw new Error(`Konnte IONOS nicht erreichen: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json();
  const b64Json = { b64_image: responseData.data[0].b64_json };
  console.log("Bild erhalten");

  // Erstelle einen eindeutigen Dateinamen
  const fileName = `image${getRandomString()}.json`;

  // Lade das JSON auf S3 hoch und gib den Pfad zurück
  return await uploadJson(b64Json, fileName);
}
