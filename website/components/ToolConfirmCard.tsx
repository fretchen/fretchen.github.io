import React, { useState } from "react";
import * as styles from "./ToolConfirmCard.styles";
import { ChainBadge } from "./ChainBadge";
import { button } from "../styled-system/recipes";

export type ToolSize = "1024x1024" | "1792x1024";

interface ToolConfirmCardProps {
  /** The model-written prompt, pre-filled and editable — the model sometimes embellishes. */
  prompt: string;
  size: ToolSize;
  /** No "failed" phase — see the type comment on ToolCardState in AssistantChat.tsx. */
  phase: "confirm" | "generating";
  network: string;
  title: string;
  promptLabel: string;
  sizeLabel: string;
  mintNotice: string;
  generateLabel: string;
  processingLabel: string;
  cancelLabel: string;
  onConfirm: (prompt: string, size: ToolSize) => void;
  onCancel: () => void;
}

const SIZE_OPTIONS: ToolSize[] = ["1024x1024", "1792x1024"];

/**
 * Pauses the chat's tool-call loop for explicit approval before a paid, chain-writing action.
 * Never auto-executes: `generate_image` spends the user's USDC and mints an NFT, and the model
 * writing the prompt is not consent to send it.
 *
 * Discloses the mint here, even though the resulting chat bubble does not surface the token
 * afterward (see `imagegen-in-chat-plan_1.md` §0.1) — informed consent before an irreversible
 * chain-write and UI clutter after it are different concerns.
 */
export function ToolConfirmCard({
  prompt,
  size,
  phase,
  network,
  title,
  promptLabel,
  sizeLabel,
  mintNotice,
  generateLabel,
  processingLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ToolConfirmCardProps) {
  const [editedPrompt, setEditedPrompt] = useState(prompt);
  const [editedSize, setEditedSize] = useState(size);
  const disabled = phase === "generating";

  return (
    <div className={styles.container}>
      <div className={styles.title}>{title}</div>

      <label className={styles.fieldLabel} htmlFor="tool-confirm-prompt">
        {promptLabel}
      </label>
      <textarea
        id="tool-confirm-prompt"
        className={styles.promptInput}
        value={editedPrompt}
        onChange={(e) => setEditedPrompt(e.target.value)}
        disabled={disabled}
      />

      <div className={styles.fieldLabel}>{sizeLabel}</div>
      <div className={styles.sizeRow}>
        {SIZE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={editedSize === option}
            disabled={disabled}
            onClick={() => setEditedSize(option)}
            className={button({ visual: "secondary", size: "sm", active: editedSize === option })}
          >
            {option}
          </button>
        ))}
      </div>

      <div className={styles.metaRow}>
        <span>$0.07 USDC</span>
        <ChainBadge network={network} size="sm" position="inline" />
      </div>
      <div className={styles.mintNotice}>{mintNotice}</div>

      <div className={styles.actionsRow}>
        <button
          type="button"
          disabled={disabled || !editedPrompt.trim()}
          onClick={() => onConfirm(editedPrompt.trim(), editedSize)}
          className={button({ visual: "support" })}
        >
          {disabled ? processingLabel : generateLabel}
        </button>
        <button type="button" disabled={disabled} onClick={onCancel} className={button({ visual: "ghost" })}>
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

export default ToolConfirmCard;
