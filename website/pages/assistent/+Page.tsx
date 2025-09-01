import React, { useState } from "react";
import { useAccount, useSignMessage, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { getChain, getLLMv1ContractConfig } from "../../utils/getChain";
import LeafHistorySidebar from "../../components/LeafHistorySidebar";
import * as styles from "../../layouts/styles";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// Balance Display Component
interface BalanceDisplayProps {
  address: `0x${string}` | undefined;
  onRefetchBalance?: (refetchFn: () => void) => void;
}

function BalanceDisplay({ address, onRefetchBalance }: BalanceDisplayProps) {
  // LLM Contract configuration
  const llmContractConfig = getLLMv1ContractConfig();
  const chain = getChain();

  // Read user's balance from contract
  const { data: balance, refetch: refetchBalance } = useReadContract({
    ...llmContractConfig,
    functionName: "checkBalance",
    args: address ? [address] : undefined,
    ...(chain?.id && { chainId: chain.id }),
  });
  // Send ETH transaction for top-up using depositForLLM function
  const { writeContract, data: hash } = useWriteContract();

  // Wait for transaction to be mined
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Top-up modal state
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [selectedAmount, setSelectedAmount] = useState<string>("0.01");
  const [customAmount, setCustomAmount] = useState<string>("");

  const getAmountToSend = (): string => {
    return customAmount.trim() || selectedAmount;
  };

  const handleTopUp = async () => {
    if (!address) return;

    try {
      const amountStr = getAmountToSend();
      const amountWei = parseEther(amountStr);

      if (!amountWei || amountWei <= 0n) {
        alert("Enter a valid amount greater than 0");
        return;
      }

      writeContract({
        ...llmContractConfig,
        functionName: "depositForLLM",
        value: amountWei,
        ...(chain?.id && { chainId: chain.id }),
      });

      setShowTopUpModal(false);
    } catch (err) {
      console.error("Top-up failed", err);
      alert("Invalid amount format");
    }
  };

  // Refetch balance when transaction is confirmed
  React.useEffect(() => {
    if (isConfirmed) {
      refetchBalance();
    }
  }, [isConfirmed, refetchBalance]);

  // Pass refetch function to parent
  React.useEffect(() => {
    if (onRefetchBalance) {
      onRefetchBalance(refetchBalance);
    }
  }, [refetchBalance, onRefetchBalance]);

  // Helper function for user-friendly balance formatting
  const formatBalance = (balanceWei: bigint): string => {
    const balanceEth = parseFloat(formatEther(balanceWei));

    if (balanceEth === 0) return "0";
    if (balanceEth >= 1) return balanceEth.toFixed(3); // 3 decimals for amounts >= 1 ETH
    if (balanceEth >= 0.1) return balanceEth.toFixed(4); // 4 decimals for 0.1-1 ETH
    if (balanceEth >= 0.001) return balanceEth.toFixed(5); // 5 decimals for 0.001-0.1 ETH
    return balanceEth.toFixed(6); // 6 decimals for very small amounts
  };

  if (!address) return null;

  return (
    <>
      {/* Simple Balance Display */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.9rem", color: "#333" }}>
          LLM Chat Credits: {balance ? formatBalance(balance as bigint) : "0"} ETH
        </span>
        <button
          onClick={() => setShowTopUpModal(true)}
          disabled={isConfirming}
          style={{
            padding: "0.35rem 0.6rem",
            background: "transparent",
            color: "#333",
            border: "1px solid #ddd",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: "500",
          }}
        >
          + Top up
        </button>
      </div>

      {/* Top-up Modal */}
      {showTopUpModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowTopUpModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              minWidth: "300px",
              maxWidth: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem" }}>Top up Balance</h3>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
                Current balance: {balance ? formatBalance(balance as bigint) : "0"} ETH
              </div>
            </div>

            {/* Preset amounts */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Quick amounts:</div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["0.001", "0.005", "0.01"].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                    style={{
                      padding: "0.5rem 1rem",
                      border: selectedAmount === amount && !customAmount ? "2px solid #333" : "1px solid #ddd",
                      background: selectedAmount === amount && !customAmount ? "#f8f9fa" : "white",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    {amount} ETH
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: "500" }}>Custom amount:</div>
              <input
                type="text"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.0"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                }}
              />
              <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.25rem" }}>Amount in ETH (e.g., 0.025)</div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowTopUpModal(false)}
                style={{
                  padding: "0.5rem 1rem",
                  background: "transparent",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                disabled={isConfirming || (!customAmount && !selectedAmount)}
                style={{
                  padding: "0.5rem 1rem",
                  background: isConfirming ? "#f5f5f5" : "#333",
                  color: isConfirming ? "#999" : "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isConfirming ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                }}
              >
                {isConfirming ? "Processing..." : `Top up ${getAmountToSend()} ETH`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authSignature, setAuthSignature] = useState<string | null>(null);
  const [refetchBalance, setRefetchBalance] = useState<(() => void) | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Callback to receive refetch function from BalanceDisplay
  const handleRefetchBalance = (refetchFn: () => void) => {
    setRefetchBalance(() => refetchFn);
  };

  // Authenticate wallet once per session
  const authenticateWallet = async () => {
    if (!address || !isConnected) {
      throw new Error("Wallet not connected");
    }

    if (authSignature) {
      return authSignature; // Already authenticated
    }

    const message = `Authenticate wallet: ${address}`;
    const signature = await signMessageAsync({ message });
    setAuthSignature(signature);
    return signature;
  };

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setIsLoading(true);

    // Add user message
    const userMsg: ChatMessage = {
      role: "user",
      content: userMessage.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setCurrentInput("");

    try {
      // Authenticate if needed
      const signature = await authenticateWallet();

      // Prepare the prompt as array including full conversation history
      const promptArray = [
        { role: "system", content: "You are a helpful assistant." },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user", content: userMessage.trim() },
      ];

      const serverlessEndpoint =
        import.meta.env.PUBLIC_ENV__LLM_ENDPOINT ||
        "https://mypersonaljscloudivnad9dy-llm.functions.fnc.fr-par.scw.cloud";
      // Call the serverless function - format like Python code
      const response = await fetch(serverlessEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors", // Explicitly enable CORS
        body: JSON.stringify({
          auth: {
            address,
            signature,
            message: `Authenticate wallet: ${address}`,
          },
          data: {
            prompt: promptArray, // Send as array directly, like in Python notebook
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      const data = await response.json();

      // Add assistant message
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.content || "No response received",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Refresh balance after successful message
      if (refetchBalance) {
        refetchBalance();
      }
    } catch (error) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setAuthSignature(null); // Clear auth for next session
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(currentInput);
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2>Chat Assistant</h2>
          <p>Please connect your wallet to use the chat assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 0",
          }}
        >
          {/* Balance Display */}
          <BalanceDisplay address={address} onRefetchBalance={handleRefetchBalance} />

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                padding: "0.5rem 1rem",
                background: "transparent",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "2px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "500",
              }}
              title="View request history"
            >
              History
            </button>

            <button
              onClick={clearChat}
              style={{
                padding: "0.5rem 1rem",
                background: "transparent",
                color: "#666",
                border: "1px solid #ddd",
                borderRadius: "2px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "500",
              }}
            >
              Clear Chat
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            border: "1px solid #e0e0e0",
            borderRadius: "4px",
            padding: "1rem",
            backgroundColor: "#ffffff",
          }}
        >
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", color: "#888", padding: "2rem", fontSize: "0.9rem" }}>
              Start a conversation by typing a message below.
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                style={{
                  margin: "1rem 0",
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: message.role === "user" ? "70%" : "80%",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    backgroundColor: message.role === "user" ? "#2d3748" : "#f8f9fa",
                    color: message.role === "user" ? "white" : "#333",
                    border: message.role === "user" ? "none" : "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      opacity: 0.8,
                    }}
                  >
                    {message.role === "user" ? "You" : "Assistant"}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{message.content}</div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div
              style={{
                margin: "1rem 0",
                display: "flex",
                justifyContent: "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  backgroundColor: "#f8f9fa",
                  color: "#333",
                  border: "1px solid #e2e8f0",
                  fontStyle: "italic",
                }}
              >
                Assistant is typing...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            padding: "1rem 0",
          }}
        >
          <textarea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "1rem",
              border: "1px solid #e0e0e0",
              borderRadius: "2px",
              resize: "vertical",
              minHeight: "60px",
              maxHeight: "120px",
              fontSize: "0.9rem",
              lineHeight: "1.5",
              outline: "none",
              backgroundColor: "#ffffff",
            }}
          />
          <button
            onClick={() => sendMessage(currentInput)}
            disabled={isLoading || !currentInput.trim()}
            style={{
              padding: "0.75rem 1.5rem",
              background: isLoading || !currentInput.trim() ? "#f5f5f5" : "#333",
              color: isLoading || !currentInput.trim() ? "#999" : "white",
              border: "1px solid #ddd",
              borderRadius: "2px",
              cursor: isLoading || !currentInput.trim() ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {/* Leaf History Sidebar */}
      <LeafHistorySidebar address={address} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}
