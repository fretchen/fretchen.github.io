/**
 * ToolSelector — lets the user switch individual chat tools off.
 *
 * Transparency is only half the point. Tool definitions are input tokens charged on *every* hop
 * of a turn, and the paid endpoint caps both the count and the serialized size
 * (`MAX_TOOLS`/`MAX_TOOLS_BYTES` in `scw_js/llm_schemas.ts`), so switching a tool off makes the
 * conversation measurably cheaper as well as more legible.
 *
 * Selection state lives in the parent (AssistantChat), which persists it — the same split
 * AgentSelector uses, and for the same reason: the value also feeds the request the loop builds.
 */
import React from "react";
import { css } from "../styled-system/css";

export interface ToolSelectorOption {
  /** The tool's wire name, e.g. `generate_image` — also the key used for persistence. */
  name: string;
  /** Short human label; falls back to the wire name when absent. */
  label?: string;
}

export interface ToolSelectorProps {
  /** Only the tools this visitor may actually use — owner-gated ones are filtered out upstream. */
  options: readonly ToolSelectorOption[];
  /** Names the user has switched off. */
  disabled: ReadonlySet<string>;
  onToggle: (name: string, enabled: boolean) => void;
}

const listStyle = css({ display: "flex", flexDirection: "column", gap: "1", mt: "2" });
const rowStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  fontSize: "xs",
  color: "text",
  cursor: "pointer",
});
const headingStyle = css({ fontSize: "xs", color: "gray.500", mb: "1" });
const noteStyle = css({ fontSize: "xs", color: "textMuted", mt: "2" });

export function ToolSelector({ options, disabled, onToggle }: ToolSelectorProps) {
  if (options.length === 0) return null;

  const activeCount = options.filter((option) => !disabled.has(option.name)).length;

  return (
    <div className={css({ mt: "3" })}>
      <div className={headingStyle}>Tools</div>
      <div className={listStyle}>
        {options.map((option) => (
          <label key={option.name} className={rowStyle}>
            <input
              type="checkbox"
              checked={!disabled.has(option.name)}
              onChange={(event) => onToggle(option.name, event.target.checked)}
            />
            <span>{option.label ?? option.name}</span>
          </label>
        ))}
      </div>
      {activeCount === 0 && (
        <div className={noteStyle}>No tools offered — the assistant will answer from its own knowledge.</div>
      )}
    </div>
  );
}
