/**
 * FeedbackWidget — a one-tap on-chain rating for an ERC-8004 agent, mounted below the chat
 * (`/assistent`). One `giveFeedback` transaction to the ERC-8004 ReputationRegistry on Base:
 * 1–5 stars, no free text in v1 (tags send empty strings, which the contract treats as absent).
 * Everything is disclosed in place — the write is public, permanent, and paid from the rater's
 * own gas — and the wallet is the one already connected for the chat, so rating never costs a
 * second connect prompt.
 *
 * The registry is external to this repo (github.com/erc-8004/erc-8004-contracts); the ABI
 * fragment below is vendored from its `abis/ReputationRegistry.json` and must match that
 * contract's `giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1,
 * string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)`.
 */
import React, { useState } from "react";
import { useAccount, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
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

const note = css({
  fontSize: "xs",
  color: "textMuted",
  marginTop: "xs",
});

// ─── Component ───────────────────────────────────────────────────────────────

interface FeedbackWidgetProps {
  /** ERC-8004 agentId in the Identity Registry — see FEEDBACK_TARGETS. */
  agentId: number;
  /** The service endpoint the rater actually used; recorded on-chain in the NewFeedback event. */
  endpoint: string;
}

/** Single-line, truncated at 200 chars — an unbounded wallet error is a recurring eyesore, not
 *  input tokens (that habit is the chat loop's), but the habit is the same. */
function oneLine(message: string): string {
  return message.length > 200 ? `${message.slice(0, 199)}…` : message;
}

export function FeedbackWidget({ agentId, endpoint }: FeedbackWidgetProps) {
  const { isConnected, connectWallet } = useWalletConnection();
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContract, isPending, error, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: FEEDBACK.chainId,
  });
  const [stars, setStars] = useState(0);

  const connectLabel = useLocale({ label: "assistent.rateConnect" });
  const switchLabel = useLocale({ label: "assistent.rateSwitch" });
  const starsLabel = useLocale({ label: "assistent.rateStars" });
  const disclosureLabel = useLocale({ label: "assistent.rateDisclosure" });
  const detailsSummaryLabel = useLocale({ label: "assistent.rateDetailsSummary" });
  const detailsBodyLabel = useLocale({ label: "assistent.rateDetailsBody" });
  const sendLabel = useLocale({ label: "assistent.rateSend" });
  const walletLabel = useLocale({ label: "assistent.rateWallet" });
  const confirmingLabel = useLocale({ label: "assistent.rateConfirming" });
  const doneLabel = useLocale({ label: "assistent.rateDone" });
  const failedLabel = useLocale({ label: "assistent.rateFailed" });
  const selfBlockedLabel = useLocale({ label: "assistent.rateSelfBlocked" });

  if (!isConnected) {
    return (
      <div className={note}>
        <button
          type="button"
          className={button({ visual: "ghost", size: "sm" })}
          onClick={() => connectWallet("feedback")}
        >
          {connectLabel}
        </button>
      </div>
    );
  }

  if (isSuccess && txHash) {
    return (
      <div className={note}>
        {doneLabel}{" "}
        <a href={`${FEEDBACK.explorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
          ↗
        </a>
      </div>
    );
  }

  if (chainId !== FEEDBACK.chainId) {
    return (
      <div className={note}>
        <button
          type="button"
          className={button({ visual: "secondary", size: "sm" })}
          onClick={() => void switchChainAsync({ chainId: FEEDBACK.chainId })}
        >
          {switchLabel}
        </button>
      </div>
    );
  }

  // The one revert the contract produces on purpose — its owner and operators rating their own
  // agent — gets its own sentence; everything else stays one truncated line, like the chat loop's
  // describeFailure habit, because a raw wallet error is unreadable and unbounded.
  const errorLine = error
    ? error.message.includes("Self-feedback not allowed")
      ? selfBlockedLabel
      : failedLabel.replace("{error}", oneLine(error.message))
    : null;

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
            disabled={isPending || isConfirming}
            onClick={() => setStars(n)}
          >
            {n <= stars ? "★" : "☆"}
          </button>
        ))}
      </div>
      <p className={note}>{disclosureLabel}</p>
      <details className={note}>
        <summary>{detailsSummaryLabel}</summary>
        {detailsBodyLabel.replace("{registry}", FEEDBACK.registry)}
      </details>
      <button
        type="button"
        className={button({ visual: "secondary", size: "sm" })}
        disabled={stars === 0 || isPending || isConfirming}
        onClick={() =>
          writeContract({
            address: FEEDBACK.registry,
            abi: REPUTATION_REGISTRY_ABI,
            functionName: "giveFeedback",
            chainId: FEEDBACK.chainId,
            args: [BigInt(agentId), BigInt(stars), 0, "", "", endpoint, "", ZERO_HASH],
          })
        }
      >
        {sendLabel}
      </button>
      {(isPending || isConfirming) && <p className={note}>{isPending ? walletLabel : confirmingLabel}</p>}
      {errorLine && <p className={note}>{errorLine}</p>}
    </div>
  );
}
