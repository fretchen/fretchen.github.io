/**
 * AgentSelector — the /assistent escape hatch (open-agent-platform G3/G4).
 *
 * Lets the user point the chat at any llm/v1 agent by URL. The URL is pre-checked
 * (`precheckLlmV1Agent`) before it can be selected, and the resulting provenance
 * (operator + payTo + origin) is shown so the user knows who they are about to pay.
 * State lives in the parent (AssistantChat) because the selected URL also feeds useX402Chat.
 */
import React from "react";
import { css } from "../styled-system/css";
import * as styles from "../layouts/styles";
import type { AgentCard } from "../hooks/x402Discovery";

export interface AgentSelectorProps {
  /** The pasted URL (controlled input). */
  customUrlInput: string;
  onCustomUrlInputChange: (value: string) => void;
  /** Provenance of the currently selected custom agent, or null when on the default. */
  customCard: AgentCard | null;
  checkState: "idle" | "checking" | "error";
  checkError: string | null;
  onTryCustomAgent: () => void;
  onUseDefaultAgent: () => void;
}

const rowStyle = css({ display: "flex", gap: "2", flexWrap: "wrap", alignItems: "center", mt: "2" });
const monoStyle = css({ fontFamily: "mono", fontSize: "xs", color: "gray.600", wordBreak: "break-all" });
const errorStyle = css({ fontSize: "xs", color: "red.600", mt: "1" });
const hintStyle = css({ mt: "2" });
const hintLinkStyle = css({
  fontSize: "xs",
  color: "brand",
  textDecoration: "none",
  _hover: { textDecoration: "underline" },
});
const inputStyle = css({
  width: "100%",
  fontSize: "xs",
  px: "2",
  py: "1",
  border: "1px solid",
  borderColor: "gray.300",
  borderRadius: "md",
  _focus: { outline: "none", borderColor: "brand" },
});

export function AgentSelector({
  customUrlInput,
  onCustomUrlInputChange,
  customCard,
  checkState,
  checkError,
  onTryCustomAgent,
  onUseDefaultAgent,
}: AgentSelectorProps) {
  const checking = checkState === "checking";

  return (
    <div className={css({ mt: "3" })}>
      <div className={css({ fontSize: "xs", color: "gray.500", mb: "1" })}>
        {customCard ? "Custom agent (at your own risk)" : "Use a different agent"}
      </div>

      {customCard ? (
        // Pre-payment disclosure for the selected custom agent (G4/G6).
        <div>
          <div className={monoStyle}>{customCard.operator ?? customCard.origin}</div>
          {customCard.payTo && (
            <div className={monoStyle} title="Payment recipient">
              pays → {customCard.payTo.slice(0, 6)}…{customCard.payTo.slice(-4)}
            </div>
          )}
          <div className={rowStyle}>
            <button onClick={onUseDefaultAgent} className={`${styles.actionButton} ${styles.actionButtonSecondary}`}>
              Back to default agent
            </button>
          </div>
        </div>
      ) : (
        <div>
          <input
            type="url"
            inputMode="url"
            placeholder="https://another-agent.example"
            value={customUrlInput}
            onChange={(e) => onCustomUrlInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onTryCustomAgent();
              }
            }}
            disabled={checking}
            className={inputStyle}
          />
          <div className={rowStyle}>
            <button
              onClick={onTryCustomAgent}
              disabled={checking || !customUrlInput.trim()}
              className={styles.actionButton}
            >
              {checking ? "Checking…" : "Use this agent"}
            </button>
          </div>
          {checkState === "error" && checkError && <div className={errorStyle}>{checkError}</div>}
          {/* This box is exactly where someone wonders how to get their own agent here. */}
          <div className={hintStyle}>
            <a href="/agent-onboarding" className={hintLinkStyle}>
              How to bring your own agent →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentSelector;
