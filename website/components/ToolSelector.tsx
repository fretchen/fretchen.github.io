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
 *
 * A row is not always one tool. `AssistantChat` may present several wire names as one capability
 * — Bundestakt's session lookup and its fact-checker are two tools and two API calls, but one
 * thing a visitor decides about — so `names` is always an array, and the checkbox is only one
 * click regardless of how many tools it stands for.
 */
import React from "react";
import { css } from "../styled-system/css";
import { LocaleText } from "./LocaleText";

export interface ToolSelectorOption {
  /** Every wire name this row switches together — one entry for an ordinary tool, several for a
   *  grouped capability. Also the keys used for persistence. */
  names: string[];
  /**
   * Locale key for the row's name (`LocaleText` falls back to rendering it verbatim, so a plain
   * string still works). Falls back to the wire names when absent entirely.
   */
  label?: string;
  /**
   * Locale key for the one-line explanation shown under the label. A tester unfamiliar with
   * "Bundestagssitzungen" is exactly who this is for — optional so a row can still render
   * without one, but every current entry in `TOOL_REGISTRY` supplies one.
   */
  description?: string;
}

export interface ToolSelectorProps {
  /** Only the tools this visitor may actually use — owner-gated ones are filtered out upstream. */
  options: readonly ToolSelectorOption[];
  /** Wire names the user has switched off. */
  disabled: ReadonlySet<string>;
  /** All of a row's wire names at once, so a grouped capability toggles as the one decision it
   *  visually is rather than needing two clicks that happen to always agree. */
  onToggle: (names: string[], enabled: boolean) => void;
}

const listStyle = css({ display: "flex", flexDirection: "column", gap: "2", mt: "2" });
const rowStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  fontSize: "xs",
  color: "text",
  cursor: "pointer",
});
// Indented roughly under the label text, not the checkbox — a visual "this explains the row
// above" rather than a third column of its own.
const descriptionStyle = css({ fontSize: "xs", color: "textMuted", pl: "5" });
const headingStyle = css({ fontSize: "xs", color: "gray.500", mb: "1" });
const noteStyle = css({ fontSize: "xs", color: "textMuted", mt: "2" });

export function ToolSelector({ options, disabled, onToggle }: ToolSelectorProps) {
  if (options.length === 0) return null;

  // "No tools offered" means every wire name across every row is switched off — a row with some
  // members still on is still doing something, even if this component only ever hands out
  // whole-row toggles today.
  const anyEnabled = options.some((option) => option.names.some((name) => !disabled.has(name)));

  return (
    <div>
      {/* "What I can do" rather than "Tools": for a first-time visitor this list is the readable
          answer to what the assistant is able to do. Switching an entry off is the secondary
          use, so it does not get to name the section. */}
      <div className={headingStyle}>
        <LocaleText label="assistent.capabilities" />
      </div>
      <div className={listStyle}>
        {options.map((option) => {
          const descriptionId = option.description ? `tool-desc-${option.names[0]}` : undefined;
          return (
            <div key={option.names[0]}>
              <label className={rowStyle}>
                <input
                  type="checkbox"
                  checked={option.names.every((name) => !disabled.has(name))}
                  aria-describedby={descriptionId}
                  onChange={(event) => onToggle(option.names, event.target.checked)}
                />
                {/* LocaleText, not useLocale: a hook cannot be called once per item in a map. */}
                <span>{option.label ? <LocaleText label={option.label} /> : option.names.join(", ")}</span>
              </label>
              {/* Outside the <label>, linked by aria-describedby rather than nested inside it:
                  nesting would fold this text into the checkbox's accessible *name* (the thing
                  getByLabelText/screen readers announce as "what is this"), turning "Image
                  generation" into "Image generation Creates a picture from your description" —
                  wrong for a screen reader and it broke label-text queries in tests. Outside the
                  label it is a *description*, a separate, correct accessibility relationship. */}
              {option.description && (
                <p id={descriptionId} className={descriptionStyle}>
                  <LocaleText label={option.description} />
                </p>
              )}
            </div>
          );
        })}
      </div>
      {!anyEnabled && (
        <div className={noteStyle}>
          <LocaleText label="assistent.noToolsNote" />
        </div>
      )}
    </div>
  );
}
