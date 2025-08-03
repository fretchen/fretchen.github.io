/**
 * A module for generating images and uploading them to S3.
 */
import { generateAndUploadImage } from "./image_service.js";

/**
 * Handler function for the serverless environment.
 * @param {Object} event - The event object.
 * @param {Object} context - The invocation context.
 * @returns {Object} - The HTTP response.
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

    // Extract tokenId from query parameters if present
    // Set to "0" if not present or invalid
    const tokenId = queryParams.tokenId || "0";

    // Extract the size parameter, default to "1024x1024"
    const size = queryParams.size || "1024x1024";

    // Validate the prompt
    if (!prompt) {
      return {
        body: JSON.stringify({ error: "No prompt provided." }),
        statusCode: 400,
        headers,
      };
    }

    // Validate the size parameter
    const validSizes = ["1024x1024", "1792x1024"];
    if (!validSizes.includes(size)) {
      return {
        body: JSON.stringify({
          error: `Invalid image size. Allowed: ${validSizes.join(", ")}`,
        }),
        statusCode: 400,
        headers,
      };
    }

    console.log(`Generating image for prompt: "${prompt}", TokenID: ${tokenId}, Size: ${size}`);

    // Pass prompt, tokenId, and size to the function
    const metadataUrl = await generateAndUploadImage(prompt, tokenId, size);

    return {
      body: JSON.stringify({
        metadata_url: metadataUrl,
        token_id: tokenId,
        size,
      }),
      statusCode: 200,
      headers,
    };
  } catch (error) {
    console.error(`Error during image generation: ${error}`);
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
  // An IIFE (Immediately Invoked Function Expression) with async
  (async () => {
    // Load and configure dotenv
    const dotenvModule = await import("dotenv");
    dotenvModule.config();

    // Load serverless functions and start server
    const scw_fnc_node = await import("@scaleway/serverless-functions");
    scw_fnc_node.serveHandler(handle, 8080);
  })().catch((err) => console.error("Error starting local server:", err));
}
