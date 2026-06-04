if (process.env.NODE_ENV === "test" && !process.env.CI) {
  try {
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

type Provider = "ionos" | "bfl";

interface ProviderConfig {
  endpoint: string;
  model: string;
  tokenEnvVar: string;
}

const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
  ionos: {
    endpoint: "https://openai.inference.de-txl.ionos.com/v1/images/generations",
    model: "black-forest-labs/FLUX.1-schnell",
    tokenEnvVar: "IONOS_API_TOKEN",
  },
  bfl: {
    endpoint: "https://api.bfl.ai/v1/flux-kontext-pro",
    model: "flux-kontext-pro",
    tokenEnvVar: "BFL_API_TOKEN",
  },
};

export const JSON_BASE_PATH = "https://my-imagestore.s3.nl-ams.scw.cloud/";
const BUCKET_NAME = "my-imagestore";

function getRandomString(length = 6): string {
  return randomBytes(length).toString("hex");
}

function base64ToBuffer(base64String: string): Buffer {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64Data, "base64");
}

export async function uploadToS3(
  data: Buffer | object | string,
  fileName: string,
  contentType = "application/json",
): Promise<string> {
  const accessKey = process.env.SCW_ACCESS_KEY;
  const secretKey = process.env.SCW_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new Error("Missing S3 credentials: SCW_ACCESS_KEY and SCW_SECRET_KEY must be set");
  }

  let dataToUpload: Buffer | string;
  if (Buffer.isBuffer(data)) {
    dataToUpload = data;
  } else if (typeof data === "object") {
    dataToUpload = JSON.stringify(data);
  } else {
    dataToUpload = data;
  }

  const s3Client = new S3Client({
    region: "nl-ams",
    endpoint: "https://s3.nl-ams.scw.cloud",
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: dataToUpload,
    ContentType: contentType,
    ACL: "public-read" as const,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    console.log(`Successfully uploaded ${fileName}`);
    return `${JSON_BASE_PATH}${fileName}`;
  } catch (error) {
    console.error(`Error uploading file: ${error}`);
    throw error;
  }
}

async function generateImageIONOS(prompt: string, size: string): Promise<string> {
  const config = PROVIDER_CONFIGS.ionos;
  const apiToken = process.env[config.tokenEnvVar];

  if (!apiToken) {
    throw new Error(
      `API token not found. Please configure the ${config.tokenEnvVar} environment variable.`,
    );
  }

  const body = { model: config.model, prompt, size };

  console.log("Sending IONOS image generation request...");
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Could not reach IONOS: ${response.status} ${response.statusText}`);
  }

  const responseData = (await response.json()) as { data: Array<{ b64_json: string }> };
  return responseData.data[0]!.b64_json;
}

async function generateImageBFL(
  prompt: string,
  size: string,
  mode = "generate",
  referenceImageBase64: string | null = null,
): Promise<string> {
  const config = PROVIDER_CONFIGS.bfl;
  const apiToken = process.env[config.tokenEnvVar];

  if (!apiToken) {
    throw new Error(
      `API token not found. Please configure the ${config.tokenEnvVar} environment variable.`,
    );
  }

  console.log(`Sending BFL image generation request in ${mode} mode...`);

  const requestBody: Record<string, unknown> = {
    prompt,
    aspect_ratio: size === "1792x1024" ? "16:9" : "1:1",
    output_format: "jpeg",
  };

  if (mode === "edit" && referenceImageBase64) {
    requestBody["input_image"] = referenceImageBase64;
    console.log("Reference image added for editing");
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      // BFL API requires authentication via non-standard 'x-key' header. See BFL API docs.
      "x-key": apiToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Could not reach BFL: ${response.status} ${response.statusText}`);
  }

  const initData = (await response.json()) as { id: string; polling_url: string };
  const { id: requestId, polling_url } = initData;

  console.log(`BFL request started with ID: ${requestId}`);

  const maxAttempts = 60;
  const pollInterval = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Polling attempt ${attempt + 1}/${maxAttempts}...`);

    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    try {
      const pollResponse = await fetch(polling_url, {
        method: "GET",
        headers: { accept: "application/json", "x-key": apiToken },
      });

      if (!pollResponse.ok) {
        console.warn(`Poll request failed: ${pollResponse.status}`);
        continue;
      }

      const pollData = (await pollResponse.json()) as {
        status: string;
        result?: { sample: string };
      };
      console.log(`Poll status: ${pollData.status}`);

      if (pollData.status === "Ready") {
        const imageUrl = pollData.result!.sample;
        console.log("Downloading image from:", imageUrl);
        const imageResponse = await fetch(imageUrl);

        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        return Buffer.from(imageBuffer).toString("base64");
      } else if (pollData.status === "Error" || pollData.status === "Failed") {
        throw new Error(`BFL generation failed: ${JSON.stringify(pollData)}`);
      }
    } catch (error) {
      console.warn(`Polling error (attempt ${attempt + 1}):`, (error as Error).message);
    }
  }

  throw new Error(
    `BFL polling timed out after ${maxAttempts} attempts (${(maxAttempts * pollInterval) / 1000} seconds)`,
  );
}

async function generateImageFromProvider(
  prompt: string,
  provider: Provider,
  size: string,
  mode = "generate",
  referenceImageBase64: string | null = null,
): Promise<string> {
  switch (provider) {
    case "ionos":
      return generateImageIONOS(prompt, size);
    case "bfl":
      return generateImageBFL(prompt, size, mode, referenceImageBase64);
  }
}

export async function generateAndUploadImage(
  prompt: string,
  tokenId: string | number = "unknown",
  provider: Provider,
  size = "1024x1024",
  mode = "generate",
  referenceImageBase64: string | null = null,
): Promise<string> {
  if (!prompt) {
    throw new Error("No prompt provided.");
  }

  const validSizes = ["1024x1024", "1792x1024"];
  if (!validSizes.includes(size)) {
    throw new Error(`Invalid size parameter. Must be one of: ${validSizes.join(", ")}`);
  }

  const imageBase64 = await generateImageFromProvider(
    prompt,
    provider,
    size,
    mode,
    referenceImageBase64,
  );
  console.log("Image received from", provider, "in", mode, "mode");

  const imageFileName = `images/image_${tokenId}_${getRandomString()}.jpg`;
  const imageBuffer = base64ToBuffer(imageBase64);
  const imageUrl = await uploadToS3(imageBuffer, imageFileName, "image/jpeg");

  const metadataFileName = `metadata/metadata_${tokenId}_${getRandomString()}.json`;
  const metadata = {
    name: `AI Generated Art #${tokenId}`,
    description: `AI generated artwork based on the prompt: "${prompt}"`,
    image: imageUrl,
    attributes: [
      { trait_type: "Prompt", value: prompt },
      { trait_type: "Model", value: PROVIDER_CONFIGS[provider].model },
      { trait_type: "Image Size", value: size },
      { trait_type: "Creation Date", value: new Date().toISOString() },
    ],
  };

  const metadataUrl = await uploadToS3(metadata, metadataFileName);
  console.log(`Image and metadata uploaded successfully for token ${tokenId}`);
  return metadataUrl;
}
