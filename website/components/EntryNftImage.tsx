import * as React from "react";
import { entryNftImage } from "./EntryNftImage.styles";
import { getGenAiNFTAddress, GenImNFTv4ABI, GENAI_NFT_NETWORKS, isTestnet } from "@fretchen/chain-utils";
import { useConfiguredPublicClient } from "../hooks/useConfiguredPublicClient";
import { NFTMetadata } from "../types/components";

interface EntryNftImageProps {
  tokenId?: number;
  fallbackImageUrl?: string;
  nftName?: string;
}

// Filter to mainnet networks only for blog NFTs (they're minted on mainnet)
const MAINNET_NETWORKS = GENAI_NFT_NETWORKS.filter((n) => !isTestnet(n));

/**
 * Larger NFT image that spans both date and title rows
 *
 * Blog NFTs may be minted on any mainnet (Optimism, Base).
 * This component tries each mainnet until it finds the token.
 */
export const EntryNftImage: React.FC<EntryNftImageProps> = ({ tokenId, fallbackImageUrl, nftName }) => {
  // Seeded from the prop so the FIRST render — including SSR — already has the image.
  // Effects don't run while prerendering, so resolving only in the effect meant the built
  // HTML shipped a placeholder and no u-featured, and that HTML is what Bridgy Fed and every
  // other microformats consumer reads.
  //
  // Safe for hydration: fallbackImageUrl comes from build-time metadata that vike serialises
  // into the client pageContext, so server and client compute identical initial state. (The
  // useIsMounted pattern used elsewhere is for wallet state, which genuinely differs.)
  //
  // The initialiser runs once, so a fallbackImageUrl that *changed* on a live instance would
  // not take effect. EntryList keys each entry by its stable blog index, so an instance maps
  // to one post for its lifetime.
  const [imageUrl, setImageUrl] = React.useState<string | null>(fallbackImageUrl ?? null);
  const [isLoading, setIsLoading] = React.useState(!fallbackImageUrl);

  // Default to first mainnet for public client (we'll try all networks anyway)
  const defaultNetwork = MAINNET_NETWORKS[0];
  const publicClient = useConfiguredPublicClient(defaultNetwork);
  const contractAddress = getGenAiNFTAddress(defaultNetwork);

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

      const metadata = (await response.json()) as NFTMetadata;
      return metadata;
    } catch (error) {
      console.error("Error fetching NFT metadata:", error);
      return null;
    }
  };

  React.useEffect(() => {
    // Already resolved from build-time metadata at first render — there is nothing to fetch.
    // Returning early also stops a re-run from resurrecting an image that onError just
    // cleared, and keeps setIsLoading(true) from flickering back to the placeholder.
    if (fallbackImageUrl) return;

    const loadNFTImage = async () => {
      try {
        setIsLoading(true);

        // Only reachable when build-time metadata is missing. Today every tokenID gets it,
        // so this is a fallback rather than a hot path — but it has to stay: the build-time
        // loader queries one chain (utils/nodeChainUtils.ts getDefaultNetwork) while this
        // component covers all mainnets, so a Base-minted NFT would land here.
        if (tokenId && publicClient) {
          // Get token URI using public client (same as NFTFloatImage)
          const tokenURIResult = await publicClient.readContract({
            address: contractAddress,
            abi: GenImNFTv4ABI,
            functionName: "tokenURI",
            args: [BigInt(tokenId)],
          });

          const tokenURI = tokenURIResult;

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

    void loadNFTImage();
  }, [tokenId, fallbackImageUrl, publicClient, contractAddress]);

  if (!imageUrl && !isLoading) {
    return null;
  }

  return (
    <>
      {isLoading ? (
        <div className={entryNftImage.placeholder} title="Loading NFT artwork..." />
      ) : (
        <img
          src={imageUrl!}
          alt={nftName || "NFT Artwork"}
          // u-featured sits on the <img>, not on a wrapper: mf2 reads `src` straight off a
          // u-* img (its primary rule, rather than the only-child fallback), and the class
          // then exists exactly when an image does. The old wrapper was rendered whenever
          // blog.tokenID was truthy, so a failed lookup emitted an empty u-featured.
          className={`u-featured ${entryNftImage.image}`}
          title={`NFT Artwork${nftName ? `: ${nftName}` : ""}`}
          onError={() => setImageUrl(null)}
          loading="lazy"
          decoding="async"
        />
      )}
    </>
  );
};
