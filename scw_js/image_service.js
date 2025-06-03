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

// Configuration constants
const MODEL_NAME = "black-forest-labs/FLUX.1-schnell";
const ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/images/generations";
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
 * Generates an image based on the prompt and uploads it to S3 along with ERC-721 metadata
 * @param {string} prompt - The prompt for image generation
 * @param {string|number} tokenId - The NFT token ID to include in metadata
 * @param {string} size - Image size, either "1024x1024" or "1792x1024"
 * @returns {Promise<string>} - Path to the generated metadata file
 */
export async function generateAndUploadImage(prompt, tokenId = "unknown", size = "1024x1024") {
  const ionosApiToken = process.env.IONOS_API_TOKEN;

  if (!ionosApiToken) {
    throw new Error(
      "API token not found. Please configure the IONOS_API_TOKEN environment variable.",
    );
  }

  if (!prompt) {
    throw new Error("No prompt provided.");
  }

  // Validate size parameter
  const validSizes = ["1024x1024", "1792x1024"];
  if (!validSizes.includes(size)) {
    throw new Error(`Invalid size parameter. Must be one of: ${validSizes.join(", ")}`);
  }

  const headers = {
    Authorization: `Bearer ${ionosApiToken}`,
    "Content-Type": "application/json",
  };

  const body = {
    model: MODEL_NAME,
    prompt,
    size,
  };

  console.log("Sending image generation request...");
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

  const responseData = await response.json();
  const imageBase64 = responseData.data[0].b64_json;
  console.log("Image received");

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
