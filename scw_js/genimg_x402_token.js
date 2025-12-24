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
import { generateAndUploadImage, JSON_BASE_PATH } from "./image_service.js";
import { privateKeyToAccount } from "viem/accounts";
import {
  createResourceServer,
  createPaymentRequirements,
  create402Response,
  extractPaymentPayload,
  createSettlementHeaders,
} from "./x402_server.js";
import {
  getGenImgContractConfig,
  getViemChain,
  getUSDCConfig,
  validatePaymentNetwork,
  getExpectedNetwork,
  getChainNameFromEIP155,
} from "./getChain.js";

// Re-export x402 functions for backward compatibility with tests
export { handle, create402Response };

// Config
const USDC_PAYMENT_AMOUNT = "1000"; // 0.001 USDC (6 decimals)
const GAS_BUFFER = parseEther("0.00001"); // ~$0.02 buffer for gas on L2

// Transfer-Event for extracting tokenId from mint
const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
);

/**
 * Pre-flight checks before starting expensive operations
 * Validates server wallet has sufficient balance for minting
 * @param {Object} publicClient - Viem public client
 * @param {string} serverAddress - Server wallet address
 * @param {bigint} mintPrice - Required ETH for minting (from contract)
 * @param {string} chainName - Human-readable chain name
 * @returns {Promise<{success: boolean, error?: string, details?: any}>}
 */
async function preFlightChecks(publicClient, serverAddress, mintPrice, chainName) {
  try {
    // Check: Server wallet balance
    const balance = await publicClient.getBalance({ address: serverAddress });
    const requiredBalance = mintPrice + GAS_BUFFER;

    if (balance < requiredBalance) {
      const balanceEth = parseFloat(balance.toString()) / 1e18;
      const requiredEth = parseFloat(requiredBalance.toString()) / 1e18;
      return {
        success: false,
        error: "insufficient_server_funds",
        details: {
          message: `Server wallet has insufficient funds on ${chainName}`,
          serverAddress,
          currentBalance: `${balanceEth.toFixed(6)} ETH`,
          requiredBalance: `${requiredEth.toFixed(6)} ETH`,
          deficit: `${(requiredEth - balanceEth).toFixed(6)} ETH`,
          chain: chainName,
        },
      };
    }

    console.log(`✅ Pre-flight checks passed on ${chainName}`);
    console.log(`   Server balance: ${(parseFloat(balance.toString()) / 1e18).toFixed(6)} ETH`);

    return { success: true };
  } catch (error) {
    console.error(`❌ Pre-flight check error:`, error);
    return {
      success: false,
      error: "preflight_check_failed",
      details: {
        message: `Failed to perform pre-flight checks on ${chainName}`,
        errorDetails: error.message,
        chain: chainName,
      },
    };
  }
}

// Create x402 Resource Server instance (shared across requests)
const resourceServer = createResourceServer();

/**
 * Mints NFT to server wallet and transfers to client
 * Option A: mint + transfer (works with current GenImNFTv4)
 * @param {Object} contract - NFT contract instance
 * @param {Object} publicClient - Viem public client
 * @param {string} clientAddress - Client's wallet address
 * @param {string} metadataUrl - Token metadata URL
 * @param {string} contractAddress - NFT contract address for event filtering
 * @param {string} serverWallet - Server wallet address for transfer
 * @param {bigint} mintPrice - Mint price from contract
 * @returns {Object} {tokenId, mintTxHash, transferTxHash}
 */
