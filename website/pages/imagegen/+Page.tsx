import React, { useState } from "react";
import ImageGenerator from "../../components/ImageGenerator";
import NFTList from "../../components/NFTList";
import { NFTMetadata } from "../../types/components";
import * as styles from "../../layouts/styles";
import { useTranslation } from "react-i18next";
import { usePageContext } from "vike-react/usePageContext";

export default function Page() {
  const [newlyCreatedNFT, setNewlyCreatedNFT] = useState<{
    tokenId: bigint;
    imageUrl: string;
    metadata?: NFTMetadata;
  } | null>(null);

  const handleSuccess = (tokenId: bigint, imageUrl: string, metadata?: NFTMetadata) => {
    console.log("Image generation succeeded:", { tokenId, imageUrl, metadata });

    // Set the newly created NFT for highlighting in the gallery
    setNewlyCreatedNFT({
      tokenId,
      imageUrl,
      metadata,
    });
  };

  const handleError = (error: string) => {
    console.error("Image generation failed:", error);
  };

  const clearNewlyCreated = () => {
    setNewlyCreatedNFT(null);
  };

  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h1>{t("products.title")}</h1>
      {/* Einfacher, konstanter Generator */}
      <ImageGenerator onSuccess={handleSuccess} onError={handleError} />

      {/* NFT Galerie */}
      <NFTList newlyCreatedNFT={newlyCreatedNFT ?? undefined} onNewNFTDisplayed={clearNewlyCreated} />
    </div>
  );
}
