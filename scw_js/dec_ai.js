/**
 * Ein Modul zum Generieren von Bildern und Hochladen auf S3.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";

/**
 * Lädt ein JSON-Objekt auf S3 hoch.
 * @param {Object} jsonObj - Das hochzuladende JSON-Objekt.
 * @param {string} fileName - Der Name der Datei, unter dem das JSON-Objekt gespeichert werden soll.
 * @returns {Promise<void>}
 */
async function uploadJson(jsonObj, fileName) {
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
    Bucket: "my-imagestore",
    Key: fileName,
    Body: jsonStr,
    ContentType: "application/json",
    ACL: "public-read",
  };

  // Führe den Upload durch
  try {
    await s3Client.send(new PutObjectCommand(params));
    console.log(`JSON erfolgreich als ${fileName} hochgeladen`);
  } catch (error) {
    console.error(`Fehler beim Hochladen der JSON-Datei: ${error}`);
    throw error;
  }
}

/**
 * Handler-Funktion für die Serverless-Umgebung.
 * @param {Object} event - Das Event-Objekt.
 * @param {Object} context - Der Kontext des Aufrufs.
 * @returns {Object} - Die HTTP-Antwort.
 */
export async function handle(event, context) {
  const modelName = "black-forest-labs/FLUX.1-schnell";
  const endpoint = "https://openai.inference.de-txl.ionos.com/v1/images/generations";
  const jsonBasePath = "https://my-imagestore.s3.nl-ams.scw.cloud/";

  const ionosApiToken = process.env.IONOS_API_TOKEN;

  if (!ionosApiToken) {
    return {
      body: JSON.stringify({
        error: "API Token nicht gefunden. Bitte konfigurieren Sie die IONOS_API_TOKEN Umgebungsvariable.",
      }),
      statusCode: 401, // Unauthorized
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        "Content-Type": "application/json",
      },
    };
  }

  const queryParams = event.queryStringParameters || {};
  const prompt = queryParams.prompt;

  if (!prompt) {
    return {
      body: JSON.stringify({
        error: "Kein Prompt angegeben.",
      }),
      statusCode: 400, // Bad Request
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        "Content-Type": "application/json",
      },
    };
  }

  const headers = {
    Authorization: `Bearer ${ionosApiToken}`,
    "Content-Type": "application/json",
  };

  const body = {
    model: modelName,
    prompt: prompt,
    size: "1024x1024",
  };

  try {
    console.log("Senden des Bildgenerierungsrequests...");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      timeout: 60000,
    });

    if (!response.ok) {
      console.error(`IONOS API Fehler: ${response.status} ${response.statusText}`);
      return {
        body: JSON.stringify({ error: "Konnte IONOS nicht erreichen" }),
        statusCode: 500, // Internal Server Error
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "*",
          "Content-Type": "application/json",
        },
      };
    }

    const responseData = await response.json();
    const b64Json = { b64_image: responseData.data[0].b64_json };
    console.log("Bild erhalten");

    // Erstelle eine UUID für die Datei
    const fileName = `image${uuidv4().substring(0, 6)}.json`;

    // Lade das JSON auf S3 hoch
    await uploadJson(b64Json, fileName);
    console.log("Upload abgeschlossen");

    const jsonPath = `${jsonBasePath}${fileName}`;
    return {
      body: JSON.stringify({ image_url: jsonPath }),
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error(`Fehler bei der Bildgenerierung: ${error}`);
    return {
      body: JSON.stringify({ error: `Fehler bei der Bildgenerierung: ${error.message}` }),
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        "Content-Type": "application/json",
      },
    };
  }
}

/* This is used to test locally and will not be executed on Scaleway Functions */
if (process.env.NODE_ENV === "test") {
  // Lade und konfiguriere dotenv zuerst
  import("dotenv").then((dotenvModule) => {
    dotenvModule.config();

    // Dann lade das Serverless-Functions-Modul
    import("@scaleway/serverless-functions").then((scw_fnc_node) => {
      scw_fnc_node.serveHandler(handle, 8080);
    });
  });
}
