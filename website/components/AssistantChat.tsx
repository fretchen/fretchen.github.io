/**
 * AssistantChat — the interactive core of the x402 batch-settlement chat assistant
 * (`/assistent`). Pays per message via `useX402Chat` (USDC payment channels): the
 * first message opens a channel (one wallet-signed deposit), later messages are
 * off-chain voucher signatures reusing the open channel.
 */

import React, { useState, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentInfoPanel } from "./AgentInfoPanel";
import { AgentSelector } from "./AgentSelector";
import * as chat from "./AssistantChat.styles";
import { useLocale } from "../hooks/useLocale";
import { useUmami } from "../hooks/useUmami";
import { css } from "../styled-system/css";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { useX402Chat, DEFAULT_LLM_AGENT_URL } from "../hooks/useX402Chat";
import { fetchAgentCard, precheckLlmV1Agent, type AgentCard } from "../hooks/x402Discovery";
import { getViemChain } from "@fretchen/chain-utils";
import { button } from "../styled-system/recipes";

// The custom-URL escape hatch (AgentSelector) lets the chat pay any llm/v1 agent. It is also
// the only ready-made batch-settlement client there is, so it doubles as the end-to-end test
// for anyone following the build guide at /agent-onboarding. A curated picker (rather than a
// URL box) waits until there are enough compatible agents to be worth listing.

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// Production: Base Mainnet only. Real USDC, real Mistral responses.
const CHAT_NETWORKS = ["eip155:8453"] as const;

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

export function AssistantChat() {
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
  const { network, switchIfNeeded, switchError } = useAutoNetwork(CHAT_NETWORKS);

  // A custom agent, once one has been pre-checked and accepted. Null = the default agent.
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [customCard, setCustomCard] = useState<AgentCard | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [checkState, setCheckState] = useState<"idle" | "checking" | "error">("idle");
  const [checkError, setCheckError] = useState<string | null>(null);

  const agentUrl = customUrl ?? DEFAULT_LLM_AGENT_URL;
  const { sendMessage: payAndSend, paymentReceipt } = useX402Chat(network, agentUrl);

  // Provenance of the agent actually serving this chat (operator + payTo + origin), read
  // live from its own /openapi.json + 402 so the sidebar can honestly show who the user pays.
  const [agentCard, setAgentCard] = useState<AgentCard | null>(null);
  useEffect(() => {
    let cancelled = false;
    void fetchAgentCard(DEFAULT_LLM_AGENT_URL).then((card) => {
      if (!cancelled) setAgentCard(card);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The card shown (and paid) is the custom agent's whenever one is selected.
  const activeCard = customCard ?? agentCard;

  const tryCustomAgent = async () => {
    const url = customUrlInput.trim();
    if (!url) return;
    setCheckState("checking");
    setCheckError(null);
    const result = await precheckLlmV1Agent(url);
    if (!result.ok) {
      setCheckState("error");
      setCheckError(result.reason ?? "This agent is not compatible.");
      return;
    }
    setCheckState("idle");
    setCustomUrl(url);
    setCustomCard(result.card ?? null);
    setMessages([]);
    trackEvent("assistant-v2-custom-agent-selected");
  };

  const useDefaultAgent = () => {
    setCustomUrl(null);
    setCustomCard(null);
    setCustomUrlInput("");
    setCheckState("idle");
    setCheckError(null);
    setMessages([]);
  };

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
        throw new Error(switchError ?? `Please switch your wallet to ${getViemChain(network).name}`);
      }

      // Full conversation history, as the OpenAI `messages[]` array sc_llm_x402 expects.
      const promptArray = [
        { role: "system", content: systemPromptMessage },
        ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: userMessage.trim() },
      ];

      const data = await payAndSend(promptArray);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.choices?.[0]?.message?.content ?? noResponseMessage,
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
    <div className={chat.pageContainer}>
      <div className={`${chat.grid} ${isMobile ? chat.gridMobile : chat.gridDesktop}`}>
        {/* Sidebar - desktop only */}
        {!isMobile && (
          <div className={chat.sidebar}>
            {/* Actions Section */}
            <div className={chat.sidebarSection}>
              <h4 className={chat.sidebarHeading}>{actionsLabel}</h4>
              <div className={chat.actionsContainer}>
                <button onClick={clearChat} className={button({ visual: "ghost", size: "sm" })}>
                  {clearChatLabel}
                </button>
              </div>
            </div>

            {/* Agent Info Section */}
            <div className={chat.sidebarSection}>
              <h4 className={chat.sidebarHeading}>Agent</h4>
              <AgentInfoPanel service="llm" variant="sidebar" agentCard={activeCard} />
              <AgentSelector
                customUrlInput={customUrlInput}
                onCustomUrlInputChange={setCustomUrlInput}
                customCard={customCard}
                checkState={checkState}
                checkError={checkError}
                onTryCustomAgent={() => void tryCustomAgent()}
                onUseDefaultAgent={useDefaultAgent}
              />
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className={chat.chatArea}>
          {/* Mobile Header */}
          {isMobile && (
            <div className={chat.mobileHeader}>
              <h2 className={chat.mobileTitle}>{mobileTitleLabel}</h2>
              <div className={chat.mobileActions}>
                <button onClick={clearChat} className={button({ visual: "secondary", size: "sm" })} title="Clear Chat">
                  🗑️
                </button>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div className={chat.messagesContainer}>
            {messages.length === 0 ? (
              <div className={chat.emptyState}>{emptyStateLabel}</div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`${chat.messageContainer} ${
                    message.role === "user" ? chat.messageContainerUser : chat.messageContainerAssistant
                  }`}
                >
                  <div
                    className={`${chat.messageBubble} ${
                      message.role === "user" ? chat.messageBubbleUser : chat.messageBubbleAssistant
                    }`}
                  >
                    <div className={chat.messageRole}>{message.role === "user" ? youLabel : assistantLabel}</div>
                    <div className={chat.messageContent}>
                      {message.role === "assistant" ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      ) : (
                        <div className={chat.messageContentPlain}>{message.content}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className={chat.loadingMessage}>
                <div className={chat.loadingBubble}>{typingLabel}</div>
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
          <div className={chat.inputArea}>
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholderLabel}
              disabled={isLoading}
              className={chat.messageInput}
            />
            <button
              onClick={handleSendClick}
              onMouseEnter={() => {
                if (!isConnected) {
                  trackEvent("assistant-v2-connect-button-hover");
                }
              }}
              disabled={isLoading || (!isConnected ? false : !currentInput.trim())}
              className={button()}
            >
              {getButtonText(buttonState)}
            </button>
          </div>

          {/* Agent Info - Mobile Footer */}
          {isMobile && (
            <>
              <AgentInfoPanel service="llm" variant="sidebar" agentCard={activeCard} />
              <AgentSelector
                customUrlInput={customUrlInput}
                onCustomUrlInputChange={setCustomUrlInput}
                customCard={customCard}
                checkState={checkState}
                checkError={checkError}
                onTryCustomAgent={() => void tryCustomAgent()}
                onUseDefaultAgent={useDefaultAgent}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssistantChat;
