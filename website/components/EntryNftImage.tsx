import * as React from "react";
import { entryList } from "../layouts/styles";
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { getGenAiNFTAddress, GenImNFTv4ABI, GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";
import { useConfiguredPublicClient } from "../hooks/useConfiguredPublicClient";
import { NFTMetadata } from "../types/components";

interface EntryNftImageProps {
  tokenId?: number;
  fallbackImageUrl?: string;
  nftName?: string;
}

/**
 * Larger NFT image that spans both date and title rows
 */
export const EntryNftImage: React.FC<EntryNftImageProps> = ({ tokenId, fallbackImageUrl, nftName }) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const network = useAutoNetwork(GENAI_NFT_NETWORKS);
  const contractAddress = getGenAiNFTAddress(network);
  const publicClient = useConfiguredPublicClient(network);

  // Fetch metadata from tokenURI
  const fetchNFTMetadata = async (tokenURI: string): Promise<NFTMetadata | null> => {
    try {
      if (tokenURI.startsWith("file://")) {
        console.warn("Cannot fetch file:// URLs in browser. Metadata:", tokenURI);
        return null;
      }

      const response = await fetch(tokenURI);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      const metadata: NFTMetadata = await response.json();
      return metadata;
    } catch (error) {
      console.error("Error fetching NFT metadata:", error);
      return null;
    }
  };

  React.useEffect(() => {
    const loadNFTImage = async () => {
      try {
        setIsLoading(true);

        if (fallbackImageUrl) {
          setImageUrl(fallbackImageUrl);
          setIsLoading(false);
          return;
        }

        if (tokenId && publicClient) {
          // Get token URI using public client (same as NFTFloatImage)
          const tokenURIResult = await publicClient.readContract({
            address: contractAddress,
            abi: GenImNFTv4ABI,
            functionName: "tokenURI",
            args: [BigInt(tokenId)],
          });

          const tokenURI = tokenURIResult as string;

          // Fetch metadata from the token URI
          const metadata = await fetchNFTMetadata(tokenURI);
          if (metadata?.image) {
            setImageUrl(metadata.image);
          }
        }
      } catch (error) {
        console.warn("Failed to load NFT image:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNFTImage();
  }, [tokenId, fallbackImageUrl, publicClient]);

  if (!imageUrl && !isLoading) {
    return null;
  }

  return (
    <>
      {isLoading ? (
        <div
          className={entryList.entryNftImage}
          style={{ backgroundColor: "#f3f4f6" }}
          title="Loading NFT artwork..."
        />
      ) : (
        <img
          src={imageUrl!}
          alt={nftName || "NFT Artwork"}
          className={entryList.entryNftImage}
          title={`NFT Artwork${nftName ? `: ${nftName}` : ""}`}
          onError={() => setImageUrl(null)}
        />
      )}
    </>
  );
};
