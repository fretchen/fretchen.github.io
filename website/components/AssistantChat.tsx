/**
 * AssistantChat — the interactive core of the x402 batch-settlement chat assistant
 * (`/assistent`). Pays per message via `useX402Chat` (USDC payment channels): the
 * first message opens a channel (one wallet-signed deposit), later messages are
 * off-chain voucher signatures reusing the open channel.
 */

import React, { useState, useMemo, useEffect, useRef, useSyncExternalStore } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BaseError, UserRejectedRequestError } from "viem";
import { AgentInfoPanel } from "./AgentInfoPanel";
import { AgentSelector } from "./AgentSelector";
import { ToolConfirmCard, type ToolSize } from "./ToolConfirmCard";
import * as chat from "./AssistantChat.styles";
import { useLocale } from "../hooks/useLocale";
import { useUmami } from "../hooks/useUmami";
import { css } from "../styled-system/css";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { useX402Chat, DEFAULT_LLM_AGENT_URL } from "../hooks/useX402Chat";
import { useX402ImageGeneration } from "../hooks/useX402ImageGeneration";
import { fetchAgentCard, precheckLlmV1Agent, type AgentCard } from "../hooks/x402Discovery";
import { generateImageTool } from "../tools/generateImage";
import type { X402ChatMessage, X402ToolCall } from "../types/x402";
import { getViemChain, toCAIP2, fromCAIP2, GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";
import { useChainId } from "wagmi";
import { ChainBadge, getChainName } from "./ChainBadge";
import { button } from "../styled-system/recipes";
import { PageHeader } from "./PageHeader";

// Hops in one sendMessage() call before giving up and showing the fallback message — the
// circuit breaker on a model that keeps requesting tools instead of answering. Each hop is a
// separately metered chat message, so this also bounds worst-case cost per user turn.
const MAX_HOPS = 3;

/**
 * Classify a thrown `generateImage` error into what the model needs to react sensibly, without
 * string-matching upstream/provider error text. Two cases are reliably detectable: a rejected
 * wallet signature (a typed viem error, found via `.walk()` since wagmi commonly wraps it) and
 * this file's own `validatingFetch` network-mismatch message (ours, not upstream, so matching it
 * is not brittle). Everything else — insufficient balance, API failures, timeouts — folds into
 * `generation_failed`; there is no reliable, non-string-matched way to split those further.
 */
function classifyImageError(err: unknown): "user_declined" | "wrong_network" | "generation_failed" {
  if (err instanceof BaseError && err.walk((e) => e instanceof UserRejectedRequestError)) {
    return "user_declined";
  }
  const message = err instanceof Error ? err.message : String(err);
  if (message.startsWith("Network mismatch!")) return "wrong_network";
  return "generation_failed";
}

// The custom-URL escape hatch (AgentSelector) lets the chat pay any llm/v1 agent. It is also
// the only ready-made batch-settlement client there is, so it doubles as the end-to-end test
// for anyone following the build guide at /agent-onboarding. A curated picker (rather than a
// URL box) waits until there are enough compatible agents to be worth listing.

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  /** Set when this turn's answer came after a generate_image tool call. Display only — never
   *  sent back to the model; the model's own closing text is its memory of having made it. */
  imageUrl?: string;
}

/** The confirm card's lifecycle. No "failed" phase: a cancel or error clears the card
 *  immediately and the tool result carries the status — the *next* hop's assistant text
 *  explains what happened, so there is nothing further for the card itself to show. */
type ToolCardState = { phase: "confirm" | "generating"; prompt: string; size: ToolSize };

// Production mainnets. Real USDC, real Mistral responses. Optimism is first, so it is the
// default for a wallet that is on neither; a wallet already on Base keeps paying on Base
// (useAutoNetwork honours the connected chain whenever it is in this list).
const CHAT_NETWORKS = ["eip155:10", "eip155:8453"] as const;

// localStorage key for the user's explicit network choice. Worth persisting rather than
// re-deriving from the wallet each visit: a channel is per (network, receiver) and each one
// escrows MINIMUM_DEPOSIT_ATOMIC ($0.50, see useX402Chat). If the paid network drifted with
// whatever chain the wallet happened to be on, a user would silently open a second channel
// and lock a second $0.50 that only comes back via a refund or the 24h withdrawDelay.
const NETWORK_PREFERENCE_KEY = "x402-chat-network";

