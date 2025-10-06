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

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  let body;
  if (event.httpMethod === "POST") {
    // Body parsen (JSON-String zu Objekt)
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } else {
    return {
      body: JSON.stringify({ error: "Only POST requests are supported" }),
      headers,
      statusCode: 400,
    };
  }

  // Extrahiere Parameter aus dem Body
  const prompt = body.prompt;
  const tokenId = body.tokenId || "0";
  const size = body.size || "1024x1024";
  const provider = body.provider || "ionos";
  const mode = body.mode || "generate";
  const referenceImage = body.referenceImage || null;

  try {
    console.log(`Prompt: ${prompt}`);
    console.log(`TokenId: ${tokenId}`);
    console.log(`Mode: ${mode}`);
    console.log(`Size: ${size}`);
    console.log(`Provider: ${provider}`);
    if (referenceImage) {
      console.log(`Reference image provided for editing`);
    }

    // Validiere den Prompt
    if (!prompt) {
      return {
        body: JSON.stringify({ error: "Kein Prompt angegeben." }),
        statusCode: 400,
        headers,
      };
    }

    // Validiere Edit Mode Anforderungen
    if (mode === "edit" && !referenceImage) {
      return {
        body: JSON.stringify({ error: "Edit mode requires referenceImage parameter" }),
        statusCode: 400,
        headers,
      };
    }

    // Validiere mode Parameter
    const validModes = ["generate", "edit"];
    if (!validModes.includes(mode)) {
      return {
        body: JSON.stringify({
          error: `Ungültiger Mode. Erlaubt sind: ${validModes.join(", ")}`,
        }),
        statusCode: 400,
        headers,
      };
    }

    // Validiere den provider Parameter
    const validProviders = ["ionos", "bfl"];
    if (!validProviders.includes(provider)) {
      return {
        body: JSON.stringify({
          error: `Ungültiger Provider. Erlaubt sind: ${validProviders.join(", ")}`,
        }),
        statusCode: 400,
        headers,
      };
    }

    // Validiere den size Parameter
    const validSizes = ["1024x1024", "1792x1024"];
    if (!validSizes.includes(size)) {
      return {
        body: JSON.stringify({
          error: `Ungültige Bildgröße. Erlaubt sind: ${validSizes.join(", ")}`,
        }),
        statusCode: 400,
        headers,
      };
    }

    console.log(
      `Generiere/Bearbeite Bild für Prompt: "${prompt}", TokenID: ${tokenId}, Größe: ${size}, Provider: ${provider}, Mode: ${mode}`,
    );

    // Übergebe Prompt, tokenId, provider, size, mode und referenceImage an die Funktion
    const metadataUrl = await generateAndUploadImage(
      prompt,
      tokenId,
      provider,
      size,
      mode,
      referenceImage,
    );

    return {
      body: JSON.stringify({
        metadata_url: metadataUrl,
        token_id: tokenId,
        size,
        provider,
        mode,
        message: mode === "edit" ? "Bild erfolgreich bearbeitet" : "Bild erfolgreich generiert",
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

    // Erstelle eine eigene Fastify-Instanz für lokale Tests mit erhöhtem bodyLimit
    const fastify = (await import("fastify")).default({
      bodyLimit: 10 * 1024 * 1024, // 10MB für große Base64-codierte Referenzbilder
    });

    // CORS Setup
    await fastify.register(await import("@fastify/cors"), {
      origin: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    });

    // URL Data Plugin für Query Parameter
    await fastify.register(await import("@fastify/url-data"));

    // Content Type Parser für verschiedene Formate
    fastify.addContentTypeParser("text/json", { parseAs: "string" }, fastify.defaultTextParser);
    fastify.addContentTypeParser(
      "application/x-www-form-urlencoded",
      { parseAs: "string" },
      fastify.defaultTextParser,
    );
    fastify.addContentTypeParser(
      "application/json",
      { parseAs: "string" },
      fastify.defaultTextParser,
    );

    // Route für alle HTTP-Methoden außer OPTIONS (CORS übernimmt das)
    fastify.route({
      method: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      url: "/*",
      handler: async (request, reply) => {
        try {
          // Emuliere das Scaleway Event Format
          const event = {
            httpMethod: request.method,
            headers: request.headers,
            body: request.body,
            path: request.url,
            queryStringParameters: request.query,
          };

          const context = {
            memoryLimitInMb: 128,
            functionName: "handle",
            functionVersion: "",
          };

          // Rufe die Handler-Funktion auf
          const result = await handle(event, context);

          // Setze Response basierend auf dem Handler-Ergebnis
          const statusCode = result.statusCode || 200;
          const headers = result.headers || {};
          const body = result.body || "";

          reply.status(statusCode);
          for (const [key, value] of Object.entries(headers)) {
            reply.header(key, value);
          }

          return body;
        } catch (error) {
          console.error("Handler error:", error);
          reply.status(500).send({ error: error.message });
        }
      },
    });

    // Server starten
    try {
      await fastify.listen({ port: 8080, host: "0.0.0.0" });
      console.log("🚀 Local Fastify server listening at http://localhost:8080");
    } catch (err) {
      console.error("❌ Failed to start server:", err);
      process.exit(1);
    }
  })().catch((err) => console.error("❌ Fehler beim Starten des lokalen Servers:", err));
}
