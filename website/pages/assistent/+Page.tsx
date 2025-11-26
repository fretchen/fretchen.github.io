import React, { useState, useMemo } from "react";
import { useAccount, useSignMessage, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { getChain, llmV1ContractConfig } from "../../utils/getChain";
import LeafHistorySidebar from "../../components/LeafHistorySidebar";
import * as styles from "../../layouts/styles";
import { useLocale } from "../../hooks/useLocale";
import { useConnect } from "wagmi";
import { useUmami } from "../../hooks/useUmami";
import { css } from "../../styled-system/css";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// Balance Display Component
interface BalanceDisplayProps {
  address: `0x${string}` | undefined;
}

function BalanceDisplay({ address }: BalanceDisplayProps) {
  // LLM Contract configuration
  const chain = getChain();

  // localized message
  const invalidAmountMessage = useLocale({ label: "assistent.invalidAmount" });
  const invalidAmountFormatMessage = useLocale({ label: "assistent.invalidAmountFormat" });
  const topUpLabel = useLocale({ label: "assistent.topUp" });
  const topUpBalanceLabel = useLocale({ label: "assistent.topUpBalance" });
  const currentBalanceLabel = useLocale({ label: "assistent.currentBalance" });
  const quickAmountsLabel = useLocale({ label: "assistent.quickAmounts" });
  const customAmountLabel = useLocale({ label: "assistent.customAmount" });
  const customHintLabel = useLocale({ label: "assistent.amountHint" });
  const cancelLabel = useLocale({ label: "assistent.cancel" });
  const processingLabel = useLocale({ label: "assistent.processing" });
  const topUpAmountLabel = useLocale({ label: "assistent.topUpAmount" });

  // Read user's balance from contract
  const { data: balance, refetch: refetchBalance } = useReadContract({
    ...llmV1ContractConfig,
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

  // Memoize the amount to send to avoid unnecessary recalculations
  const amountToSend = useMemo(() => customAmount.trim() || selectedAmount, [customAmount, selectedAmount]);

  // Memoize the button text to avoid string replacement on every render
  const buttonText = useMemo(() => {
    if (isConfirming) return processingLabel;
    return topUpAmountLabel.replace("{amount}", amountToSend);
  }, [isConfirming, processingLabel, topUpAmountLabel, amountToSend]);

  const handleTopUp = async () => {
    if (!address) return;

    try {
      const amountStr = amountToSend;
      const amountWei = parseEther(amountStr);

      if (!amountWei || amountWei <= 0n) {
        alert(invalidAmountMessage);
        return;
      }

      writeContract({
        ...llmV1ContractConfig,
        functionName: "depositForLLM",
        value: amountWei,
        ...(chain?.id && { chainId: chain.id }),
      });

      setShowTopUpModal(false);
    } catch (err) {
      console.error("Top-up failed", err);
      alert(invalidAmountFormatMessage);
    }
  };

  // Refetch balance when transaction is confirmed
  React.useEffect(() => {
    if (isConfirmed) {
      refetchBalance();
    }
  }, [isConfirmed, refetchBalance]);

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
          {topUpLabel}
        </button>
      </div>

      {/* Top-up Modal */}
      {showTopUpModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTopUpModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{topUpBalanceLabel}</h3>

            <div className={styles.modalSection}>
              <div className={styles.modalText}>
                {currentBalanceLabel} {balance ? formatBalance(balance as bigint) : "0"} ETH
              </div>
            </div>

            {/* Preset amounts */}
            <div className={styles.modalSection}>
              <div className={styles.modalLabel}>{quickAmountsLabel}</div>
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
              <div className={styles.modalLabel}>{customAmountLabel}</div>
              <input
                type="text"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.0"
                className={styles.modalInput}
              />
              <div className={styles.modalText}>{customHintLabel}</div>
            </div>

            {/* Action buttons */}
            <div className={styles.modalButtons}>
              <button onClick={() => setShowTopUpModal(false)} className={styles.modalButtonCancel}>
                {cancelLabel}
              </button>
              <button
                onClick={handleTopUp}
                disabled={isConfirming || (!customAmount && !selectedAmount)}
                className={styles.modalButtonPrimary}
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Page() {
  // Feature flag - check if AI assistant is enabled
  const isAiAssistantEnabled = false;

  // Analytics hook
  const { trackEvent } = useUmami();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authSignature, setAuthSignature] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Localized messages
  const systemPromptMessage = useLocale({ label: "assistent.systemPrompt" });
  const noResponseMessage = useLocale({ label: "assistent.noResponse" });
  const errorPrefixMessage = useLocale({ label: "assistent.errorPrefix" });
  const connectWalletMessageLabel = useLocale({ label: "assistent.connectWalletMessage" });
  const loadingLabel = useLocale({ label: "assistent.loading" });
  const sendLabel = useLocale({ label: "assistent.send" });
  const unknownErrorLabel = useLocale({ label: "assistent.unknownError" });
  const balanceLabel = useLocale({ label: "assistent.balance" });
  const typingLabel = useLocale({ label: "assistent.typing" });
  const actionsLabel = useLocale({ label: "assistent.actions" });
  const historyLabel = useLocale({ label: "assistent.history" });
  const clearChatLabel = useLocale({ label: "assistent.clearChat" });
  const mobileTitleLabel = useLocale({ label: "assistent.mobileTitle" });
  const emptyStateLabel = useLocale({ label: "assistent.emptyState" });
  const youLabel = useLocale({ label: "assistent.you" });
  const assistantLabel = useLocale({ label: "assistent.assistant" });
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
  const { connectors, connect } = useConnect();

  // Handle wallet connection
  const handleWalletConnection = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] }); // Use first available connector
    }
  };

  // Button state logic similar to ImageGenerator
  const buttonState = useMemo(() => {
    if (!isConnected) return "connect";
    if (isLoading) return "loading";
    if (!currentInput.trim()) return "empty";
    return "ready";
  }, [isConnected, isLoading, currentInput]);

  const getButtonText = (state: string) => {
    switch (state) {
      case "connect":
        return connectWalletMessageLabel;
      case "loading":
        return loadingLabel;
      case "empty":
        return sendLabel;
      case "ready":
        return sendLabel;
      default:
        return sendLabel;
    }
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

    // Track first message only
    if (messages.length === 0) {
      trackEvent("assistant-first-message-sent", {
        messageLength: userMessage.trim().length,
        isMobile: isMobile,
      });
    }

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
        { role: "system", content: systemPromptMessage },
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
        content: data.content || noResponseMessage,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Balance is automatically refreshed by BalanceDisplay component after transactions
    } catch (error) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `${errorPrefixMessage} ${error instanceof Error ? error.message : unknownErrorLabel}`,
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
      if (isConnected) {
        sendMessage(currentInput);
      }
    }
  };

  const handleSendClick = () => {
    if (!isConnected) {
      // Track connect button click
      trackEvent("assistant-connect-button-click", {
        hasInput: currentInput.trim().length > 0,
      });
      handleWalletConnection();
      return;
    }
    sendMessage(currentInput);
  };

  // If feature is disabled, show maintenance message
  if (!isAiAssistantEnabled) {
    return (
      <div className={styles.assistantPageContainer}>
        <div
          className={css({
            maxWidth: "500px",
            margin: "0 auto",
            textAlign: "center",
            padding: "16",
          })}
        >
          <h3
            className={css({
              fontSize: "2xl",
              fontWeight: "semibold",
              marginBottom: "4",
              color: "gray.800",
            })}
          >
            🔧 Temporarily Unavailable
          </h3>
          <p
            className={css({
              fontSize: "md",
              color: "gray.600",
              lineHeight: "1.5",
            })}
          >
            AI Assistant is currently under maintenance. Please check back later.
          </p>
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
              <h4 className={styles.sidebarHeading}>{balanceLabel}</h4>
              <BalanceDisplay address={address} />
            </div>

            {/* Actions Section */}
            <div className={styles.sidebarSection}>
              <h4 className={styles.sidebarHeading}>{actionsLabel}</h4>
              <div className={styles.actionsContainer}>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className={styles.actionButton}
                  title="View request history"
                >
                  {historyLabel}
                </button>

                <button onClick={clearChat} className={`${styles.actionButton} ${styles.actionButtonSecondary}`}>
                  {clearChatLabel}
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
              <h2 className={styles.mobileTitle}>{mobileTitleLabel}</h2>
              <div className={styles.mobileActions}>
                <BalanceDisplay address={address} />
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
              <div className={styles.emptyState}>{emptyStateLabel}</div>
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
                    <div className={styles.messageRole}>{message.role === "user" ? youLabel : assistantLabel}</div>
                    <div className={styles.messageContent}>{message.content}</div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className={styles.loadingMessage}>
                <div className={styles.loadingBubble}>{typingLabel}</div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={useLocale({ label: "assistent.placeholder" })}
              disabled={isLoading}
              className={styles.messageInput}
            />
            <button
              onClick={handleSendClick}
              onMouseEnter={() => {
                if (!isConnected) {
                  trackEvent("assistant-connect-button-hover");
                }
              }}
              disabled={isLoading || (!isConnected ? false : !currentInput.trim())}
              className={styles.primaryButton}
            >
              {buttonState === "connect" ? "🔗 " : ""}
              {getButtonText(buttonState)}
            </button>
          </div>
        </div>
      </div>

      {/* Leaf History Sidebar */}
      <LeafHistorySidebar address={address} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}
