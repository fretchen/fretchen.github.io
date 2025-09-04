import React, { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { getChain, getGenAiNFTContractConfig } from "../utils/getChain";
import { NFTListProps } from "../types/components";
import * as styles from "../layouts/styles";
import { Tab } from "./Tab";
import { MyNFTList } from "./MyNFTList";
import { PublicNFTList } from "./PublicNFTList";
import { useLocale } from "../hooks/useLocale";
export function NFTList({ newlyCreatedNFT, onNewNFTDisplayed }: NFTListProps = {}) {
  const { address, isConnected } = useAccount();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();

  // Tab state - start with "public" if wallet not connected, otherwise "my"
  const [activeTab, setActiveTab] = useState<"my" | "public">(() => {
    return isConnected ? "my" : "public";
  });

  // Get user's NFT balance for display in tab
  const { data: userBalance } = useReadContract({
    ...genAiNFTContractConfig,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: getChain().id,
    query: {
      enabled: !!address && isConnected,
    },
  });

  return (
    <div className={styles.nftList.container}>
      {/* Tab Navigation */}
      <div className={styles.tabs.container}>
        <div className={styles.tabs.tabList}>
          <Tab
            label={
              isConnected
                ? `${useLocale({ label: "imagegen.myArtworks" })} (${userBalance?.toString() || "0"})`
                : useLocale({ label: "imagegen.myArtworks" })
            }
            isActive={activeTab === "my"}
            onClick={() => setActiveTab("my")}
          />
          <Tab
            label={useLocale({ label: "imagegen.allPublicArtworks" })}
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
