/**
 * FeedbackWidget — an in-stream on-chain rating for ERC-8004 agents, mounted directly under
 * the chat's last completed answer (`/assistent`). One `giveFeedback` transaction per agent
 * that served the chat: the assistent (97599) always, the search agent (97600) once its tools
 * ran — one star pick, sent to all targets in order. The user never chooses a target: they
 * experienced one answer, not two services, so there is no target toggle to misunderstand.
 *
 * The interaction is quiet trigger → explain at the moment of commitment → confirm, the same
 * grammar as the donate flow: at rest the widget is nothing but five muted glyphs, and the
 * disclosure appears only once a star is picked — read exactly when it governs, instead of as
 * standing boilerplate. The full details (registry, 8004scan) sit in a native <details> whose
 * summary asks the question it answers. Stars stay in the muted chrome, not the orange "value
 * exchange" hue: a rating moves no money, so the design system's support colour stays reserved
 * for payments.
 *
 * The registry is external to this repo (github.com/erc-8004/erc-8004-contracts); the ABI
 * fragment below is vendored from its `abis/ReputationRegistry.json` and must match that
 * contract's `giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1,
 * string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)`.
 */
import React, { useState } from "react";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { css } from "../styled-system/css";
import { button } from "../styled-system/recipes";
import { useLocale } from "../hooks/useLocale";
import { useWalletConnection } from "../hooks/useWalletConnection";

/**
 * The one block to flip for a Base Sepolia rehearsal — chainId, registry and the explorer go to
 * the testnet values (`84532`, `0x8004B663056A597Dffe9eCcC1965A193B7388713`,
 * `https://sepolia.basescan.org`) and the ids in FEEDBACK_TARGETS go to 9547/9548 (from
 * `eth/scripts/deployments/erc8004-agents-baseSepolia.json`). A local flip, never merged.
 */
export const FEEDBACK = {
  chainId: 8453,
  registry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  explorer: "https://basescan.org",
} as const;

/**
 * What the chat actually paid, per rating target: the per-message completions go to the LLM
 * agent (97599), the `search_web` and `fetch_url` tool calls to the search agent (97600) — see
 * `tools/search.ts` and `tools/webFetch.ts`. Rating records the endpoint the rater used, so an
 * indexer can correlate the rating with the service rather than the site.
 */
export const FEEDBACK_TARGETS = {
  assistent: { agentId: 97599, endpoint: "https://llm-agent.fretchen.eu" },
  search: { agentId: 97600, endpoint: "https://web-agent.fretchen.eu" },
} as const;

/** One ERC-8004 agent a star pick is sent to. */
export interface FeedbackTarget {
  agentId: number;
  endpoint: string;
}

/** Vendored from erc-8004-contracts `abis/ReputationRegistry.json` — see the header comment.
 *  Exported so tests can assert the exact transaction shape (as FacilitatorApproval does for
 *  its ERC-20 fragment). */
export const REPUTATION_REGISTRY_ABI = [
  {
    type: "function",
    name: "giveFeedback",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "value", type: "int128" },
      { name: "valueDecimals", type: "uint8" },
      { name: "tag1", type: "string" },
      { name: "tag2", type: "string" },
      { name: "endpoint", type: "string" },
      { name: "feedbackURI", type: "string" },
      { name: "feedbackHash", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

/** `feedbackHash` is optional per the spec; zero says "no content hash". */
const ZERO_HASH = `0x${"0".repeat(64)}` as const;

// ─── Styles ──────────────────────────────────────────────────────────────────

const starsRow = css({
  display: "flex",
  alignItems: "center",
  gap: "xs",
});

const starButton = css({
  fontSize: "lg",
  lineHeight: "1",
  padding: "0",
  border: "none",
  background: "none",
  color: "textMuted",
  cursor: "pointer",
});

/** The confirm area: three stacked rows — disclosure, details, then the action row — so a
 *  long sentence never pushes the buttons onto a ragged line. Revealed together the moment a
 *  star is picked, so the decision is explained at the moment it is made. */
const actionArea = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "xs",
  marginTop: "xs",
});

/** Send and Cancel share one shape: same size, both bordered — hierarchy comes from the
 *  variant (primary vs secondary), never from a different silhouette. */
const actionButtonsRow = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "sm",
});

const details = css({
  fontSize: "xs",
  color: "textMuted",
  "& summary": { cursor: "pointer" },
});

const note = css({
  fontSize: "xs",
  color: "textMuted",
});

// ─── Component ───────────────────────────────────────────────────────────────

interface FeedbackWidgetProps {
  /** Every agent that served the chat; the pick is sent to each, in order. */
  targets: readonly FeedbackTarget[];
}

/** Single-line, truncated at 200 chars — a raw wallet error is unreadable and unbounded; the
 *  chat loop's `describeFailure` habit for the same reason. */
function oneLine(message: string): string {
  return message.length > 200 ? `${message.slice(0, 199)}…` : message;
}