/**
 * The preference as an external store, read via `useSyncExternalStore`. localStorage is
 * client-only, so a plain `useState` initialiser would disagree with the server-rendered
 * markup; the explicit server snapshot below (always null → the Optimism default) makes
 * that impossible. Subscribing to `storage` also keeps two open tabs in agreement.
 */
const networkListeners = new Set<() => void>();

function readStoredNetwork(): string | null {
  const stored = window.localStorage.getItem(NETWORK_PREFERENCE_KEY);
  // Ignore a network the site no longer pays on (an old testnet, a dropped chain).
  return stored && (CHAT_NETWORKS as readonly string[]).includes(stored) ? stored : null;
}

function subscribeToStoredNetwork(onChange: () => void): () => void {
  networkListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    networkListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function storeNetwork(network: string): void {
  window.localStorage.setItem(NETWORK_PREFERENCE_KEY, network);
  // `storage` only fires in *other* tabs, so notify this one explicitly.
  networkListeners.forEach((listener) => listener());
}

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
  const titleLabel = useLocale({ label: "assistent.title" });
  const emptyStateLabel = useLocale({ label: "assistent.emptyState" });
  const youLabel = useLocale({ label: "assistent.you" });
  const assistantLabel = useLocale({ label: "assistent.assistant" });
  const placeholderLabel = useLocale({ label: "assistent.placeholder" });
  const viewPaymentLabel = useLocale({ label: "assistent.viewPayment" });
  const networkLabel = useLocale({ label: "assistent.network" });
  const networkFallbackLabel = useLocale({ label: "assistent.networkFallback" });
  const cancelLabel = useLocale({ label: "assistent.cancel" });
  const processingLabel = useLocale({ label: "assistent.processing" });
  const toolConfirmTitleLabel = useLocale({ label: "assistent.toolConfirmTitle" });
  const toolConfirmPromptLabel = useLocale({ label: "assistent.toolConfirmPromptLabel" });
  const toolConfirmSizeLabel = useLocale({ label: "assistent.toolConfirmSizeLabel" });
  const toolConfirmMintNoticeLabel = useLocale({ label: "assistent.toolConfirmMintNotice" });
  const toolConfirmGenerateLabel = useLocale({ label: "assistent.toolConfirmGenerate" });

  // Mobile detection
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { isConnected, connectWallet } = useWalletConnection();

  // The user's explicit network choice, if they made one.
  const preferredNetwork = useSyncExternalStore(subscribeToStoredNetwork, readStoredNetwork, () => null);

  // Precedence: explicit choice → the wallet's own chain if we support it → Optimism.
  const walletNetwork = toCAIP2(useChainId());
  const desiredNetwork =
    preferredNetwork ??
    ((CHAT_NETWORKS as readonly string[]).includes(walletNetwork) ? walletNetwork : CHAT_NETWORKS[0]);

  // A custom agent, once one has been pre-checked and accepted. Null = the default agent.
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [customCard, setCustomCard] = useState<AgentCard | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [checkState, setCheckState] = useState<"idle" | "checking" | "error">("idle");
  const [checkError, setCheckError] = useState<string | null>(null);

  const agentUrl = customUrl ?? DEFAULT_LLM_AGENT_URL;
  // The hook may negotiate away from `desiredNetwork` when the agent doesn't offer it (e.g. a
  // Base-only third-party agent while the user prefers Optimism), so the wallet must be
  // switched to what will actually be paid — `paymentNetwork`, not the preference.
  const { sendMessage: payAndSend, paymentReceipt, paymentNetwork } = useX402Chat(desiredNetwork, agentUrl);
  const { network, switchIfNeeded, switchError } = useAutoNetwork([paymentNetwork]);

  // The image tool pays on a different network/scheme (exact, genimg's own wallet signature)
  // than chat's batch-settlement channel — see useX402ImageGeneration.ts. It does not switch
  // chains itself, so this mirrors ImageGenerator.tsx's own useAutoNetwork(GENAI_NFT_NETWORKS).
  const { network: imageNetwork, switchIfNeeded: switchImageIfNeeded } = useAutoNetwork(GENAI_NFT_NETWORKS);
  const { generateImage } = useX402ImageGeneration();

  // The confirm card is transient UI state, never a chat message — it cannot be scrolled back
  // to or replayed. `confirmResolverRef` is how a linear async loop (sendMessage) pauses for a
  // user click without turning into a state machine: waitForConfirmation() below stores the
  // Promise's resolve function here, and the card's own buttons call it.
  const [toolCard, setToolCard] = useState<ToolCardState | null>(null);
  const confirmResolverRef = useRef<
    ((r: { action: "confirm"; prompt: string; size: ToolSize } | { action: "cancel" }) => void) | null
  >(null);

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

  /** Pauses the loop until the confirm card's Generate/Cancel resolves it. */
  function waitForConfirmation(prompt: string, size: ToolSize) {
    return new Promise<{ action: "confirm"; prompt: string; size: ToolSize } | { action: "cancel" }>((resolve) => {
      confirmResolverRef.current = resolve;
      setToolCard({ phase: "confirm", prompt, size });
    });
  }

  /**
   * Runs one tool call end to end: pause for the user's confirmation, generate the image on
   * its own network/scheme, and return the compact `{status}` result the model gets back plus
   * the image URL for local rendering. Never throws — every failure path resolves to a status
   * the model can react to.
   */
  async function runToolCall(
    call: X402ToolCall,
  ): Promise<{ result: { status: string; network?: string }; imageUrl?: string }> {
    let args: { prompt?: string; size?: string } = {};
    try {
      args = JSON.parse(call.function.arguments) as typeof args;
    } catch {
      // The model sent malformed JSON arguments — fall through with an empty prompt; the
      // confirm card still lets the user type one before approving.
    }
    const initialPrompt = typeof args.prompt === "string" ? args.prompt : "";
    const initialSize: ToolSize = args.size === "1792x1024" ? "1792x1024" : "1024x1024";

    const resolution = await waitForConfirmation(initialPrompt, initialSize);
    if (resolution.action === "cancel") {
      setToolCard(null);
      return { result: { status: "user_declined" } };
    }

    setToolCard({ phase: "generating", prompt: resolution.prompt, size: resolution.size });

    const switchedToImageNetwork = await switchImageIfNeeded();
    if (!switchedToImageNetwork) {
      setToolCard(null);
      return { result: { status: "wrong_network" } };
    }

    try {
      const image = await generateImage({
        prompt: resolution.prompt,
        size: resolution.size,
        network: imageNetwork,
        expectedChainId: fromCAIP2(imageNetwork),
        isListed: false, // never a chat-time decision — see the confirm card's mint notice instead
      });
      setToolCard(null);
      return { result: { status: "ok", network: imageNetwork }, imageUrl: image.imageUrl };
    } catch (err) {
      setToolCard(null);
      return { result: { status: classifyImageError(err) } };
    }
  }

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
      // Full conversation history, as the OpenAI `messages[]` array sc_llm_x402 expects. Tool
      // turns pushed inside the loop below live only in this local array — never in `messages`
      // state, so a previous tool call is never replayed to the model on a later message. Its
      // own final text turn is the model's whole memory of having made an image.
      const convo: X402ChatMessage[] = [
        { role: "system", content: systemPromptMessage },
        ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: userMessage.trim() },
      ];

      let finalContent: string | null = null;
      let finalImageUrl: string | undefined;

      for (let hop = 0; hop < MAX_HOPS; hop++) {
        // Cheap no-op once the wallet is already on the right chain — re-checked every hop
        // because a mid-loop deposit/top-up could in principle need it, not just the first send.
        const switched = await switchIfNeeded();
        if (!switched) {
          throw new Error(switchError ?? `Please switch your wallet to ${getViemChain(network).name}`);
        }

        const data = await payAndSend(convo, { tools: [generateImageTool], tool_choice: "auto" });
        const choice = data.choices?.[0];
        const toolCalls = choice?.message.tool_calls;

        if (choice?.finish_reason !== "tool_calls" || !toolCalls?.length) {
          // `??` alone doesn't catch this: Mistral can return content: "" (or whitespace) with
          // finish_reason: "stop" — a real, empty-but-not-nullish completion — which used to
          // render as a literally blank bubble instead of falling back to noResponseMessage.
          const content = choice?.message.content;
          finalContent = content && content.trim().length > 0 ? content : noResponseMessage;
          break;
        }

        convo.push(choice.message); // the assistant turn, content: null, tool_calls intact

        for (const call of toolCalls) {
          const { result, imageUrl } = await runToolCall(call);
          if (imageUrl) finalImageUrl = imageUrl;
          convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
        }
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: finalContent ?? noResponseMessage,
        timestamp: Date.now(),
        imageUrl: finalImageUrl,
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
      setToolCard(null);
      setIsLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  // Nulling the ref after resolving is what makes a double-click harmless: the second click
  // resolves nothing, since only the first reaches a live resolver.
  function handleToolConfirm(prompt: string, size: ToolSize) {
    confirmResolverRef.current?.({ action: "confirm", prompt, size });
    confirmResolverRef.current = null;
  }

  function handleToolCancel() {
    confirmResolverRef.current?.({ action: "cancel" });
    confirmResolverRef.current = null;
  }

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

            {/* Network Section */}
            <div className={chat.sidebarSection}>
              <h4 className={chat.sidebarHeading}>{networkLabel}</h4>
              <div className={chat.networkOptions}>
                {CHAT_NETWORKS.map((option) => {
                  const selected = paymentNetwork === option;
                  return (
                    <button
                      key={option}
                      onClick={() => storeNetwork(option)}
                      aria-pressed={selected}
                      aria-label={getChainName(option)}
                      className={button({ visual: "secondary", size: "sm", active: selected })}
                    >
                      <span className={selected ? undefined : chat.networkOptionMuted}>
                        <ChainBadge network={option} size="sm" position="inline" />
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Only surfaced when the agent forced our hand — otherwise the buttons speak
                  for themselves and a permanent caption would just be noise. */}
              {paymentNetwork !== desiredNetwork && (
                <p className={chat.networkNote}>
                  {networkFallbackLabel} <ChainBadge network={paymentNetwork} size="sm" position="inline" />.
                </p>
              )}
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
          {/* Page heading. /assistent is `explore` territory (utils/territory.ts) but never
              showed it — the rule under the title is how every other section announces where
              you are (see pages/x402/+Page.tsx). Rendered once for both viewports so the page
              never carries two competing headings; on mobile it keeps the clear-chat button
              beside it, which is what the old mobile-only header existed for. */}
          <div className={chat.titleRow}>
            <div>
              <PageHeader title={titleLabel} territory="explore" />
            </div>
            {isMobile && (
              <div className={chat.mobileActions}>
                <button onClick={clearChat} className={button({ visual: "secondary", size: "sm" })} title="Clear Chat">
                  🗑️
                </button>
              </div>
            )}
          </div>

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
                    {/* The assistant's reply is prose, so it takes the serif; your own message
                        is input to a tool and stays in the sans. See IDENTITY.md. */}
                    <div
                      className={`${chat.messageContent} ${
                        message.role === "assistant" ? chat.messageContentReading : ""
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      ) : (
                        <div className={chat.messageContentPlain}>{message.content}</div>
                      )}
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt=""
                          className={css({ maxWidth: "100%", borderRadius: "md", marginTop: "2" })}
                        />
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

            {toolCard && (
              <ToolConfirmCard
                prompt={toolCard.prompt}
                size={toolCard.size}
                phase={toolCard.phase}
                network={imageNetwork}
                title={toolConfirmTitleLabel}
                promptLabel={toolConfirmPromptLabel}
                sizeLabel={toolConfirmSizeLabel}
                mintNotice={toolConfirmMintNoticeLabel}
                generateLabel={toolConfirmGenerateLabel}
                processingLabel={processingLabel}
                cancelLabel={cancelLabel}
                onConfirm={handleToolConfirm}
                onCancel={handleToolCancel}
              />
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
