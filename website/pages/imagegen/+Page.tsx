import React, { useState, useRef } from "react";
import ImageGenerator from "../../components/ImageGenerator";
import NFTList from "../../components/NFTList";
import * as styles from "../../layouts/styles";

export default function Page() {
  const [newlyCreatedNFT, setNewlyCreatedNFT] = useState<{
    tokenId: bigint;
    imageUrl: string;
    timestamp: number;
  } | null>(null);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleSuccess = (tokenId: bigint, imageUrl: string) => {
    console.log("Image generation succeeded:", { tokenId, imageUrl });

    // Setze das neu erstellte NFT für Highlighting
    setNewlyCreatedNFT({
      tokenId,
      imageUrl,
      timestamp: Date.now(),
    });

    // Aktiviere kompakten Modus sofort für besseren UX
    setIsCompactMode(true);

    // Scrolle zur Galerie nach kurzer Verzögerung
    setTimeout(() => {
      if (galleryRef.current) {
        galleryRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 500);
  };

  const handleError = (error: string) => {
    console.error("Image generation failed:", error);
  };

  const clearNewlyCreated = () => {
    // Verzögere das Entfernen des newly created flags, 
    // damit das Highlighting erhalten bleibt
    setTimeout(() => {
      setNewlyCreatedNFT(null);
    }, 2000);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Decentral AI Image Generator</h1>

      {/* Kompakter Generator */}
      <ImageGenerator onSuccess={handleSuccess} onError={handleError} isCompact={isCompactMode} />

      {/* Nahtloser Übergang zur Galerie */}
      <div ref={galleryRef}>
        <NFTList
          newlyCreatedNFT={
            newlyCreatedNFT ? { tokenId: newlyCreatedNFT.tokenId, imageUrl: newlyCreatedNFT.imageUrl } : undefined
          }
          onNewNFTDisplayed={clearNewlyCreated}
        />
      </div>
    </div>
  );
}
