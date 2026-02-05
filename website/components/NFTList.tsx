import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useMultiChainUserNFTs } from "../hooks/useMultiChainNFTs";
import { NFTListProps } from "../types/components";
import * as styles from "../layouts/styles";
import { Tab } from "./Tab";
import { MyNFTList } from "./MyNFTList";
import { PublicNFTList } from "./PublicNFTList";
import { useLocale } from "../hooks/useLocale";

export function NFTList({
  newlyCreatedNFT,
  onNewNFTDisplayed,
  activeTab: controlledActiveTab,
  onTabChange,
}: NFTListProps = {}) {
  const { isConnected } = useAccount();

  // Use controlled tab state if provided, otherwise use local state
  const [localActiveTab, setLocalActiveTab] = useState<"my" | "public">(() => {
    return isConnected ? "my" : "public";
  });

  const activeTab = controlledActiveTab ?? localActiveTab;
  const setActiveTab = onTabChange ?? setLocalActiveTab;

  // Use multi-chain hook to get total NFT count across all chains
  const { tokens, reload: reloadTokens } = useMultiChainUserNFTs();
  const totalNFTCount = tokens.length;

  // Refetch when a new NFT is created to update the tab count
  useEffect(() => {
    if (newlyCreatedNFT) {
      reloadTokens();
    }
  }, [newlyCreatedNFT, reloadTokens]);

  // Move useLocale calls to top level to avoid conditional hook calls
  const myArtworksLabel = useLocale({ label: "imagegen.myArtworks" });
  const allPublicArtworksLabel = useLocale({ label: "imagegen.allPublicArtworks" });

  return (
    <div className={styles.nftList.container}>
      {/* Tab Navigation */}
      <div className={styles.tabs.container}>
        <div className={styles.tabs.tabList}>
          <Tab
            label={isConnected ? `${myArtworksLabel} (${totalNFTCount})` : myArtworksLabel}
            isActive={activeTab === "my"}
            onClick={() => setActiveTab("my")}
          />
          <Tab
            label={allPublicArtworksLabel}
            isActive={activeTab === "public"}
            onClick={() => setActiveTab("public")}
          />
        </div>
      </div>

      {/* My NFTs Tab Panel */}
      <div className={`${styles.tabs.tabPanel} ${activeTab === "my" ? "" : styles.tabs.hiddenPanel}`}>
        <MyNFTList newlyCreatedNFT={newlyCreatedNFT} onNewNFTDisplayed={onNewNFTDisplayed} />
      </div>

      {/* Public NFTs Tab Panel */}
      <div className={`${styles.tabs.tabPanel} ${activeTab === "public" ? "" : styles.tabs.hiddenPanel}`}>
        <PublicNFTList />
      </div>
    </div>
  );
}

export default NFTList;
