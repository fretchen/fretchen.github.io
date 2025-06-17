import React, { useEffect } from "react";
import { NFTCard } from "./NFTCard";
import * as styles from "../layouts/styles";

interface NFTHeroCardProps {
  tokenId: number;
  title?: string;
  description?: string;
}

export function NFTHeroCard({ tokenId, title, description }: NFTHeroCardProps) {
  useEffect(() => {
    console.log("NFTHeroCard rendering with props:", { tokenId, title, description });
    console.log("About to render NFTCard with tokenId:", BigInt(tokenId));
  }, [tokenId, title, description]);
  
  return (
    <div className={styles.heroCard.container}>
      {title && <h2 className={styles.heroCard.title}>{title}</h2>}
      {description && <p className={styles.heroCard.description}>{description}</p>}
      <div className={styles.heroCard.nftContainer}>
        <NFTCard
          tokenId={BigInt(tokenId)}
          onImageClick={() => {}} // We'll handle this in the NFTCard component
          onNftBurned={() => {}} // Not relevant for public view
          isPublicView={true}
          isHighlighted={false}
        />
      </div>
    </div>
  );
}
