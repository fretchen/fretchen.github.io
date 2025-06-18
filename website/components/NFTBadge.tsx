import * as React from "react";
import { entryList } from "../layouts/styles";

interface NFTBadgeProps {
  tokenId?: number;
  fallbackImageUrl?: string;
  nftName?: string;
  showText?: boolean;
  textMode?: "name" | "illustration" | "artwork" | "none";
}

/**
 * Badge component that displays NFT image thumbnail with smart text
 */
export const NFTBadge: React.FC<NFTBadgeProps> = ({
  tokenId,
  fallbackImageUrl,
  nftName,
  showText = true,
  textMode = "illustration",
}) => {
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

  const getText = () => {
    if (!showText || textMode === "none") return null;
    
    switch (textMode) {
      case "name":
        return nftName || "Artwork";
      case "illustration":
        return "Illustration";
      case "artwork":
        return "Artwork";
      default:
        return "Illustration";
    }
  };

  const getTooltip = () => {
    if (nftName) return `NFT Artwork: ${nftName}`;
    return "This entry has an associated NFT illustration";
  };

  return (
    <span className={entryList.nftBadge} title={getTooltip()}>
      {isLoading ? (
        <div className={entryList.nftBadgeImage} style={{ backgroundColor: "#f3f4f6" }} />
      ) : (
        <img
          src={imageUrl!}
          alt={nftName || "NFT Artwork"}
          className={entryList.nftBadgeImage}
          onError={() => setImageUrl(null)}
        />
      )}
      {getText() && <span className={entryList.nftBadgeText}>{getText()}</span>}
    </span>
  );
};
