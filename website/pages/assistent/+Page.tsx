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
      <div className={styles.balanceContainer}>
        <span className={styles.balanceText}>{balance ? formatBalance(balance as bigint) : "0"} ETH</span>
        <button onClick={() => setShowTopUpModal(true)} disabled={isConfirming} className={styles.balanceButton}>
          + Top up
        </button>
      </div>

      {/* Top-up Modal */}
      {showTopUpModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTopUpModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Top up Balance</h3>

            <div className={styles.modalSection}>
              <div className={styles.modalText}>
                Current balance: {balance ? formatBalance(balance as bigint) : "0"} ETH
              </div>
            </div>

            {/* Preset amounts */}
            <div className={styles.modalSection}>
              <div className={styles.modalLabel}>Quick amounts:</div>
              <div className={styles.presetButtons}>
                {["0.001", "0.005", "0.01"].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                    className={`${styles.presetButton} ${
                      selectedAmount === amount && !customAmount ? styles.presetButtonActive : ""
                    }`}
                  >
                    {amount} ETH
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className={styles.modalSection}>
              <div className={styles.modalLabel}>Custom amount:</div>
              <input
                type="text"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.0"
                className={styles.modalInput}
              />
              <div className={styles.modalText}>Amount in ETH (e.g., 0.025)</div>
            </div>

            {/* Action buttons */}
            <div className={styles.modalButtons}>
              <button onClick={() => setShowTopUpModal(false)} className={styles.modalButtonCancel}>
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                disabled={isConfirming || (!customAmount && !selectedAmount)}
                className={styles.modalButtonPrimary}
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
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authSignature, setAuthSignature] = useState<string | null>(null);
  const [refetchBalance, setRefetchBalance] = useState<(() => void) | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mobile detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      <div className={styles.assistantPageContainer}>
        <div className={styles.disconnectedContainer}>
          <h2 className={styles.disconnectedTitle}>Chat Assistant</h2>
          <p className={styles.disconnectedText}>Please connect your wallet to use the chat assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.assistantPageContainer}>
      <div className={`${styles.assistantGrid} ${isMobile ? styles.assistantGridMobile : styles.assistantGridDesktop}`}>
        {/* Sidebar - nur auf Desktop */}
        {!isMobile && (
          <div className={styles.sidebar}>
            {/* Balance Section */}
            <div className={styles.sidebarSection}>
              <h4 className={styles.sidebarHeading}>Balance</h4>
              <BalanceDisplay address={address} onRefetchBalance={handleRefetchBalance} />
            </div>

            {/* Actions Section */}
            <div className={styles.sidebarSection}>
              <h4 className={styles.sidebarHeading}>Actions</h4>
              <div className={styles.actionsContainer}>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className={styles.actionButton}
                  title="View request history"
                >
                  📜 History
                </button>

                <button onClick={clearChat} className={`${styles.actionButton} ${styles.actionButtonSecondary}`}>
                  🗑️ Clear Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className={styles.chatArea}>
          {/* Mobile Header - nur auf Mobile */}
          {isMobile && (
            <div className={styles.mobileHeader}>
              <h2 className={styles.mobileTitle}>AI Assistant</h2>
              <div className={styles.mobileActions}>
                <BalanceDisplay address={address} onRefetchBalance={handleRefetchBalance} />
                <button onClick={() => setIsSidebarOpen(true)} className={styles.mobileActionButton} title="History">
                  📜
                </button>
                <button onClick={clearChat} className={styles.mobileActionButton} title="Clear Chat">
                  🗑️
                </button>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>Start a conversation by typing a message below.</div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`${styles.messageContainer} ${
                    message.role === "user" ? styles.messageContainerUser : styles.messageContainerAssistant
                  }`}
                >
                  <div
                    className={`${styles.messageBubble} ${
                      message.role === "user" ? styles.messageBubbleUser : styles.messageBubbleAssistant
                    }`}
                  >
                    <div className={styles.messageRole}>{message.role === "user" ? "You" : "Assistant"}</div>
                    <div className={styles.messageContent}>{message.content}</div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className={styles.loadingMessage}>
                <div className={styles.loadingBubble}>Assistant is typing...</div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={isLoading}
              className={styles.messageInput}
            />
            <button
              onClick={() => sendMessage(currentInput)}
              disabled={isLoading || !currentInput.trim()}
              className={styles.primaryButton}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>

      {/* Leaf History Sidebar */}
      <LeafHistorySidebar address={address} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}
