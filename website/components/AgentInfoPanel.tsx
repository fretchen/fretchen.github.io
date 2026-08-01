/**
 * Expandable Agent Info Panel
 *
 * Shows agent information with transparency about the backend service.
 * Displays:
 * - Agent name and wallet address (clickable to show JSON)
 * - Service endpoints
 * - Trust mechanisms
 *
 * Following EIP-8004 (Trustless Agents) format.
 *
 * Supports two variants:
 * - "footer": Horizontal layout for wide areas (default)
 * - "sidebar": Vertical layout for narrow sidebars
 */

import React, { useState } from "react";
import { css } from "../styled-system/css";
import { useAgentInfo } from "../hooks/useAgentInfo";
import { useLocale } from "../hooks/useLocale";
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { getGenAiNFTAddress, GENAI_NFT_NETWORKS } from "@fretchen/chain-utils";
import type { AgentCard } from "../hooks/x402Discovery";

interface AgentInfoPanelProps {
  // Service context (for display purposes)
  service?: "genimg" | "llm";
  // Layout variant
  variant?: "footer" | "sidebar";
  // When set (llm escape hatch), show this pre-checked agent's provenance instead of the
  // default single-tenant registration file. Derived live from the agent's own /openapi.json.
  agentCard?: AgentCard | null;
}

