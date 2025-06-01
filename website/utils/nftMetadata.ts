/**
 * NFT Metadata utilities for creating standardized metadata objects
 */

import { NFTMetadata } from "../types/components";

/**
 * Creates a standardized NFT metadata object for AI-generated artworks.
 * This function ensures consistent metadata structure across the application.
 * 
 * @param options - Configuration object for metadata creation
 * @param options.tokenId - The blockchain token ID of the NFT
 * @param options.prompt - The user's prompt used to generate the artwork
 * @param options.imageUrl - The URL of the generated image
 * @param options.metadataUrl - Optional URL to the metadata JSON file
 * @param options.additionalAttributes - Optional additional attributes to include
 * @returns Standardized NFTMetadata object following ERC721 metadata standard
 */
export function createAiArtworkMetadata({
  tokenId,
  prompt,
  imageUrl,
  metadataUrl,
  additionalAttributes = [],
}: {
  tokenId: bigint;
  prompt: string;
  imageUrl: string;
  metadataUrl?: string;
  additionalAttributes?: Array<{ trait_type: string; value: string | number }>;
}): NFTMetadata {
  const baseAttributes = [
    {
      trait_type: "Prompt",
      value: prompt,
    },
    {
      trait_type: "Generation Method",
      value: "AI Generated",
    },
    {
      trait_type: "Token ID",
      value: tokenId.toString(),
    },
  ];

  return {
    name: `AI Generated Artwork #${tokenId}`,
    description: `AI generated artwork based on the prompt: "${prompt}"`,
    image: imageUrl,
    external_url: metadataUrl || "",
    attributes: [...baseAttributes, ...additionalAttributes],
  };
}

/**
 * Creates metadata for a placeholder/temporary NFT while image generation is in progress.
 * 
 * @param tokenId - The blockchain token ID of the NFT
 * @param prompt - The user's prompt used to generate the artwork
 * @returns Metadata object for temporary display
 */
export function createTemporaryMetadata(tokenId: bigint, prompt: string): NFTMetadata {
  return {
    name: `AI Generated Artwork #${tokenId}`,
    description: `AI artwork being generated from prompt: "${prompt}" - Image pending...`,
    attributes: [
      {
        trait_type: "Prompt",
        value: prompt,
      },
      {
        trait_type: "Generation Method",
        value: "AI Generated",
      },
      {
        trait_type: "Status",
        value: "Generating",
      },
    ],
  };
}

/**
 * Updates existing metadata with new image information.
 * Useful when the image generation completes after initial NFT creation.
 * 
 * @param existingMetadata - The current metadata object
 * @param imageUrl - The URL of the generated image
 * @param metadataUrl - Optional URL to the metadata JSON file
 * @returns Updated metadata object with image information
 */
export function updateMetadataWithImage(
  existingMetadata: NFTMetadata,
  imageUrl: string,
  metadataUrl?: string
): NFTMetadata {
  return {
    ...existingMetadata,
    image: imageUrl,
    external_url: metadataUrl || existingMetadata.external_url,
    // Remove "Generating" status if it exists
    attributes: existingMetadata.attributes?.filter(attr => 
      !(attr.trait_type === "Status" && attr.value === "Generating")
    ),
  };
}
