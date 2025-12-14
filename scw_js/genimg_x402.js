// Note: x402 npm package available but not used due to:
// 1. Package has export issues (missing "." specifier in package.json)
// 2. API (preparePaymentHeader, verify) doesn't match our simple use case
// 3. Manual implementation is clearer for mint-specific verification
// Future: Could use x402.verify() for additional validation if package is fixed

import { nftAbi } from "./nft_abi.js";
import { getContract, createWalletClient, createPublicClient, http, parseAbiItem } from "viem";
import { optimism } from "viem/chains";
import { generateAndUploadImage, JSON_BASE_PATH } from "./image_service.js";
import { privateKeyToAccount } from "viem/accounts";
export { handle, create402Response, verifyMintPayment };

// Config
const MINT_PRICE = "500000000000000"; // 0.0005 ETH
const GENIMG_CONTRACT_ADDRESS = "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb";

// Transfer-Event für Mint-Detection
const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
);

/**
 * Creates a 402 Payment Required response using x402 package
 * @returns {Object} 402 response with payment instructions
 */
function create402Response() {
  // Manual payment requirements (x402 preparePaymentHeader needs different structure)
  const paymentInfo = {
    scheme: "exact",
    network: "optimism",
    maxAmountRequired: MINT_PRICE,
    recipient: GENIMG_CONTRACT_ADDRESS,
    metadata: {
      resource: "genimg",
      description: "Mint an NFT to generate your AI image",
      paymentType: "contract-call",
      contractAddress: GENIMG_CONTRACT_ADDRESS,
      contractMethod: "mint()",
    },
  };

  return {
    statusCode: 402,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
      "Content-Type": "application/json",
      "X-Payment": JSON.stringify(paymentInfo),
    },
    body: JSON.stringify({
      error: "Payment required",
      message: "Please mint an NFT to generate your image",
      payment: paymentInfo,
    }),
  };
}

/**
 * Verifies mint payment using x402 package + custom mint event extraction
 * @param {Object} publicClient - Viem public client
 * @param {string} txHash - Transaction hash
 * @returns {Object} Verification result with tokenId and payer
 */
