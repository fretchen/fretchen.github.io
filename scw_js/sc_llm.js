/**
 * A module for generating prompt answers and uploading them to S3. All integrated
 * with a smart contract on the blockchain.
 */
import { callLLMAPI } from "./llm_service.js";

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

    console.log(`Generating answer for prompt: "${prompt}"`);

    // Pass prompt to the function
    const data = await callLLMAPI(prompt);

    return {
      body: data,
      statusCode: 200,
      headers,
    };
  } catch (error) {
    console.error(`Error during answer generation: ${error}`);
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
