import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useWalletAuth } from "../hooks/useWalletAuth";

interface LeafHistoryItem {
  id: number;
  user: string;
  serviceProvider: string;
  tokenCount: string;
  cost: string;
  timestamp: string;
  treeIndex: number;
  processed: boolean;
  root?: string;
}

interface LeafHistorySidebarProps {
  address: `0x${string}` | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const LEAF_BASE_URL = "https://mypersonaljscloudivnad9dy-leafhistory.functions.fnc.fr-par.scw.cloud";

export default function LeafHistorySidebar({ address, isOpen, onClose }: LeafHistorySidebarProps) {
  const getAuth = useWalletAuth("leaf-history");

  const { data: leaves = [], isPending } = useQuery({
    queryKey: ["leafHistory", address],
    queryFn: async () => {
      const auth = await getAuth();
      const response = await fetch(`${LEAF_BASE_URL}?address=${encodeURIComponent(address!)}`, {
        headers: { Authorization: auth },
      });
      const data = (await response.json()) as { leafs?: LeafHistoryItem[] };
      return data.leafs ?? [];
    },
    enabled: isOpen && !!address,
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        width: "300px",
        backgroundColor: "white",
        borderLeft: "1px solid #ddd",
        padding: "1rem",
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3>📊 Request History</h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {isPending ? (
        <div>Loading...</div>
      ) : (
        <div>
          <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#666" }}>Total: {leaves.length} requests</div>

          {leaves.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", marginTop: "2rem" }}>No requests found</div>
          ) : (
            leaves.slice(0, 10).map((leaf) => {
              const getStatusStyle = (processed: boolean) => {
                if (processed) {
                  return {
                    backgroundColor: "#e8f5e8",
                    borderColor: "#4caf50",
                    borderLeftColor: "#4caf50",
                    borderLeftWidth: "4px",
                    icon: "✓",
                    text: "Validated",
                    textColor: "#2e7d32",
                  };
                } else {
                  return {
                    backgroundColor: "#fff3e0",
                    borderColor: "#ff9800",
                    borderLeftColor: "#ff9800",
                    borderLeftWidth: "4px",
                    icon: "⏳",
                    text: "Unprocessed",
                    textColor: "#ef6c00",
                  };
                }
              };

              const statusStyle = getStatusStyle(leaf.processed);

              return (
                <div
                  key={`${leaf.treeIndex}-${leaf.id}`}
                  style={{
                    padding: "0.75rem",
                    marginBottom: "0.5rem",
                    border: `1px solid ${statusStyle.borderColor}`,
                    borderLeft: `${statusStyle.borderLeftWidth} solid ${statusStyle.borderLeftColor}`,
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    backgroundColor: statusStyle.backgroundColor,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ color: statusStyle.textColor, fontWeight: "bold" }}>
                      {statusStyle.icon} {statusStyle.text}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#666", marginLeft: "auto" }}>
                      {new Date(leaf.timestamp).toLocaleDateString()} {new Date(leaf.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ marginBottom: "0.25rem", color: "#333" }}>Tokens: {leaf.tokenCount}</div>
                  <div style={{ marginBottom: "0.25rem", color: "#333" }}>
                    Cost: {formatEther(BigInt(leaf.cost))} ETH
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#666" }}>
                    Tree {leaf.treeIndex}, Leaf {leaf.id}
                  </div>
                </div>
              );
            })
          )}

          {leaves.length > 10 && (
            <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8rem", color: "#666" }}>
              Showing first 10 of {leaves.length} requests
            </div>
          )}
        </div>
      )}
    </div>
  );
}