export function FeedbackWidget({ targets }: FeedbackWidgetProps) {
  const { isConnected, connectWallet } = useWalletConnection();
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [stars, setStars] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentHashes, setSentHashes] = useState<`0x${string}`[]>([]);
  const [failedLine, setFailedLine] = useState<string | null>(null);

  const connectLabel = useLocale({ label: "assistent.rateConnect" });
  const switchLabel = useLocale({ label: "assistent.rateSwitch" });
  const starsLabel = useLocale({ label: "assistent.rateStars" });
  const disclosureLabel = useLocale({ label: "assistent.rateDisclosure" });
  const bundledDisclosureLabel = useLocale({ label: "assistent.rateDisclosureBundled" });
  const detailsSummaryLabel = useLocale({ label: "assistent.rateDetailsSummary" });
  const detailsBodyLabel = useLocale({ label: "assistent.rateDetailsBody" });
  const sendLabel = useLocale({ label: "assistent.rateSend" });
  const cancelLabel = useLocale({ label: "assistent.cancel" });
  const walletLabel = useLocale({ label: "assistent.rateWallet" });
  const doneLabel = useLocale({ label: "assistent.rateDone" });
  const failedLabel = useLocale({ label: "assistent.rateFailed" });
  const partialFailedLabel = useLocale({ label: "assistent.ratePartialFailed" });
  const selfBlockedLabel = useLocale({ label: "assistent.rateSelfBlocked" });

  // One wallet prompt per target, in order: the registry has no batching path, so a bundled
  // pick is a sequential loop. A rejection stops the loop where it stands — what already
  // landed stays on chain and is shown as a partial result, nothing is retried silently.
  // writeContractAsync resolves at SUBMISSION, not inclusion: a transaction that reverts at
  // execution still reaches the settled view, which is why the copy says "submitted" and the
  // basescan links are the status source.
  const send = async () => {
    if (stars === 0 || sending) return;
    setSending(true);
    setSentHashes([]);
    setFailedLine(null);
    const landed: `0x${string}`[] = [];
    for (const target of targets) {
      try {
        const hash = await writeContractAsync({
          address: FEEDBACK.registry,
          abi: REPUTATION_REGISTRY_ABI,
          functionName: "giveFeedback",
          chainId: FEEDBACK.chainId,
          // The EIP-8004 "starred" convention (its value/valueDecimals examples table): tag1
          // names the semantic, and a starred rating is expressed on a 0-100 scale. The UI's
          // 1-5 stars map to 20/40/60/80/100. A bare 1-5 value with an empty tag1 is
          // interface-legal but unclassifiable by an indexer — 8004scan counted such a
          // feedback (feedback_count) while excluding it from every score (average_score 0).
          args: [BigInt(target.agentId), BigInt((stars * 100) / 5), 0, "starred", "", target.endpoint, "", ZERO_HASH],
        });
        landed.push(hash);
        setSentHashes([...landed]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // The one revert the contract produces on purpose — its owner and operators rating
        // their own agent — gets its own sentence; everything else stays one truncated line.
        setFailedLine(
          msg.includes("Self-feedback not allowed") ? selfBlockedLabel : failedLabel.replace("{error}", oneLine(msg)),
        );
        break;
      }
    }
    setSending(false);
  };

  const allSent = sentHashes.length === targets.length && targets.length > 0;
  const partial = failedLine !== null && sentHashes.length > 0 && !sending;
  const settled = !sending && (allSent || partial);

  return (
    <div>
      <div className={starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={starButton}
            aria-label={starsLabel.replace("{n}", String(n))}
            aria-pressed={stars === n}
            disabled={sending || settled}
            onClick={() => setStars(n)}
          >
            {n <= stars ? "★" : "☆"}
          </button>
        ))}
      </div>

      {settled ? (
        <div className={actionArea}>
          <p className={note}>{allSent ? doneLabel : partialFailedLabel.replace("{error}", failedLine ?? "")}</p>
          {sentHashes.map((hash) => (
            <p className={note} key={hash}>
              <a href={`${FEEDBACK.explorer}/tx/${hash}`} target="_blank" rel="noopener noreferrer">
                ↗
              </a>
            </p>
          ))}
        </div>
      ) : (
        stars > 0 && (
          <div className={actionArea}>
            {!isConnected ? (
              <button
                type="button"
                className={button({ visual: "secondary", size: "sm" })}
                onClick={() => connectWallet("feedback")}
              >
                {connectLabel}
              </button>
            ) : chainId !== FEEDBACK.chainId ? (
              <button
                type="button"
                className={button({ visual: "secondary", size: "sm" })}
                onClick={() => void switchChainAsync({ chainId: FEEDBACK.chainId })}
              >
                {switchLabel}
              </button>
            ) : (
              <>
                <p className={note}>{targets.length > 1 ? bundledDisclosureLabel : disclosureLabel}</p>
                <details
                  className={details}
                  open={detailsOpen}
                  // preventDefault + state instead of the native toggle, so the open/closed
                  // state is deterministic (and testable) in every DOM implementation.
                  onClick={(e) => {
                    e.preventDefault();
                    setDetailsOpen(!detailsOpen);
                  }}
                >
                  <summary>{detailsSummaryLabel}</summary>
                  <p className={note}>{detailsBodyLabel.replace("{registry}", FEEDBACK.registry)}</p>
                </details>
                <div className={actionButtonsRow}>
                  <button
                    type="button"
                    className={button({ visual: "primary", size: "sm" })}
                    disabled={sending}
                    onClick={() => void send()}
                  >
                    {sendLabel}
                  </button>
                  <button
                    type="button"
                    className={button({ visual: "secondary", size: "sm" })}
                    disabled={sending}
                    onClick={() => setStars(0)}
                  >
                    {cancelLabel}
                  </button>
                </div>
                {sending && <p className={note}>{walletLabel}</p>}
                {failedLine && <p className={note}>{failedLine}</p>}
              </>
            )}
          </div>
        )
      )}
    </div>
  );
}
