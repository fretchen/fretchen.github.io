import React, { useState, useMemo } from "react";
import { AgentInfoPanel } from "../../components/AgentInfoPanel";
import * as styles from "../../layouts/styles";
import { useLocale } from "../../hooks/useLocale";
import { useUmami } from "../../hooks/useUmami";
import { css } from "../../styled-system/css";
import { useWalletConnection } from "../../hooks/useWalletConnection";
import { useAutoNetwork } from "../../hooks/useAutoNetwork";
import { useX402Chat } from "../../hooks/useX402Chat";
import { getViemChain } from "@fretchen/chain-utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// Launch scope: Base Sepolia only. Add "eip155:8453" (Base mainnet) here to go to production.
const CHAT_NETWORKS = ["eip155:84532"] as const;

/** Build a block-explorer tx link for the given CAIP-2 network via its viem chain config. */
function explorerTxUrl(network: string, txHash: string): string | null {
  if (!txHash) return null;
  try {
    const base = getViemChain(network).blockExplorers?.default?.url;
    return base ? `${base}/tx/${txHash}` : null;
  } catch {
    return null;
  }
}

export default function Page() {
  const { trackEvent } = useUmami();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Localized messages (reuse the existing assistent.* namespace)
  const systemPromptMessage = useLocale({ label: "assistent.systemPrompt" });
  const noResponseMessage = useLocale({ label: "assistent.noResponse" });
  const errorPrefixMessage = useLocale({ label: "assistent.errorPrefix" });
  const connectWalletMessageLabel = useLocale({ label: "assistent.connectWalletMessage" });
  const loadingLabel = useLocale({ label: "assistent.loading" });
  const sendLabel = useLocale({ label: "assistent.send" });
  const unknownErrorLabel = useLocale({ label: "assistent.unknownError" });
  const typingLabel = useLocale({ label: "assistent.typing" });
  const actionsLabel = useLocale({ label: "assistent.actions" });
  const clearChatLabel = useLocale({ label: "assistent.clearChat" });
  const mobileTitleLabel = useLocale({ label: "assistent.mobileTitle" });
  const emptyStateLabel = useLocale({ label: "assistent.emptyState" });
  const youLabel = useLocale({ label: "assistent.you" });
  const assistantLabel = useLocale({ label: "assistent.assistant" });
  const placeholderLabel = useLocale({ label: "assistent.placeholder" });
  const viewPaymentLabel = useLocale({ label: "assistent.viewPayment" });

  // Mobile detection
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { isConnected, connectWallet } = useWalletConnection();
  const { network, switchIfNeeded } = useAutoNetwork(CHAT_NETWORKS);
  const { sendMessage: payAndSend, paymentReceipt } = useX402Chat(network);

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
      default:
        return sendLabel;
    }
  };

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setIsLoading(true);

    if (messages.length === 0) {
      trackEvent("assistant-v2-first-message-sent", {
        messageLength: userMessage.trim().length,
        isMobile: isMobile,
      });
    }

    const userMsg: ChatMessage = {
      role: "user",
      content: userMessage.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setCurrentInput("");

    try {
      // Ensure the wallet is on the payment-channel network before signing.
      const switched = await switchIfNeeded();
      if (!switched) {
        throw new Error(`Please switch your wallet to ${getViemChain(network).name}`);
      }

      // Full conversation history, matching sc_llm_x402's { data: { prompt: [...] } } contract.
      const promptArray = [
        { role: "system", content: systemPromptMessage },
        ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: userMessage.trim() },
      ];

      const data = await payAndSend(promptArray);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.content ?? noResponseMessage,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
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

  const clearChat = () => setMessages([]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isConnected) {
        void sendMessage(currentInput);
      }
    }
  };

  const handleSendClick = () => {
    if (!isConnected) {
      connectWallet("assistant-v2", { hasInput: currentInput.trim().length > 0 });
      return;
    }
    void sendMessage(currentInput);
  };

  const receiptUrl = paymentReceipt ? explorerTxUrl(paymentReceipt.network, paymentReceipt.transaction) : null;

  return (
    <div className={styles.assistantPageContainer}>
      <div className={`${styles.assistantGrid} ${isMobile ? styles.assistantGridMobile : styles.assistantGridDesktop}`}>
        {/* Sidebar - desktop only */}
        {!isMobile && (
          <div className={styles.sidebar}>
            {/* Actions Section */}
            <div className={styles.sidebarSection}>
              <h4 className={styles.sidebarHeading}>{actionsLabel}</h4>
              <div className={styles.actionsContainer}>
                <button onClick={clearChat} className={`${styles.actionButton} ${styles.actionButtonSecondary}`}>
                  {clearChatLabel}
                </button>
              </div>
            </div>

            {/* Agent Info Section */}
            <div className={styles.sidebarSection}>
              <h4 className={styles.sidebarHeading}>Agent</h4>
              <AgentInfoPanel service="llm" variant="sidebar" />
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className={styles.chatArea}>
          {/* Mobile Header */}
          {isMobile && (
            <div className={styles.mobileHeader}>
              <h2 className={styles.mobileTitle}>{mobileTitleLabel}</h2>
              <div className={styles.mobileActions}>
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

          {/* Payment receipt (deposit tx on the first message) */}
          {receiptUrl && (
            <div className={css({ paddingX: "4", paddingBottom: "2", fontSize: "sm" })}>
              <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className={css({ color: "blue.600" })}>
                {viewPaymentLabel} ↗
              </a>
            </div>
          )}

          {/* Input Area */}
          <div className={styles.inputArea}>
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholderLabel}
              disabled={isLoading}
              className={styles.messageInput}
            />
            <button
              onClick={handleSendClick}
              onMouseEnter={() => {
                if (!isConnected) {
                  trackEvent("assistant-v2-connect-button-hover");
                }
              }}
              disabled={isLoading || (!isConnected ? false : !currentInput.trim())}
              className={styles.primaryButton}
            >
              {getButtonText(buttonState)}
            </button>
          </div>

          {/* Agent Info - Mobile Footer */}
          {isMobile && <AgentInfoPanel service="llm" variant="sidebar" />}
        </div>
      </div>
    </div>
  );
}
