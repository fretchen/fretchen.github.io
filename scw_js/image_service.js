/**
 * Shared module for image generation and S3 upload
 */
// Only load dotenv if .env file exists and not in CI environment
if (process.env.NODE_ENV === "test" && !process.env.CI) {
  try {
    // Since we're in an ESM context, we need to use dynamic import
    await import("dotenv").then((dotenv) => {
      dotenv.config();
      console.log("Environment variables loaded from .env");
    });
  } catch (error) {
    console.error("Error loading dotenv:", error);
  }
}

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

// Provider configurations
const PROVIDER_CONFIGS = {
  ionos: {
    endpoint: "https://openai.inference.de-txl.ionos.com/v1/images/generations",
    model: "black-forest-labs/FLUX.1-schnell",
    tokenEnvVar: "IONOS_API_TOKEN",
  },
  bfl: {
    endpoint: "https://api.bfl.ml/v1/flux-pro-1.1",
    model: "flux-pro-1.1",
    tokenEnvVar: "BFL_API_TOKEN",
  },
};

export const JSON_BASE_PATH = "https://my-imagestore.s3.nl-ams.scw.cloud/";
const BUCKET_NAME = "my-imagestore";

/**
 * Generates a random string for filenames
 */
function getRandomString(length = 6) {
  return randomBytes(length).toString("hex");
}

/**
 * Converts a Base64 string to a Buffer for binary upload
 * @param {string} base64String - The Base64 string to convert
 * @returns {Buffer} - Binary buffer
 */
function base64ToBuffer(base64String) {
  // Remove potential data URL prefix
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64Data, "base64");
}

/**
 * Uploads any data object to S3.
 * @param {Object|string|Buffer} data - The data to upload
 * @param {string} fileName - The filename to save the data as
 * @param {string} contentType - MIME type of the content
 * @returns {Promise<string>} - Path to the uploaded file
 */
export async function uploadToS3(data, fileName, contentType = "application/json") {
  const accessKey = process.env.SCW_ACCESS_KEY;
  const secretKey = process.env.SCW_SECRET_KEY;

  // Prepare data for upload based on type
  let dataToUpload;
  if (Buffer.isBuffer(data)) {
    dataToUpload = data;
  } else if (typeof data === "object") {
    dataToUpload = JSON.stringify(data);
  } else {
    dataToUpload = data;
  }

  // Create the S3 client
  const s3Client = new S3Client({
    region: "nl-ams",
    endpoint: "https://s3.nl-ams.scw.cloud",
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  // Configure the upload
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: dataToUpload,
    ContentType: contentType,
    ACL: "public-read",
  };

  // Perform the upload
  try {
    await s3Client.send(new PutObjectCommand(params));
    console.log(`Successfully uploaded ${fileName}`);
    return `${JSON_BASE_PATH}${fileName}`;
  } catch (error) {
    console.error(`Error uploading file: ${error}`);
    throw error;
  }
}

/**
 * Generates an image using IONOS API
 * @param {string} prompt - The prompt for image generation
 * @param {string} size - Image size
 * @returns {Promise<string>} - Base64 encoded image
 */
async function generateImageIONOS(prompt, size) {
  const config = PROVIDER_CONFIGS.ionos;
  const apiToken = process.env[config.tokenEnvVar];

  if (!apiToken) {
    throw new Error(
      `API token not found. Please configure the ${config.tokenEnvVar} environment variable.`,
    );
  }

  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  const body = {
    model: config.model,
    prompt,
    size,
  };

  console.log("Sending IONOS image generation request...");
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    timeout: 60000,
  });

  if (!response.ok) {
    console.error(`IONOS API Error: ${response.status} ${response.statusText}`);
    throw new Error(`Could not reach IONOS: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json();
  return responseData.data[0].b64_json;
}

/**
 * Generates an image using BFL API
 * @param {string} prompt - The prompt for image generation
 * @param {string} size - Image size
 * @returns {Promise<string>} - Base64 encoded image
 */
async function generateImageBFL(prompt, size) {
  const config = PROVIDER_CONFIGS.bfl;
  const apiToken = process.env[config.tokenEnvVar];

  if (!apiToken) {
    throw new Error(
      `API token not found. Please configure the ${config.tokenEnvVar} environment variable.`,
    );
  }

  const headers = {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };

  const body = {
    prompt,
    width: size === "1792x1024" ? 1792 : 1024,
    height: size === "1792x1024" ? 1024 : 1024,
  };

  console.log("Sending BFL image generation request...");
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    timeout: 60000,
  });

  if (!response.ok) {
    console.error(`BFL API Error: ${response.status} ${response.statusText}`);
    throw new Error(`Could not reach BFL: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json();
  return responseData.result.sample; // BFL returns image in different format
}

/**
 * Generates an image from the specified provider
 * @param {string} prompt - The prompt for image generation
 * @param {string} provider - The provider to use ('ionos' or 'bfl')
 * @param {string} size - Image size
 * @returns {Promise<string>} - Base64 encoded image
 */
async function generateImageFromProvider(prompt, provider, size) {
  switch (provider) {
    case "ionos":
      return generateImageIONOS(prompt, size);
    case "bfl":
      return generateImageBFL(prompt, size);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Generates an image based on the prompt and uploads it to S3 along with ERC-721 metadata
 * @param {string} prompt - The prompt for image generation
 * @param {string|number} tokenId - The NFT token ID to include in metadata
 * @param {string} provider - The image generation provider ('ionos' or 'bfl')
 * @param {string} size - Image size, either "1024x1024" or "1792x1024"
 * @returns {Promise<string>} - Path to the generated metadata file
 */
export async function generateAndUploadImage(
  prompt,
  tokenId = "unknown",
  provider,
  size = "1024x1024",
) {
  if (!prompt) {
    throw new Error("No prompt provided.");
  }

  // Validate size parameter
  const validSizes = ["1024x1024", "1792x1024"];
  if (!validSizes.includes(size)) {
    throw new Error(`Invalid size parameter. Must be one of: ${validSizes.join(", ")}`);
  }

  // Generate image using the specified provider
  const imageBase64 = await generateImageFromProvider(prompt, provider, size);
  console.log("Image received from", provider);

  // Upload the image as PNG in the images subfolder
  const imageFileName = `images/image_${tokenId}_${getRandomString()}.png`;
  const imageBuffer = base64ToBuffer(imageBase64);
  const imageUrl = await uploadToS3(imageBuffer, imageFileName, "image/png");

  // Create and upload ERC-721 compliant metadata in the metadata subfolder
  const metadataFileName = `metadata/metadata_${tokenId}_${getRandomString()}.json`;

  // Create metadata following ERC-721 standard
  const metadata = {
    name: `AI Generated Art #${tokenId}`,
    description: `AI generated artwork based on the prompt: "${prompt}"`,
    image: imageUrl, // Reference to the PNG image
    attributes: [
      {
        trait_type: "Prompt",
        value: prompt,
      },
      {
        trait_type: "Model",
        value: MODEL_NAME,
      },
      {
        trait_type: "Image Size",
        value: size,
      },
      {
        trait_type: "Creation Date",
        value: new Date().toISOString(),
      },
    ],
  };

  // Upload the metadata
  const metadataUrl = await uploadToS3(metadata, metadataFileName);

  console.log(`Image and metadata uploaded successfully for token ${tokenId}`);

  // Return the metadata URL (which contains a reference to the image)
  return metadataUrl;
}
