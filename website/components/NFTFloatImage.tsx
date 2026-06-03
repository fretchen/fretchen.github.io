import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { getGenAiNFTAddress, GenImNFTv4ABI, GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";
import { useConfiguredPublicClient } from "../hooks/useConfiguredPublicClient";
import { extractPromptFromDescription } from "../utils/nftMetadataUtils";
import { NFTMetadata } from "../types/components";
import * as styles from "../layouts/styles";

interface NFTFloatImageProps {
  tokenId: number;
}

type NFTFloatData = {
  imageUrl: string | null;
  title: string | null;
  description: string | null;
};

export function NFTFloatImage({ tokenId }: NFTFloatImageProps) {
  const { network } = useAutoNetwork(GENAI_NFT_NETWORKS);
  const contractAddress = getGenAiNFTAddress(network);
  const publicClient = useConfiguredPublicClient(network);

  const { data, isPending, isError } = useQuery<NFTFloatData>({
    queryKey: ["nftFloatData", tokenId, network],
    queryFn: async () => {
      const tokenURI = await publicClient.readContract({
        address: contractAddress,
        abi: GenImNFTv4ABI,
        functionName: "tokenURI",
        args: [BigInt(tokenId)],
      });

      if (!tokenURI || tokenURI.startsWith("file://")) {
        return { imageUrl: null, title: null, description: null };
      }

      const response = await fetch(tokenURI);
      if (!response.ok) throw new Error(`Failed to fetch metadata: ${response.status}`);
      const metadata = (await response.json()) as NFTMetadata;

      return {
        imageUrl: metadata.image ?? null,
        title: metadata.name ?? null,
        description: metadata.description ?? null,
      };
    },
  });

  const getImageTitle = (): string => {
    const description = data?.description ?? null;
    const title = data?.title ?? null;
    const promptPreview = description ? extractPromptFromDescription(description, 60) : "";
    if (promptPreview) return `Article Illustration: ${promptPreview}`;
    return title ? `Article Illustration: ${title}` : `Article Illustration: NFT #${tokenId}`;
  };

  if (isPending) {
    return (
      <div className={styles.nftFloat.container}>
        <div className={styles.nftFloat.loading}>
          <div className={styles.nftFloat.spinner}></div>
          <p className={styles.nftFloat.loadingText}>Loading...</p>
        </div>
      </div>
    );
  }

  if (isError || !data?.imageUrl) {
    return (
      <div className={styles.nftFloat.container}>
        <div className={styles.nftFloat.placeholder}>
          <p className={styles.nftFloat.placeholderText}>NFT #{tokenId}</p>
          <p className={styles.nftFloat.errorText}>Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.nftFloat.container}>
      <img
        src={data.imageUrl}
        alt={data.title || `NFT #${tokenId}`}
        className={`u-photo ${styles.nftFloat.image}`}
        loading="lazy"
        decoding="async"
      />
      <p className={styles.nftFloat.caption}>{getImageTitle()}</p>
    </div>
  );
}
