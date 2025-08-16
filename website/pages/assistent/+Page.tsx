import React, { useState } from "react";
import {
  useAccount,
  useSignMessage,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { getLLMv1ContractConfig } from "../../utils/getChain";
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
  const llmContract = getLLMv1ContractConfig();

  // Read user's balance from contract
  const {
    data: balance,
    refetch: refetchBalance,
    error,
  } = useReadContract({
    address: llmContract.address as `0x${string}`,
    abi: llmContract.abi,
    functionName: "checkBalance",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address, // Only execute when address is available
    },
  });
  
  console.log("Balance data:", balance);
  console.log("Balance error:", error);
  console.log("Address:", address);
  console.log("Contract address:", llmContract.address);
  // Send ETH transaction for top-up using depositForLLM function
  const { writeContract, data: hash } = useWriteContract();
  
  // Wait for transaction to be mined
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Top-up function with fixed amount
  const handleTopUp = () => {
    if (!address) return;
    writeContract({
      address: llmContract.address as `0x${string}`,
      abi: llmContract.abi,
      functionName: "depositForLLM",
      value: parseEther("0.01"), // Fixed 0.01 ETH top-up
    });
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

  if (!address) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span>Balance: {balance ? formatEther(balance as bigint) : "0"} ETH</span>
      <button
        onClick={handleTopUp}
        disabled={isConfirming}
        style={{
          padding: "0.25rem 0.5rem",
          background: isConfirming ? "#ccc" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "3px",
          cursor: isConfirming ? "not-allowed" : "pointer",
          fontSize: "0.8rem",
        }}
        title={isConfirming ? "Transaction pending..." : "Top up with 0.01 ETH"}
      >
        {isConfirming ? "..." : "+"}
      </button>
    </div>
  );
}

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authSignature, setAuthSignature] = useState<string | null>(null);
  const [refetchBalance, setRefetchBalance] = useState<(() => void) | null>(null);

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

      // Prepare the prompt as array (same format as Python notebook)
      const promptArray = [{ role: "user", content: userMessage.trim() }];

      // TODO: Replace with your actual serverless endpoint URL
      // Example: "https://your-serverless-endpoint.scw.cloud"
      const serverlessEndpoint = import.meta.env.VITE_LLM_ENDPOINT || "http://localhost:8080";

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
      console.error("Error sending message:", error);
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
          <h2>Chat Assistant</h2>

          {/* Balance Display */}
          <BalanceDisplay address={address} onRefetchBalance={handleRefetchBalance} />

          <button
            onClick={clearChat}
            style={{
              padding: "0.5rem 1rem",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Clear Chat
          </button>
        </div>

        {/* Messages Container */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "1rem",
            backgroundColor: "#f9f9f9",
          }}
        >
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", color: "#666", padding: "2rem" }}>
              Start a conversation by typing a message below.
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                style={{
                  margin: "1rem 0",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  backgroundColor: message.role === "user" ? "#e3f2fd" : "#f1f8e9",
                  marginLeft: message.role === "user" ? "20%" : "0",
                  marginRight: message.role === "assistant" ? "20%" : "0",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "0.25rem",
                    color: message.role === "user" ? "#1976d2" : "#388e3c",
                  }}
                >
                  {message.role === "user" ? "You" : "Assistant"}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
              </div>
            ))
          )}

          {isLoading && (
            <div
              style={{
                margin: "1rem 0",
                padding: "0.75rem",
                borderRadius: "8px",
                backgroundColor: "#f1f8e9",
                marginRight: "20%",
                fontStyle: "italic",
                color: "#666",
              }}
            >
              Assistant is typing...
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
              padding: "0.75rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              resize: "vertical",
              minHeight: "60px",
              maxHeight: "120px",
            }}
          />
          <button
            onClick={() => sendMessage(currentInput)}
            disabled={isLoading || !currentInput.trim()}
            style={{
              padding: "0.75rem 1.5rem",
              background: isLoading || !currentInput.trim() ? "#ccc" : "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isLoading || !currentInput.trim() ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