export function AgentInfoPanel({ service = "genimg", variant = "footer", agentCard = null }: AgentInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { agent, isLoading, error } = useAgentInfo();

  // Localized texts
  const poweredByText = useLocale({ label: "imagegen.poweredBy" });

  // Get contract address based on service - hooks must be called before early returns
  const { network: genimgNetwork } = useAutoNetwork(GENAI_NFT_NETWORKS);

  const isSidebar = variant === "sidebar";

  // llm path: render honest provenance (operator + origin + payTo) read live from the agent's
  // own /openapi.json + 402 — who the user actually pays. Third-party agents (not a *.fretchen.eu
  // origin) additionally carry an at-your-own-risk note. The multi-agent picker that would make
  // a third-party card appear here isn't rendered yet (see AssistantChat / the plan).
  if (agentCard) {
    let isThirdParty = true;
    try {
      isThirdParty = !new URL(agentCard.origin).hostname.endsWith("fretchen.eu");
    } catch {
      // Unparseable origin — treat as third-party (safer disclosure).
    }
    return (
      <div className={css({ fontSize: "xs", color: "gray.700" })}>
        <div className={css({ fontWeight: "semibold" })}>{agentCard.operator ?? agentCard.origin}</div>
        <div className={css({ color: "gray.500", wordBreak: "break-all" })}>{agentCard.origin}</div>
        {agentCard.payTo && (
          <div className={css({ fontFamily: "code", color: "gray.600", mt: "1" })} title="Payment recipient">
            pays → {agentCard.payTo.slice(0, 6)}…{agentCard.payTo.slice(-4)}
          </div>
        )}
        {isThirdParty && <div className={css({ color: "warning", mt: "1" })}>third-party agent · at your own risk</div>}
      </div>
    );
  }

  // The llm service is card-driven (above). Before the card resolves, show a compact
  // placeholder rather than falling through to the legacy registration-file rendering (which
  // carries the retired "Become a provider" / EIP-8004 JSON links we don't want on /assistent).
  if (service === "llm") {
    return (
      <div className={css({ fontSize: "xs", color: "gray.500", textAlign: isSidebar ? "left" : "center", mt: "2" })}>
        Loading agent…
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={css({ fontSize: "xs", color: "gray.500", textAlign: isSidebar ? "left" : "center", mt: "2" })}>
        {poweredByText} Optimism...
      </div>
    );
  }

  if (error || !agent.wallet) {
    // Fallback to basic display
    return (
      <div className={css({ fontSize: "xs", color: "gray.600", textAlign: isSidebar ? "left" : "center", mt: "2" })}>
        {poweredByText}{" "}
        <a
          href="https://optimism.io"
          target="_blank"
          rel="noopener noreferrer"
          className={css({
            color: "brand",
            textDecoration: "none",
            fontWeight: "semibold",
            _hover: { textDecoration: "underline" },
          })}
        >
          Optimism
        </a>
      </div>
    );
  }

  const serviceEndpoint = service === "genimg" ? agent.genimgEndpoint : agent.llmEndpoint;
  const serviceHostname = serviceEndpoint ? new URL(serviceEndpoint).hostname : null;

  // "llm" (x402 batch-settlement) has no dedicated deployed contract to link — the
  // canonical batch-settlement contract is shared infrastructure, not owned by this
  // project (see assistent_plan.md "Infrastructure: consume, don't deploy").
  const contractAddress = service === "genimg" ? getGenAiNFTAddress(genimgNetwork) : null;

  // Sidebar variant - vertical layout
  if (isSidebar) {
    return (
      <div className={css({ fontSize: "xs" })}>
        {/* Compact Header */}
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "gray.600",
            cursor: "pointer",
            _hover: { color: "gray.800" },
          })}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className={css({ display: "flex", alignItems: "center", gap: "1" })}>
            <span>🤖</span>
            <span className={css({ fontFamily: "code", color: "blue.600" })}>{agent.walletShort}</span>
          </span>
          <span
            className={css({
              color: "gray.400",
              transition: "transform {durations.normal} ease",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            })}
          >
            ▼
          </span>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div
            className={css({
              mt: "2",
              pt: "2",
              borderTop: "1px solid",
              borderColor: "gray.200",
            })}
          >
            {/* Agent Name */}
            <div className={css({ display: "flex", alignItems: "center", gap: "2", mb: "2" })}>
              {agent.image && (
                <img
                  src={agent.image}
                  alt={agent.name}
                  className={css({
                    width: "20px",
                    height: "20px",
                    borderRadius: "full",
                    objectFit: "cover",
                  })}
                />
              )}
              <span className={css({ fontWeight: "semibold", color: "gray.800", fontSize: "xs" })}>{agent.name}</span>
            </div>

            {/* Details */}
            <div className={css({ display: "grid", gap: "1", color: "gray.600", fontSize: "xs" })}>
              {serviceHostname && (
                <div>
                  <span className={css({ color: "gray.500" })}>Endpoint: </span>
                  <code className={css({ fontFamily: "code", color: "gray.700" })}>{serviceHostname}</code>
                </div>
              )}
              <div>
                <span className={css({ color: "gray.500" })}>Trust: </span>
                <span>{agent.supportedTrust.join(", ") || "none"}</span>
              </div>
            </div>

            {/* Links - Vertical */}
            <div
              className={css({
                display: "flex",
                flexDirection: "column",
                gap: "1",
                mt: "2",
                pt: "2",
                borderTop: "1px solid",
                borderColor: "gray.200",
              })}
            >
              <a
                href="/agent-registration.json"
                target="_blank"
                rel="noopener noreferrer"
                className={css({
                  color: "brand",
                  textDecoration: "none",
                  fontSize: "xs",
                  _hover: { textDecoration: "underline" },
                })}
              >
                📄 EIP-8004 JSON
              </a>
              {contractAddress && (
                <a
                  href={`https://optimistic.etherscan.io/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css({
                    color: "brand",
                    textDecoration: "none",
                    fontSize: "xs",
                    _hover: { textDecoration: "underline" },
                  })}
                >
                  📜 Contract
                </a>
              )}
            </div>
          </div>
        )}

        {/* Add Agent Link - Always visible */}
        <a
          href="/agent-onboarding/"
          className={css({
            display: "block",
            mt: "2",
            pt: "2",
            borderTop: "1px solid",
            borderColor: "gray.200",
            color: "brand",
            textDecoration: "none",
            fontSize: "xs",
            fontWeight: "semibold",
            _hover: { textDecoration: "underline" },
          })}
        >
          🆕 Become a provider
        </a>
      </div>
    );
  }

  // Footer variant - horizontal layout (default)
  return (
    <div className={css({ mt: "2", fontSize: "xs" })}>
      {/* Compact Header - Always visible */}
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "2",
          color: "gray.600",
        })}
      >
        <span
          className={css({
            cursor: "pointer",
            _hover: { color: "gray.800" },
            display: "inline-flex",
            alignItems: "center",
            gap: "2",
          })}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{poweredByText} Optimism</span>
          <span>•</span>
          <span
            className={css({
              fontFamily: "code",
              color: "blue.600",
              display: "inline-flex",
              alignItems: "center",
              gap: "1",
            })}
            title={`Agent: ${agent.wallet}`}
          >
            🤖 {agent.walletShort}
          </span>
          <span
            className={css({
              color: "gray.400",
              transition: "transform {durations.normal} ease",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            })}
          >
            ▼
          </span>
        </span>
        <span>•</span>
        <a
          href="/agent-onboarding/"
          className={css({
            color: "brand",
            textDecoration: "none",
            fontWeight: "semibold",
            _hover: { textDecoration: "underline" },
          })}
        >
          Add your agent →
        </a>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div
          className={css({
            mt: "3",
            p: "3",
            bg: "gray.50",
            border: "1px solid",
            borderColor: "gray.200",
            borderRadius: "md",
            textAlign: "left",
          })}
        >
          {/* Agent Name & Image */}
          <div className={css({ display: "flex", alignItems: "center", gap: "2", mb: "2" })}>
            {agent.image && (
              <img
                src={agent.image}
                alt={agent.name}
                className={css({
                  width: "24px",
                  height: "24px",
                  borderRadius: "full",
                  objectFit: "cover",
                })}
              />
            )}
            <span className={css({ fontWeight: "semibold", color: "gray.800" })}>{agent.name}</span>
            <span
              className={css({
                ml: "auto",
                px: "2",
                py: "0.5",
                bg: "green.100",
                color: "green.700",
                borderRadius: "full",
                fontSize: "xs",
              })}
            >
              ✓ Active
            </span>
          </div>

          {/* Details Grid */}
          <div className={css({ display: "grid", gap: "1", color: "gray.600" })}>
            {/* Wallet */}
            <div className={css({ display: "flex", gap: "2" })}>
              <span className={css({ color: "gray.500", minWidth: "60px" })}>Wallet:</span>
              <code
                className={css({
                  fontFamily: "code",
                  fontSize: "xs",
                  color: "gray.700",
                  wordBreak: "break-all",
                })}
              >
                {agent.wallet}
              </code>
            </div>

            {/* Service Endpoint */}
            {serviceHostname && (
              <div className={css({ display: "flex", gap: "2" })}>
                <span className={css({ color: "gray.500", minWidth: "60px" })}>Endpoint:</span>
                <code
                  className={css({
                    fontFamily: "code",
                    fontSize: "xs",
                    color: "gray.700",
                  })}
                >
                  {serviceHostname}
                </code>
              </div>
            )}

            {/* Trust */}
            <div className={css({ display: "flex", gap: "2" })}>
              <span className={css({ color: "gray.500", minWidth: "60px" })}>Trust:</span>
              <span>{agent.supportedTrust.join(", ") || "none"}</span>
            </div>
          </div>

          {/* Links */}
          <div
            className={css({
              display: "flex",
              gap: "3",
              mt: "3",
              pt: "2",
              borderTop: "1px solid",
              borderColor: "gray.200",
            })}
          >
            <a
              href="/agent-registration.json"
              target="_blank"
              rel="noopener noreferrer"
              className={css({
                color: "brand",
                textDecoration: "none",
                fontWeight: "semibold",
                _hover: { textDecoration: "underline" },
              })}
            >
              📄 EIP-8004 JSON
            </a>
            {agent.openApiUrl && (
              <a
                href={agent.openApiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={css({
                  color: "brand",
                  textDecoration: "none",
                  fontWeight: "semibold",
                  _hover: { textDecoration: "underline" },
                })}
              >
                📋 OpenAPI Spec
              </a>
            )}
            {contractAddress && (
              <a
                href={`https://optimistic.etherscan.io/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className={css({
                  color: "brand",
                  textDecoration: "none",
                  fontWeight: "semibold",
                  _hover: { textDecoration: "underline" },
                })}
              >
                📜 Contract
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentInfoPanel;
