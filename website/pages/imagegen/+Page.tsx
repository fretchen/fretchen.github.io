import React, { useState } from "react";
import { useAccount } from "wagmi";
import ImageGenerator from "../../components/ImageGenerator";
import NFTList from "../../components/NFTList";
import { NFTMetadata } from "../../types/components";
import * as styles from "../../layouts/styles";

export default function Page() {
  const { isConnected } = useAccount();
  
  const [newlyCreatedNFT, setNewlyCreatedNFT] = useState<{
    tokenId: bigint;
    imageUrl: string;
    metadata?: NFTMetadata;
  } | null>(null);

  // Tab state - start with "public" if wallet not connected, otherwise "my"
  const [activeTab, setActiveTab] = useState<"my" | "public">(() => {
    return isConnected ? "my" : "public";
  });

  const handleSuccess = (tokenId: bigint, imageUrl: string, metadata?: NFTMetadata) => {
    console.log("Image generation succeeded:", { tokenId, imageUrl, metadata });

    // Set the newly created NFT for highlighting in the gallery
    setNewlyCreatedNFT({
      tokenId,
      imageUrl,
      metadata,
    });

    // Auto-switch to "my" tab if user is connected
    if (isConnected) {
      setActiveTab("my");
    }
  };

  const handleError = (error: string) => {
    console.error("Image generation failed:", error);
  };

  const clearNewlyCreated = () => {
    setNewlyCreatedNFT(null);
  };

  const handleTabChange = (tab: "my" | "public") => {
    setActiveTab(tab);
  };

  return (
    <div className={styles.container}>
      {/* Einfacher, konstanter Generator */}
      <ImageGenerator onSuccess={handleSuccess} onError={handleError} />

      {/* NFT Galerie */}
      <NFTList
        newlyCreatedNFT={newlyCreatedNFT ?? undefined}
        onNewNFTDisplayed={clearNewlyCreated}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}
