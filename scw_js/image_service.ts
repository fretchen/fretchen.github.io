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

import { putS3Object, getS3BaseUrl } from "@fretchen/s3-utils";
import { randomBytes } from "crypto";
import { z } from "zod";
import { BflSubmitSchema, BflPollSchema } from "./upstream_schemas.js";

/**
 * One entry today. Kept as a seam rather than inlined because `genimg_schemas.ts`'s
 * `MODEL_TO_PROVIDER` maps advertised model ids onto it — adding a provider means adding an
 * entry here and a mapping there, not restructuring both.
 */
export type Provider = "bfl";

interface ProviderConfig {
  endpoint: string;
  model: string;
  tokenEnvVar: string;
}

const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
  bfl: {
    endpoint: "https://api.bfl.ai/v1/flux-kontext-pro",
    model: "flux-kontext-pro",
    tokenEnvVar: "BFL_API_TOKEN",
  },
};

export const JSON_BASE_PATH = getS3BaseUrl();

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
  let dataToUpload: Buffer | string;
  if (Buffer.isBuffer(data)) {
    dataToUpload = data;
  } else if (typeof data === "object") {
    dataToUpload = JSON.stringify(data);
  } else {
    dataToUpload = data;
  }

  try {
    await putS3Object(fileName, dataToUpload, {
      contentType,
      acl: "public-read",
      cacheControl: "public, max-age=31536000, immutable",
    });
    console.log(`Successfully uploaded ${fileName}`);
    return `${JSON_BASE_PATH}${fileName}`;
  } catch (error) {
    console.error(`Error uploading file: ${error}`);
    throw error;
  }
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

  // Fail here rather than let a missing polling_url become fetch(undefined) in the loop below,
  // where the transport catch retries it 60 times and then reports a timeout.
  const submit = BflSubmitSchema.safeParse(await response.json());
  if (!submit.success) {
    throw new Error(`BFL returned an unusable submit response: ${z.prettifyError(submit.error)}`);
  }
  const { id: requestId, polling_url } = submit.data;

  console.log(`BFL request started with ID: ${requestId}`);

  const maxAttempts = 60;
  const pollInterval = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Polling attempt ${attempt + 1}/${maxAttempts}...`);

    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    let rawPoll: unknown;
    try {
      const pollResponse = await fetch(polling_url, {
        method: "GET",
        headers: { accept: "application/json", "x-key": apiToken },
      });

      if (!pollResponse.ok) {
        console.warn(`Poll request failed: ${pollResponse.status}`);
        continue;
      }

      rawPoll = await pollResponse.json();
    } catch (error) {
      // Only transport-level failures are retried. A transient network blip on one poll is
      // worth another attempt; a generation the API has already declared failed is not.
      console.warn(`Polling error (attempt ${attempt + 1}):`, (error as Error).message);
      continue;
    }

    // Outside the try for the same reason as the status checks below: valid JSON that is not a
    // BFL poll response is not a transient blip worth retrying.
    const poll = BflPollSchema.safeParse(rawPoll);
    if (!poll.success) {
      throw new Error(
        `BFL returned an unrecognizable poll response: ${z.prettifyError(poll.error)}`,
      );
    }
    const pollData = poll.data;

    console.log(`Poll status: ${pollData.status}`);

    // Deliberately outside the try above. These used to be thrown inside it and caught by its
    // own catch, so a generation BFL had reported as Failed was swallowed and retried for the
    // full 60 attempts — five minutes — before surfacing as a *timeout*, hiding the real reason.
    //
    // Stringifies rawPoll, not the Zod clone: this message is the only record of what BFL sent.
    if (pollData.status === "Error" || pollData.status === "Failed") {
      throw new Error(`BFL generation failed: ${JSON.stringify(rawPoll)}`);
    }

    if (pollData.status === "Ready") {
      const imageUrl = pollData.result?.sample;
      // Outside the download try below: a Ready without a result URL is not a CDN blip. This was
      // a non-null assertion, whose TypeError landed in that catch and was retried.
      if (!imageUrl) {
        throw new Error(`BFL reported Ready without a result URL: ${JSON.stringify(rawPoll)}`);
      }
      console.log("Downloading image from:", imageUrl);

      // Its own try/catch, separate from the Error/Failed check above: a transient failure
      // fetching the delivery CDN (a fresh URL that has not necessarily propagated yet) is
      // exactly the kind of thing worth another poll cycle for, unlike a status BFL has already
      // declared failed. Moving this whole block outside the transport try alongside the status
      // check (an earlier fix here, aimed only at the status check) would have removed this
      // tolerance too — a single 503 downloading the image would abort the request immediately
      // instead of self-healing on the next attempt, as it always did before that fix.
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        return Buffer.from(imageBuffer).toString("base64");
      } catch (error) {
        console.warn(`Image download error (attempt ${attempt + 1}):`, (error as Error).message);
        continue;
      }
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