async function mintNFTToClient(
  contract,
  publicClient,
  clientAddress,
  metadataUrl,
  contractAddress,
  serverWallet,
  mintPrice,
) {
  console.log(`🎨 Minting NFT to server, then transferring to ${clientAddress}`);

  // Step 1: Mint to server wallet
  // Use single-parameter safeMint(uri) - the contract deployed uses this version
  const mintTxHash = await contract.write.safeMint([metadataUrl], {
    value: mintPrice,
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
    if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
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
 * @param {boolean} useMockImage - If true, use mock image (test mode, no BFL costs)
 * @param {bigint} mintPrice - Mint price from contract
 */
async function generateImageAndMintNFT(
  prompt,
  contract,
  publicClient,
  clientAddress,
  contractAddress,
  serverWallet,
  size = "1024x1024",
  mode = "generate",
  referenceImageBase64 = null,
  useMockImage = false,
  mintPrice = BigInt(0),
) {
  console.log(`🎨 Generating image: mode=${mode}, size=${size}, prompt="${prompt}"`);

  // Use temporary tokenId for image generation (we'll get real one after mint)
  const tempTokenId = Date.now();

  let metadataUrl;
  let imageUrl;

  if (useMockImage) {
    // Mock image generation for test mode (no BFL API or S3 costs)
    console.log("🎭 Using mock image (test mode)");

    // Use dummy URLs for test mode
    imageUrl = "https://via.placeholder.com/1024x1024.png?text=Test+Image";
    metadataUrl = `https://example.com/metadata/test_${tempTokenId}.json`;
  } else {
    // Real image generation via BFL API
    metadataUrl = await generateAndUploadImage(
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
    imageUrl = metadata.image;
  }

  console.log(`✅ Image ${useMockImage ? "mocked" : "generated"}: ${imageUrl}`);

  // Mint NFT to client
  const mintResult = await mintNFTToClient(
    contract,
    publicClient,
    clientAddress,
    metadataUrl,
    contractAddress,
    serverWallet,
    mintPrice,
  );

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

  // Get server wallet configuration (needed for all payment operations)
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
  const account = privateKeyToAccount(`0x${privateKey.replace(/^0x/, "")}`);
  const serverWallet = account.address;

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

  // Extract test mode flag from body
  const sepoliaTest = body.sepoliaTest === true;
  if (sepoliaTest) {
    console.log("🧪 Test mode enabled: Sepolia only, mock image generation");
  }

  // ====== x402 v2 TOKEN PAYMENT FLOW ======

  // No payment payload → Return 402 Payment Required using x402 v2 API
  if (!paymentPayload) {
    console.log("❌ No payment provided → Returning 402");

    // 🎯 Network selection based on test mode
    // Test mode: Only Sepolia testnet (no costs)
    // Production: Only Optimism Mainnet (real payments)
    const networks = sepoliaTest ? ["eip155:11155420"] : ["eip155:10"];

    if (sepoliaTest) {
      console.log("   Restricting to Sepolia testnet");
    } else {
      console.log("   Production mode: Optimism Mainnet only");
    }

    // Create payment requirements using x402 helper
    const paymentRequirements = createPaymentRequirements({
      resourceUrl: event.path || process.env.GENIMG_SERVICE_URL || "https://api.example.com/genimg",
      description: "AI Image Generation with NFT Certificate",
      mimeType: "application/json",
      amount: USDC_PAYMENT_AMOUNT,
      payTo: serverWallet,
      networks, // Test: ["eip155:11155420"], Prod: ["eip155:10"]
    });

    return create402Response(paymentRequirements);
  }

  console.log("🔍 Payment received, verifying...");

  // Extract and validate network from payment payload
  const clientNetwork = paymentPayload?.accepted?.network;
  console.log(`🌐 Payment payload network: ${clientNetwork}`);

  const networkValidation = validatePaymentNetwork(clientNetwork, sepoliaTest);
  if (!networkValidation.valid) {
    console.error(`❌ Network validation failed: ${networkValidation.reason}`);
    return {
      statusCode: 402,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Payment verification failed",
        reason: networkValidation.reason,
        expected: networkValidation.expected,
        received: networkValidation.received,
      }),
    };
  }

  // Get configurations for validated network
  const usdcConfig = getUSDCConfig(clientNetwork);
  const contractAddress = getGenImgContractConfig(clientNetwork).address;
  console.log(`📍 Client selected network: ${usdcConfig.name} (${clientNetwork})`);

  // Build payment requirements for the selected network
  const paymentRequirements = {
    scheme: "exact",
    network: clientNetwork,
    amount: USDC_PAYMENT_AMOUNT,
    asset: usdcConfig.address,
    payTo: serverWallet,
    maxTimeoutSeconds: 60,
    extra: {
      name: usdcConfig.usdcName,
      version: usdcConfig.usdcVersion,
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
    // Get chain from payment network (buyer determines the chain!)
    const viemChain = getViemChain(clientNetwork);
    const chainName = getChainNameFromEIP155(clientNetwork);
    console.log(`🔗 Using chain: ${chainName} (${clientNetwork})`);

    const publicClient = createPublicClient({
      chain: viemChain,
      transport: http(),
    });

    const walletClient = createWalletClient({
      account,
      chain: viemChain,
      transport: http(),
    });

    const contract = getContract({
      address: contractAddress,
      abi: nftAbi,
      client: {
        public: publicClient,
        wallet: walletClient,
      },
    });

    // Read mint price from contract (not hardcoded!)
    const mintPrice = await contract.read.mintPrice();
    console.log(
      `💰 Mint price from contract: ${(parseFloat(mintPrice.toString()) / 1e18).toFixed(6)} ETH`,
    );

    // ====== PRE-FLIGHT CHECKS ======
    // Validate before starting expensive operations (image generation)
    console.log(`🔍 Running pre-flight checks...`);
    const preFlightResult = await preFlightChecks(
      publicClient,
      account.address,
      mintPrice,
      chainName,
    );

    if (!preFlightResult.success) {
      console.error(`❌ Pre-flight check failed: ${preFlightResult.error}`);
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Service configuration error",
          reason: preFlightResult.error,
          ...preFlightResult.details,
        }),
      };
    }

    // Generate image and mint NFT
    const result = await generateImageAndMintNFT(
      prompt,
      contract,
      publicClient,
      clientAddress,
      contractAddress,
      serverWallet,
      size,
      mode,
      referenceImageBase64,
      sepoliaTest, // useMockImage in test mode
      mintPrice,
    );

    // Settlement is async, don't wait)
    resourceServer
      .settlePayment(paymentPayload, paymentRequirements)
      .then((settlement) => {
        console.log(`✅ Payment settled:`, settlement);
      })
      .catch((error) => {
        console.error(`⚠️ Settlement failed (non-critical): ${error.message}`);
        // Note: Image already generated and NFT minted, settlement failure is logged but doesn't fail request
      });

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
            console.log(`   NFT Contracts:`);
            console.log(
              `     - Optimism Mainnet: 0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb (Production)`,
            );
            console.log(
              `     - Optimism Sepolia: 0x10827cC42a09D0BAD2d43134C69F0e776D853D85 (Test)`,
            );
            console.log(`   Network Policy:`);
            console.log(`     - Production: Optimism Mainnet only`);
            console.log(`     - Test mode (sepoliaTest=true): Sepolia only + mock images`);
          });
        });
      });
    });
  });
}
