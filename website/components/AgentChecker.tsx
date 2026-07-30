/**
 * AgentChecker — a diagnostic for the "Build Your Own Agent" page.
 *
 * Paste an endpoint URL → runs the exact llm/v1 compatibility checks the assistant applies
 * (via `checkLlmV1Agent`) and shows every step's pass/fail/warn with a fix hint. Purely
 * diagnostic: no wallet, no payment, no "use this agent" — unlike the payment-focused
 * AgentSelector used in the chat sidebar.
 */
import React, { useState } from "react";
import { css } from "../styled-system/css";
import { checkLlmV1Agent, type CheckReport, type CheckStatus } from "../hooks/x402Discovery";

const ICON: Record<CheckStatus, string> = { pass: "✅", fail: "❌", warn: "⚠️" };
const COLOR: Record<CheckStatus, string> = { pass: "green.700", fail: "red.600", warn: "amber.700" };

const inputStyle = css({
  flex: "1",
  minWidth: "0",
  fontSize: "sm",
  px: "3",
  py: "2",
  border: "1px solid",
  borderColor: "gray.300",
  borderRadius: "md",
  _focus: { outline: "none", borderColor: "brand" },
});

const buttonStyle = css({
  px: "4",
  py: "2",
  fontSize: "sm",
  fontWeight: "medium",
  bg: "brand",
  color: "white",
  borderRadius: "md",
  cursor: "pointer",
  _hover: { bg: "blue.700" },
  _disabled: { opacity: 0.5, cursor: "not-allowed" },
});

export function AgentChecker() {
  const [url, setUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [report, setReport] = useState<CheckReport | null>(null);

  const run = async () => {
    const trimmed = url.trim();
    if (!trimmed || checking) return;
    setChecking(true);
    setReport(null);
    try {
      setReport(await checkLlmV1Agent(trimmed));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <div className={css({ display: "flex", gap: "2", flexWrap: "wrap", alignItems: "center" })}>
        <input
          type="url"
          inputMode="url"
          placeholder="https://your-agent.example"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void run();
            }
          }}
          disabled={checking}
          className={inputStyle}
        />
        <button onClick={() => void run()} disabled={checking || !url.trim()} className={buttonStyle}>
          {checking ? "Checking…" : "Check my endpoint"}
        </button>
      </div>

      {report && (
        <div className={css({ mt: "4" })}>
          <div
            className={css({
              fontSize: "sm",
              fontWeight: "semibold",
              mb: "2",
              color: report.ok ? "green.700" : "red.600",
            })}
          >
            {report.ok
              ? "✅ Compatible — the assistant could use this endpoint."
              : "❌ Not yet compatible — see below."}
          </div>
          <ul className={css({ display: "grid", gap: "2" })}>
            {report.steps.map((step) => (
              <li key={step.id} className={css({ display: "flex", gap: "2", alignItems: "flex-start" })}>
                <span aria-hidden className={css({ flexShrink: 0 })}>
                  {ICON[step.status]}
                </span>
                <span className={css({ fontSize: "sm" })}>
                  <span className={css({ fontWeight: "medium", color: COLOR[step.status] })}>{step.label}</span>
                  <span
                    className={css({
                      color: "gray.600",
                      display: "block",
                      fontSize: "xs",
                      mt: "0.5",
                      wordBreak: "break-word",
                    })}
                  >
                    {step.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className={css({ fontSize: "xs", color: "gray.500", mt: "3", lineHeight: "1.6" })}>
            The checks run from your browser, so a failure can also mean CORS: your endpoint must send{" "}
            <code className={css({ fontFamily: "mono" })}>Access-Control-Allow-Origin</code> and expose the{" "}
            <code className={css({ fontFamily: "mono" })}>Payment-Required</code> header.
          </p>
        </div>
      )}
    </div>
  );
}

export default AgentChecker;