async function verifyMintPayment(publicClient, txHash) {
  try {
    // 1. Get transaction receipt first (needed for both x402 and mint event)
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

    if (!receipt || receipt.status !== "success") {
      return {
        valid: false,
        error: "Transaction failed or not found",
      };
    }

    // 2. Get transaction details
    const tx = await publicClient.getTransaction({ hash: txHash });

    // 3. Basic verification (manually for now, x402 verify needs different structure)
    if (tx.to?.toLowerCase() !== GENIMG_CONTRACT_ADDRESS.toLowerCase()) {
      return {
        valid: false,
        error: "Transaction not sent to correct contract",
      };
    }

    if (BigInt(tx.value) < BigInt(MINT_PRICE)) {
      return {
        valid: false,
        error: `Insufficient payment. Expected at least ${MINT_PRICE}, got ${tx.value}`,
      };
    }

    // 3. Custom: Find Transfer event with from=0x0 (Mint)
    const mintLog = receipt.logs.find((log) => {
      if (log.address.toLowerCase() !== GENIMG_CONTRACT_ADDRESS.toLowerCase()) {
        return false;
      }
      // Transfer from 0x0 = Mint
      const transferSignature =
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
      const zeroAddress = "0x0000000000000000000000000000000000000000000000000000000000000000";

      return log.topics[0] === transferSignature && log.topics[1] === zeroAddress;
    });

    if (!mintLog) {
      return {
        valid: false,
        error: "No mint event found in transaction",
      };
    }

    // 4. Extract TokenId and Minter from event
    const mintedTokenId = parseInt(mintLog.topics[3], 16);
    const minterAddress = "0x" + mintLog.topics[2].slice(26);

    // Note: We do manual verification instead of x402.verify() because:
    // - x402 package has export configuration issues
    // - Our mint-specific verification is simpler and more direct

    console.log(
      `✅ Mint verified: tokenId=${mintedTokenId}, minter=${minterAddress}, txHash=${txHash}`,
    );

    return {
      valid: true,
      tokenId: mintedTokenId,
      payer: minterAddress,
      txHash,
    };
  } catch (error) {
    console.error("Payment verification error:", error);
    return {
      valid: false,
      error: `Verification failed: ${error.message}`,
    };
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

/**
 * Generates image and updates NFT metadata
 */
async function generateImageAndUpdateNFT(
  prompt,
  tokenId,
  contract,
  size = "1024x1024",
  mode = "generate",
  referenceImageBase64 = null,
) {
  console.log(
    `🎨 Generating image for tokenId=${tokenId}, mode=${mode}, size=${size}, prompt="${prompt}"`,
  );

  // Generate and upload image
  const metadataUrl = await generateAndUploadImage(
    prompt,
    tokenId,
    "bfl",
    size,
    mode,
    referenceImageBase64,
  );

  // Validate metadata URL
  const baseDomain = new URL(JSON_BASE_PATH);
  const allowedHostnames = [baseDomain.hostname];
  const url = new URL(metadataUrl);
  if (!allowedHostnames.includes(url.hostname)) {
    throw new Error(`Untrusted metadata URL: ${metadataUrl}`);
  }

  // Load metadata to extract image URL
  const metadataResponse = await fetch(metadataUrl);
  if (!metadataResponse.ok) {
    throw new Error(`Failed to load metadata: ${metadataResponse.status}`);
  }

  const metadata = await metadataResponse.json();
  const imageUrl = metadata.image;

  // Update token with new metadata URL
  const txHash = await updateTokenWithImage(contract, tokenId, metadataUrl);

  return {
    metadata_url: metadataUrl,
    image_url: imageUrl,
    transaction_hash: txHash,
  };
}

/**
 * Main handler with x402 payment flow
 */
async function handle(event, context, cb) {
  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
        "Content-Type": "application/json",
      },
      body: "",
    };
  }

  // Only accept POST requests
  if (event.httpMethod !== "POST") {
    return {
      body: JSON.stringify({ error: "Only POST requests are supported" }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      statusCode: 400,
    };
  }

  // Parse request body
  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (error) {
    return {
      body: JSON.stringify({ error: "Invalid JSON body" }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      statusCode: 400,
    };
  }

  // Get payment proof from headers or body
  const paymentProof = event.headers["x-payment"] || body.payment;
  const prompt = body.prompt;

  // Validate prompt
  if (!prompt) {
    return {
      body: JSON.stringify({ error: "No prompt provided" }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      statusCode: 400,
    };
  }

  console.log(`📝 Prompt: "${prompt}"`);

  // Get optional parameters
  const mode = body.mode || "generate";
  const size = body.size || "1024x1024";

  // Validate size parameter
  const validSizes = ["1024x1024", "1792x1024"];
  if (!validSizes.includes(size)) {
    return {
      body: JSON.stringify({
        error: `Invalid size parameter. Must be one of: ${validSizes.join(", ")}`,
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      statusCode: 400,
    };
  }

  // Handle reference image for edit mode
  let referenceImageBase64 = null;
  if (mode === "edit") {
    referenceImageBase64 = body.referenceImage;
    if (!referenceImageBase64) {
      return {
        body: JSON.stringify({ error: "Edit mode requires referenceImage parameter" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        statusCode: 400,
      };
    }
    console.log("🖼️  Reference image provided for editing");
  }

  // ====== x402 PAYMENT FLOW ======

  // No payment proof → Return 402
  if (!paymentProof) {
    console.log("❌ No payment proof provided → Returning 402");
    return create402Response();
  }

  // Parse payment proof
  let txHash;
  try {
    const payment = typeof paymentProof === "string" ? JSON.parse(paymentProof) : paymentProof;
    txHash = payment.txHash || payment.transactionHash || payment.hash;

    if (!txHash) {
      return {
        statusCode: 402,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Invalid payment proof",
          message: "Payment proof must contain txHash",
        }),
      };
    }
  } catch (error) {
    return {
      statusCode: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Invalid payment proof format",
        message: "Could not parse payment proof",
      }),
    };
  }

  console.log(`🔍 Verifying payment: txHash=${txHash}`);

  // Create clients
  const publicClient = createPublicClient({
    chain: optimism,
    transport: http(),
  });

  // Verify mint payment
  const verification = await verifyMintPayment(publicClient, txHash);

  if (!verification.valid) {
    console.log(`❌ Payment verification failed: ${verification.error}`);
    return {
      statusCode: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Payment verification failed",
        message: verification.error,
      }),
    };
  }

  console.log(`✅ Payment verified: tokenId=${verification.tokenId}`);

  // ====== IMAGE GENERATION WITH VERIFIED TOKEN ======

  try {
    // Setup wallet client for contract interaction
    const privateKey = process.env.NFT_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("NFT_WALLET_PRIVATE_KEY not configured");
    }

    const account = privateKeyToAccount(`0x${privateKey}`);
    const walletClient = createWalletClient({
      account,
      chain: optimism,
      transport: http(),
    });

    const contract = getContract({
      address: GENIMG_CONTRACT_ADDRESS,
      abi: nftAbi,
      client: {
        public: publicClient,
        wallet: walletClient,
      },
    });

    // Check if image already updated (only for generate mode)
    if (mode === "generate") {
      const isUpdated = await contract.read.isImageUpdated([BigInt(verification.tokenId)]);
      console.log(`Token ${verification.tokenId} update status: ${isUpdated}`);

      if (isUpdated) {
        return {
          body: JSON.stringify({
            error: "Image already updated",
            message: `Token ${verification.tokenId} has already been updated`,
          }),
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          statusCode: 400,
        };
      }
    }

    // Generate image and update NFT
    const result = await generateImageAndUpdateNFT(
      prompt,
      verification.tokenId,
      contract,
      size,
      mode,
      referenceImageBase64,
    );

    // Get mint price for response
    const mintPrice = await contract.read.mintPrice();

    return {
      body: JSON.stringify({
        ...result,
        tokenId: verification.tokenId,
        payer: verification.payer,
        size,
        mode,
        mintPrice: mintPrice.toString(),
        message: `Image successfully ${mode === "edit" ? "edited" : "generated"} and token updated`,
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error(`❌ Error during image generation or token update: ${error}`);
    return {
      body: JSON.stringify({
        error: "Operation failed",
        message: error.message,
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      statusCode: 500,
    };
  }
}

/* This is used to test locally and will not be executed on Scaleway Functions */
if (process.env.NODE_ENV === "test" && !process.env.CI) {
  // Only load dotenv if not in CI environment
  import("dotenv").then((dotenv) => {
    dotenv.config();

    // Erstelle eine eigene Fastify-Instanz für lokale Tests mit erhöhtem bodyLimit
    import("fastify").then((fastifyModule) => {
      const fastify = fastifyModule.default({
        bodyLimit: 10 * 1024 * 1024, // 10MB für große Base64-codierte Referenzbilder
      });

      // CORS Setup
      import("@fastify/cors").then((corsModule) => {
        fastify.register(corsModule.default, {
          origin: true,
          methods: ["GET", "POST", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization", "X-Payment"],
        });

        // URL Data Plugin für Query Parameter
        import("@fastify/url-data").then((urlDataModule) => {
          fastify.register(urlDataModule.default);

          // Content Type Parser für verschiedene Formate
          fastify.addContentTypeParser(
            "text/json",
            { parseAs: "string" },
            fastify.defaultTextParser,
          );
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
          fastify.listen({ port: 8081, host: "0.0.0.0" }, (err, address) => {
            if (err) {
              console.error("Failed to start server:", err);
              process.exit(1);
            }
            console.log(`🚀 x402 Local Fastify server listening at ${address}`);
          });
        });
      });
    });
  });
}
