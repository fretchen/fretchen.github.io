import * as React from "react";
import { entryList } from "../layouts/styles";

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

  React.useEffect(() => {
    const loadNFTImage = async () => {
      try {
        setIsLoading(true);

        if (fallbackImageUrl) {
          setImageUrl(fallbackImageUrl);
          setIsLoading(false);
          return;
        }

        if (tokenId) {
          // Fetch NFT metadata from your API or contract
          const response = await fetch(`/api/nft-metadata/${tokenId}`);
          if (response.ok) {
            const metadata = await response.json();
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
  }, [tokenId, fallbackImageUrl]);

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
