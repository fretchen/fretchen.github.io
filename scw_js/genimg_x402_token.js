// x402 v2 Token Payment Implementation for GenImg
// Uses official @x402/core and @x402/evm packages for payment handling

import { nftAbi } from "./nft_abi.js";
import {
  getContract,
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  parseAbiItem,
} from "viem";
import { optimism } from "viem/chains";
import { generateAndUploadImage, JSON_BASE_PATH } from "./image_service.js";
import { privateKeyToAccount } from "viem/accounts";
import {
  createResourceServer,
  createPaymentRequirements,
  create402Response,
  extractPaymentPayload,
  createSettlementHeaders,
  NETWORK_CONFIG,
} from "./x402_server.js";

// Re-export x402 functions for backward compatibility with tests
export { handle, create402Response };

// Config
const GENIMG_CONTRACT_ADDRESS = "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb";
const MINT_PRICE = parseEther("0.01"); // 0.01 ETH for minting
const USDC_PAYMENT_AMOUNT = "1000"; // 0.001 USDC (6 decimals)

// Transfer-Event for extracting tokenId from mint
const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
);

// Create x402 Resource Server instance (shared across requests)
const resourceServer = createResourceServer();

/**
 * Mints NFT to server wallet and transfers to client
 * Option A: mint + transfer (works with current GenImNFTv4)
 * @param {Object} contract - NFT contract instance
 * @param {Object} publicClient - Viem public client
 * @param {string} clientAddress - Client's wallet address
 * @param {string} metadataUrl - Token metadata URL
 * @returns {Object} {tokenId, mintTxHash, transferTxHash}
 */
async function mintNFTToClient(contract, publicClient, clientAddress, metadataUrl) {
  console.log(`🎨 Minting NFT to server, then transferring to ${clientAddress}`);

  // Step 1: Mint to server wallet
  const mintTxHash = await contract.write.safeMint([metadataUrl, true], {
    value: MINT_PRICE,
  });

  console.log(`📝 Mint transaction submitted: ${mintTxHash}`);

  // Wait for mint confirmation
  const mintReceipt = await publicClient.waitForTransactionReceipt({
    hash: mintTxHash,
  });

  if (mintReceipt.status !== "success") {
    throw new Error("Mint transaction failed");
  }

  // Extract tokenId from Transfer event (using viem's decodeEventLog)
  const mintLog = mintReceipt.logs.find((log) => {
    if (log.address.toLowerCase() !== GENIMG_CONTRACT_ADDRESS.toLowerCase()) {
      return false;
    }
    // Check if this is a Transfer event from zero address (mint)
    const zeroAddress = "0x0000000000000000000000000000000000000000000000000000000000000000";
    return log.topics[0] === TRANSFER_EVENT.id && log.topics[1] === zeroAddress;
  });

  if (!mintLog) {
    throw new Error("Could not find mint event in transaction");
  }

  const tokenId = parseInt(mintLog.topics[3], 16);
  console.log(`✅ NFT minted: tokenId=${tokenId}`);

  // Step 2: Transfer to client
  // Derive server wallet address from private key
  const privateKey = process.env.NFT_WALLET_PRIVATE_KEY;
  const account = privateKeyToAccount(`0x${privateKey}`);
  const serverWallet = account.address;

  const transferTxHash = await contract.write.safeTransferFrom([
    serverWallet,
    clientAddress,
    BigInt(tokenId),
  ]);

  console.log(`📤 Transfer transaction submitted: ${transferTxHash}`);

  // Wait for transfer confirmation
  const transferReceipt = await publicClient.waitForTransactionReceipt({
    hash: transferTxHash,
  });

  if (transferReceipt.status !== "success") {
    throw new Error("Transfer transaction failed");
  }

  console.log(`✅ NFT transferred to client: tokenId=${tokenId}`);

  return {
    tokenId,
    mintTxHash,
    transferTxHash,
  };
}

/**
 * Generates image and mints NFT
 */
