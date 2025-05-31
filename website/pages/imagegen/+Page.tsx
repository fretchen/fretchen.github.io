import React, { useState } from "react";
import ImageGenerator from "../../components/ImageGenerator";
import NFTList from "../../components/NFTList";
import * as styles from "../../layouts/styles";

export default function Page() {
  const [newlyCreatedNFT, setNewlyCreatedNFT] = useState<{
    tokenId: bigint;
    imageUrl: string;
  } | null>(null);

  const handleSuccess = (tokenId: bigint, imageUrl: string) => {
    console.log("Image generation succeeded:", { tokenId, imageUrl });

    // Set the newly created NFT for highlighting in the gallery
    setNewlyCreatedNFT({
      tokenId,
      imageUrl,
    });
  };

  const handleError = (error: string) => {
    console.error("Image generation failed:", error);
  };

  const clearNewlyCreated = () => {
    setNewlyCreatedNFT(null);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>AI Image Creator</h1>

      {/* Einfacher, konstanter Generator */}
      <ImageGenerator onSuccess={handleSuccess} onError={handleError} />

      {/* NFT Galerie */}
      <NFTList newlyCreatedNFT={newlyCreatedNFT ?? undefined} onNewNFTDisplayed={clearNewlyCreated} />
    </div>
  );
}
