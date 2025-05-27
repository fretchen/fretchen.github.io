import React, { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { getChain, getGenAiNFTContractConfig } from "../utils/getChain";
import { css } from "../styled-system/css";
import * as styles from "../layouts/styles";

interface NFT {
  tokenId: bigint;
  tokenURI: string;
  imageUrl?: string;
}

export function NFTList() {
  const { address, isConnected } = useAccount();
  const chain = getChain();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();
  
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get user's NFT balance
  const { data: userBalance } = useReadContract({
    ...genAiNFTContractConfig,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: chain.id,
    query: {
      enabled: !!address && isConnected,
    }
  });

  // Load user's NFTs - simplified approach since we don't have totalSupply
  const loadUserNFTs = async () => {
    console.log("Loading user NFTs...");
    console.log(`User balance: ${userBalance}`);
    console.log(`User address: ${address}`);
    console.log(`Is connected: ${isConnected}`);
    
    if (!isConnected || !address || !userBalance || userBalance === 0n) {
      setNfts([]);
      return;
    }
    
    setIsLoading(true);
    setNfts([]);
    
    // Without totalSupply, we can't iterate through all tokens
    // This approach would need tokenOfOwnerByIndex or similar enumerable function
    // For now, just show the balance
    console.log(`User has ${userBalance} NFT(s)`);
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadUserNFTs();
  }, [address, isConnected, userBalance]);

  if (!isConnected) {
    return (
      <div className={css({ textAlign: "center", padding: "xl" })}>
        <p className={css({ color: "#666" })}>Connect your wallet to view your NFTs</p>
      </div>
    );
  }

  return (
    <div className={css({ marginTop: "2xl" })}>
      <div className={css({ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "xl" })}>
        <h2 className={styles.imageGen.columnHeading}>Your Generated NFTs ({userBalance?.toString() || "0"})</h2>
        <button 
          onClick={loadUserNFTs}
          disabled={isLoading}
          className={css({
            padding: "sm md",
            background: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: "md",
            cursor: "pointer",
            fontSize: "sm",
            "&:hover": { background: "#e5e5e5" },
            "&:disabled": { opacity: 0.5, cursor: "not-allowed" }
          })}
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <div className={css({ textAlign: "center", padding: "xl" })}>
          <div className={styles.imageGen.spinner}></div>
          <p>Loading your NFTs...</p>
        </div>
      ) : userBalance === 0n || !userBalance ? (
        <div className={css({ textAlign: "center", padding: "xl", background: "#f9f9f9", borderRadius: "md" })}>
          <p className={css({ color: "#666" })}>You haven't created any NFTs yet. Use the generator above to create your first one!</p>
        </div>
      ) : (
        <div className={css({ textAlign: "center", padding: "xl", background: "#f9f9f9", borderRadius: "md" })}>
          <p className={css({ color: "#666" })}>You have {userBalance.toString()} NFT(s). Token enumeration requires additional contract functions to display them.</p>
        </div>
      )}
    </div>
  );
}

export default NFTList;
