import React, { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { config } from "../wagmi.config";
import { getChain, getGenAiNFTContractConfig } from "../utils/getChain";
import { css } from "../styled-system/css";
import * as styles from "../layouts/styles";

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

interface NFT {
  tokenId: bigint;
  tokenURI: string;
  metadata?: NFTMetadata;
  imageUrl?: string;
  isLoading?: boolean;
  error?: string;
}

export function NFTList() {
  const { address, isConnected } = useAccount();
  const chain = getChain();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Get user's NFT balance
  const { data: userBalance, isLoading: isLoadingBalance } = useReadContract({
    ...genAiNFTContractConfig,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: chain.id,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Fetch metadata from tokenURI
  const fetchNFTMetadata = async (tokenURI: string): Promise<NFTMetadata | null> => {
    try {
      // Handle file:// URLs for local development
      if (tokenURI.startsWith("file://")) {
        console.warn("Cannot fetch file:// URLs in browser. Metadata:", tokenURI);
        return null;
      }

      const response = await fetch(tokenURI);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      const metadata: NFTMetadata = await response.json();
      return metadata;
    } catch (error) {
      console.error("Error fetching NFT metadata:", error);
      return null;
    }
  };

  // Load user's NFTs using enumerable functions
  const loadUserNFTs = async () => {
    if (!isConnected || !address || !userBalance || userBalance === 0n) {
      setNfts([]);
      return;
    }

    setIsLoadingMetadata(true);

    try {
      const nftList: NFT[] = [];

      // Create placeholder NFTs first
      for (let i = 0; i < Number(userBalance); i++) {
        nftList.push({
          tokenId: 0n,
          tokenURI: "",
          isLoading: true,
        });
      }
      setNfts([...nftList]);

      // Load each NFT's data sequentially
      for (let i = 0; i < Number(userBalance); i++) {
        try {
          // Get token ID at index using wagmi's readContract
          const tokenIdResult = await readContract(config, {
            ...genAiNFTContractConfig,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(i)],
          });

          const tokenId = tokenIdResult as bigint;

          // Get token URI
          const tokenURIResult = await readContract(config, {
            ...genAiNFTContractConfig,
            functionName: "tokenURI",
            args: [tokenId],
          });

          const tokenURI = tokenURIResult as string;

          // Fetch metadata
          const metadata = await fetchNFTMetadata(tokenURI);

          // Update NFT in list
          nftList[i] = {
            tokenId,
            tokenURI,
            metadata: metadata || undefined,
            imageUrl: metadata?.image,
            isLoading: false,
          };

          setNfts([...nftList]);
        } catch (error) {
          console.error(`Error loading NFT at index ${i}:`, error);
          nftList[i] = {
            tokenId: 0n,
            tokenURI: "",
            isLoading: false,
            error: `Failed to load NFT #${i}: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
          setNfts([...nftList]);
        }
      }
    } catch (error) {
      console.error("Error loading NFTs:", error);
      setNfts([]);
    } finally {
      setIsLoadingMetadata(false);
    }
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

  const isLoading = isLoadingBalance || isLoadingMetadata;

  return (
    <div className={css({ marginTop: "2xl" })}>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "xl",
        })}
      >
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
            "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
          })}
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {isLoading && nfts.length === 0 ? (
        <div className={css({ textAlign: "center", padding: "xl" })}>
          <div className={styles.imageGen.spinner}></div>
          <p>Loading your NFTs...</p>
        </div>
      ) : userBalance === 0n || !userBalance ? (
        <div
          className={css({
            textAlign: "center",
            padding: "xl",
            background: "#f9f9f9",
            borderRadius: "md",
          })}
        >
          <p className={css({ color: "#666" })}>
            You haven&apos;t created any NFTs yet. Use the generator above to create your first one!
          </p>
        </div>
      ) : (
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "lg",
            marginTop: "lg",
          })}
        >
          {nfts.map((nft, index) => (
            <NFTCard key={`${nft.tokenId}-${index}`} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
}

// NFT Card Component
function NFTCard({ nft }: { nft: NFT }) {
  return (
    <div
      className={css({
        border: "1px solid #ddd",
        borderRadius: "md",
        padding: "md",
        background: "white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
        },
      })}
    >
      {nft.isLoading ? (
        <div className={css({ textAlign: "center", padding: "lg" })}>
          <div className={styles.imageGen.spinner}></div>
          <p className={css({ fontSize: "sm", color: "#666", marginTop: "sm" })}>Loading NFT...</p>
        </div>
      ) : nft.error ? (
        <div className={css({ textAlign: "center", padding: "lg" })}>
          <div
            className={css({
              background: "#fee",
              border: "1px solid #fcc",
              borderRadius: "sm",
              padding: "sm",
              marginBottom: "sm",
            })}
          >
            <p className={css({ fontSize: "sm", color: "#d33" })}>{nft.error}</p>
          </div>
          <p className={css({ fontSize: "sm", color: "#666" })}>Token ID: {nft.tokenId.toString()}</p>
        </div>
      ) : (
        <>
          {nft.imageUrl ? (
            <div
              className={css({
                width: "100%",
                height: "200px",
                background: "#f5f5f5",
                borderRadius: "sm",
                marginBottom: "sm",
                overflow: "hidden",
              })}
            >
              <img
                src={nft.imageUrl}
                alt={nft.metadata?.name || `NFT #${nft.tokenId}`}
                className={css({
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                })}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling!.classList.remove("hidden");
                }}
              />
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#666",
                  fontSize: "sm",
                })}
                style={{ display: "none" }}
              >
                Image not available
              </div>
            </div>
          ) : (
            <div
              className={css({
                width: "100%",
                height: "200px",
                background: "#f5f5f5",
                borderRadius: "sm",
                marginBottom: "sm",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                fontSize: "sm",
              })}
            >
              No image available
            </div>
          )}

          <h3
            className={css({
              fontSize: "md",
              fontWeight: "bold",
              marginBottom: "xs",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            })}
          >
            {nft.metadata?.name || `NFT #${nft.tokenId}`}
          </h3>

          {nft.metadata?.description && (
            <p
              className={css({
                fontSize: "sm",
                color: "#666",
                marginBottom: "sm",
                lineHeight: "1.4",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxHeight: "2.8em",
              })}
            >
              {nft.metadata.description}
            </p>
          )}

          <div
            className={css({
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "xs",
              color: "#888",
            })}
          >
            <span>Token ID: {nft.tokenId.toString()}</span>
            {nft.tokenURI && (
              <a
                href={nft.tokenURI}
                target="_blank"
                rel="noopener noreferrer"
                className={css({
                  color: "#007acc",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                })}
              >
                Metadata
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NFTList;