async function generateImageAndMintNFT(
  prompt,
  contract,
  publicClient,
  clientAddress,
  size = "1024x1024",
  mode = "generate",
  referenceImageBase64 = null,
) {
  console.log(`🎨 Generating image: mode=${mode}, size=${size}, prompt="${prompt}"`);

  // Use temporary tokenId for image generation (we'll get real one after mint)
  const tempTokenId = Date.now();

  // Generate and upload image
  const metadataUrl = await generateAndUploadImage(
    prompt,
    tempTokenId,
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

  console.log(`✅ Image generated: ${imageUrl}`);

  // Mint NFT to client
  const mintResult = await mintNFTToClient(contract, publicClient, clientAddress, metadataUrl);

  return {
    metadata_url: metadataUrl,
    image_url: imageUrl,
    tokenId: mintResult.tokenId,
    mintTxHash: mintResult.mintTxHash,
    transferTxHash: mintResult.transferTxHash,
  };
}

/**
 * Main handler with x402 v2 token payment flow
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
  } catch (_error) {
    return {
      body: JSON.stringify({ error: "Invalid JSON body" }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      statusCode: 400,
    };
  }

  // Extract payment payload using x402 helper (supports v1 and v2 headers)
  const paymentPayload = extractPaymentPayload(event.headers) || body.payment;
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

  // ====== x402 v2 TOKEN PAYMENT FLOW ======

  // No payment payload → Return 402 Payment Required using x402 v2 API
  if (!paymentPayload) {
    console.log("❌ No payment provided → Returning 402");

    // Get server wallet address
    const privateKey = process.env.NFT_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("NFT_WALLET_PRIVATE_KEY not configured");
    }
    const account = privateKeyToAccount(`0x${privateKey}`);
    const serverWallet = account.address;

    // Create payment requirements using x402 helper
    const paymentRequirements = createPaymentRequirements({
      resourceUrl: event.path || process.env.GENIMG_SERVICE_URL || "https://api.example.com/genimg",
      description: "AI Image Generation with NFT Certificate",
      mimeType: "application/json",
      amount: USDC_PAYMENT_AMOUNT,
      payTo: serverWallet,
      // Default: accepts all supported networks (Optimism + Base, mainnet + testnet)
    });

    return create402Response(paymentRequirements);
  }

  console.log("🔍 Payment received, verifying...");

  // Get server wallet address for verification
  const privateKey = process.env.NFT_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Server configuration error",
        message: "NFT_WALLET_PRIVATE_KEY not configured",
      }),
    };
  }
  const account = privateKeyToAccount(`0x${privateKey}`);
  const serverWallet = account.address;

  // Extract network from payment payload
  const clientNetwork =
    paymentPayload?.payload?.authorization?.network ||
    paymentPayload?.accepted?.network ||
    "eip155:10";

  const networkConfig = NETWORK_CONFIG[clientNetwork];
  if (!networkConfig) {
    console.error(`❌ Unsupported network: ${clientNetwork}`);
    return {
      statusCode: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Payment verification failed",
        reason: "unsupported_network",
        network: clientNetwork,
      }),
    };
  }

  console.log(`📍 Client selected network: ${networkConfig.name} (${clientNetwork})`);

  // Build payment requirements for the selected network
  const paymentRequirements = {
    scheme: "exact",
    network: clientNetwork,
    amount: USDC_PAYMENT_AMOUNT,
    asset: networkConfig.usdc,
    payTo: serverWallet,
    maxTimeoutSeconds: 60,
    extra: {
      name: networkConfig.usdcName,
      version: networkConfig.usdcVersion,
    },
  };

  // Verify payment using x402 Resource Server
  let verification;
  try {
    verification = await resourceServer.verifyPayment(paymentPayload, paymentRequirements);
  } catch (error) {
    console.error(`❌ Payment verification error:`, error);
    return {
      statusCode: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Payment verification failed",
        reason: "facilitator_error",
        details: error.message,
      }),
    };
  }

  if (!verification.isValid) {
    console.log(`❌ Payment verification failed: ${verification.invalidReason}`);
    return {
      statusCode: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Payment verification failed",
        reason: verification.invalidReason,
        payer: verification.payer,
      }),
    };
  }

  const clientAddress = verification.payer;
  console.log(`✅ Payment verified for client: ${clientAddress}`);

  // ====== IMAGE GENERATION & NFT MINTING ======

  try {
    // Setup wallet client for NFT minting
    const privateKey = process.env.NFT_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("NFT_WALLET_PRIVATE_KEY not configured");
    }

    const account = privateKeyToAccount(`0x${privateKey.replace("0x", "")}`);
    const publicClient = createPublicClient({
      chain: optimism,
      transport: http(),
    });

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

    // Generate image and mint NFT
    const result = await generateImageAndMintNFT(
      prompt,
      contract,
      publicClient,
      clientAddress,
      size,
      mode,
      referenceImageBase64,
    );

    // Settle payment via x402 Resource Server (async, don't wait)
    resourceServer
      .settlePayment(paymentPayload, paymentRequirements)
      .then((settlement) => {
        console.log(`✅ Payment settled:`, settlement);
      })
      .catch((error) => {
        console.error(`⚠️ Settlement failed (non-critical): ${error.message}`);
        // Note: Image already generated and NFT minted, settlement failure is logged but doesn't fail request
      });

    // Get mint price for response
    const mintPrice = await contract.read.mintPrice();

    // Create settlement headers (for client confirmation)
    const settlementHeaders = createSettlementHeaders({
      success: true,
      payer: clientAddress,
      network: clientNetwork,
    });

    return {
      body: JSON.stringify({
        ...result,
        payer: clientAddress,
        network: clientNetwork,
        size,
        mode,
        mintPrice: mintPrice.toString(),
        message: `Image successfully ${mode === "edit" ? "edited" : "generated"} and NFT minted`,
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        ...settlementHeaders,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error(`❌ Error during operation: ${error}`);
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

    // Create Fastify instance for local testing with increased bodyLimit
    import("fastify").then((fastifyModule) => {
      const fastify = fastifyModule.default({
        bodyLimit: 10 * 1024 * 1024, // 10MB for large Base64-encoded reference images
      });

      // CORS Setup
      import("@fastify/cors").then((corsModule) => {
        fastify.register(corsModule.default, {
          origin: true,
          methods: ["GET", "POST", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization", "X-Payment"],
        });

        // URL Data Plugin for Query Parameters
        import("@fastify/url-data").then((urlDataModule) => {
          fastify.register(urlDataModule.default);

          // Content Type Parser for various formats
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

          // Route for all HTTP methods except OPTIONS (CORS handles that)
          fastify.route({
            method: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            url: "/*",
            handler: async (request, reply) => {
              try {
                // Emulate Scaleway Event Format
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

                // Call handler function
                const result = await handle(event, context);

                // Set response based on handler result
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

          // Start server
          fastify.listen({ port: 8082, host: "0.0.0.0" }, (err, address) => {
            if (err) {
              console.error("Failed to start server:", err);
              process.exit(1);
            }
            console.log(`🚀 x402 v2 Token Payment Local Server listening at ${address}`);
            console.log(`   Using @x402/core and @x402/evm packages`);
            console.log(`   NFT Contract: ${GENIMG_CONTRACT_ADDRESS}`);
            console.log(`   Supported Networks: Optimism + Base (Mainnet + Testnet)`);
          });
        });
      });
    });
  });
}
