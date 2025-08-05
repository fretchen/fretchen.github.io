// @ts-check

const MODEL_NAME = "meta-llama/Llama-3.3-70B-Instruct";
const ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions";

/**
 * Generates an answer based on the prompt
 * @param {string} prompt - The prompt for image generation
 * @returns {Promise<{ content: any, usage: any, model: any, }>} - The generated prompt
 */

export async function callLLMAPI(prompt) {
  const ionosApiToken = process.env.IONOS_API_TOKEN;

  if (!ionosApiToken) {
    throw new Error(
      "API token not found. Please configure the IONOS_API_TOKEN environment variable.",
    );
  }

  if (!prompt) {
    throw new Error("No prompt provided.");
  }
  console.log("Generating answer for prompt:", prompt);
  const promptArray = JSON.parse(prompt);

  const headers = {
    Authorization: `Bearer ${ionosApiToken}`,
    "Content-Type": "application/json",
  };

  const body = {
    model: MODEL_NAME,
    messages: promptArray,
  };

  console.log("Sending answer generation request...");
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    timeout: 60000,
  });

  if (!response.ok) {
    console.error(`IONOS API Error: ${response.status} ${response.statusText}`);
    throw new Error(`Could not reach IONOS: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
    model: data.model,
  };
}

/**
 * Verifies that an ethereum wallet really signed the request
 * @param {Object} auth - The auth object containing the wallet address, signature, etc.
 * @returns {Promise<void>}
 */
export async function verify_wallet(auth) {
  console.log("auth:", auth);
  const { address, signature, message } = auth;

  // 5. Verify the signature using viem
  const { verifyMessage } = await import("viem");

  try {
    const isValid = await verifyMessage({
      address: address,
      message: message,
      signature: signature,
    });

    if (!isValid) {
      throw new Error("Invalid wallet signature.");
    } else {
      console.log("Wallet signature verified successfully.");
    }
  } catch (error) {
    console.error("Signature verification failed:", error);
    throw new Error("Invalid wallet signature.");
  }
}
