import React from "react";
import ImageGenerator from "../../components/ImageGenerator";
import NFTList from "../../components/NFTList";
import * as styles from "../../layouts/styles";

export default function Page() {
  const handleSuccess = (tokenId: bigint, imageUrl: string) => {
    console.log("Image generation succeeded:", { tokenId, imageUrl });
  };

  const handleError = (error: string) => {
    console.error("Image generation failed:", error);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Decentral AI Image Generator</h1>
      <ImageGenerator onSuccess={handleSuccess} onError={handleError} />
      <NFTList />
    </div>
  );
}
